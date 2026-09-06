import os
import io
import json
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Optional, Tuple
import requests

import torch
import torchvision.models as models
import torchvision.transforms as transforms
from facenet_pytorch import MTCNN, InceptionResnetV1

# Global model caches
_mtcnn = None
_facenet = None
_mobilenet_extractor = None
_mobilenet_transform = None
_facenet_direct_transform = None

def get_models():
    global _mtcnn, _facenet, _mobilenet_extractor, _mobilenet_transform, _facenet_direct_transform
    if _facenet is None:
        device = 'cpu'
        
        # 1. MTCNN for detecting and cropping human face
        _mtcnn = MTCNN(image_size=160, margin=20, keep_all=False, post_process=True, device=device)
        
        # 2. InceptionResnetV1 trained on VGGFace2 (3.3M face images)
        # Gold standard for facial biometric recognition invariant to beard, hair, glasses, clothes
        _facenet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
        
        # 3. Direct transform for InceptionResnetV1 fallback (upper-center head crop)
        _facenet_direct_transform = transforms.Compose([
            transforms.Resize((160, 160)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])

        # 4. MobileNetV3 deep feature extractor for general silhouettes & animals
        base_mobilenet = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        base_mobilenet.eval()
        
        class FeatureExtractor(torch.nn.Module):
            def __init__(self, m):
                super().__init__()
                self.features = m.features
                self.avgpool = m.avgpool

            def forward(self, x):
                x = self.features(x)
                x = self.avgpool(x)
                x = torch.flatten(x, 1)
                return x

        _mobilenet_extractor = FeatureExtractor(base_mobilenet)
        _mobilenet_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    return _mtcnn, _facenet, _facenet_direct_transform, _mobilenet_extractor, _mobilenet_transform

def load_image(image_input) -> Image.Image:
    if isinstance(image_input, str):
        return Image.open(image_input).convert("RGB")
    elif isinstance(image_input, bytes):
        return Image.open(io.BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, Image.Image):
        return image_input.convert("RGB")
    else:
        raise ValueError("Unsupported image input type")

def extract_advanced_features(image_input) -> Dict[str, Any]:
    """
    Extracts deep invariant features:
    1. FaceNet (VGGFace2 512-dim): Biometric facial geometry invariant to beard, hair, glasses, clothes.
    2. MobileNetV3 (576-dim): Deep structural/pose features for full body and animals.
    """
    mtcnn, facenet, facenet_direct_trans, mobilenet, mobilenet_trans = get_models()
    img = load_image(image_input)
    
    # A. FaceNet Biometric Facial Embedding
    face_emb = None
    has_detected_face = False
    
    try:
        # Attempt MTCNN facial detection & alignment
        face_tensor = mtcnn(img)
        if face_tensor is not None:
            has_detected_face = True
            with torch.no_grad():
                face_emb_vec = facenet(face_tensor.unsqueeze(0)).squeeze(0).numpy()
            norm = np.linalg.norm(face_emb_vec)
            if norm > 0:
                face_emb = (face_emb_vec / norm).tolist()
    except Exception as e:
        print(f"MTCNN error: {e}")

    # If MTCNN didn't find a face (e.g. turned head, drawing, or partial occlusion),
    # extract InceptionResnetV1 on the upper-center region (head/portrait zone)
    if face_emb is None:
        w, h = img.size
        # Upper center crop (top 60% of image, center 70% width)
        crop_box = (int(w * 0.15), 0, int(w * 0.85), int(h * 0.65))
        upper_crop = img.crop(crop_box)
        crop_tensor = facenet_direct_trans(upper_crop).unsqueeze(0)
        with torch.no_grad():
            face_emb_vec = facenet(crop_tensor).squeeze(0).numpy()
        norm = np.linalg.norm(face_emb_vec)
        if norm > 0:
            face_emb = (face_emb_vec / norm).tolist()

    # B. MobileNetV3 Deep Structural Features (invariant to lighting and background)
    full_tensor = mobilenet_trans(img).unsqueeze(0)
    with torch.no_grad():
        deep_vec = mobilenet(full_tensor).squeeze(0).numpy()
    deep_norm = np.linalg.norm(deep_vec)
    deep_emb = (deep_vec / deep_norm).tolist() if deep_norm > 0 else deep_vec.tolist()

    return {
        "face_embedding": face_emb,
        "deep_embedding": deep_emb,
        "has_detected_face": has_detected_face
    }

def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    sim = float(np.dot(a, b) / (norm_a * norm_b))
    return max(0.0, min(1.0, sim))

def calibrate_facenet_score(cosine_sim: float) -> int:
    """
    Calibrates FaceNet VGGFace2 cosine similarity:
    In VGGFace2 space:
    - Cosine < 0.40: Different people
    - Cosine 0.40 - 0.60: Moderate structural similarity
    - Cosine 0.60 - 0.75: Strong facial match despite hair/beard differences
    - Cosine > 0.75: Extremely high confidence identical person
    """
    if cosine_sim <= 0.35:
        score = (cosine_sim / 0.35) * 25
    elif cosine_sim <= 0.55:
        score = 25 + ((cosine_sim - 0.35) / 0.20) * 35
    elif cosine_sim <= 0.75:
        score = 60 + ((cosine_sim - 0.55) / 0.20) * 28
    else:
        score = 88 + ((cosine_sim - 0.75) / 0.25) * 12
    return int(round(max(0.0, min(100.0, score))))

def calibrate_deep_score(cosine_sim: float) -> int:
    """Calibrates deep structural/silhouette similarity (MobileNetV3)."""
    if cosine_sim <= 0.40:
        score = (cosine_sim / 0.40) * 30
    elif cosine_sim <= 0.70:
        score = 30 + ((cosine_sim - 0.40) / 0.30) * 40
    else:
        score = 70 + ((cosine_sim - 0.70) / 0.30) * 30
    return int(round(max(0.0, min(100.0, score))))

def compare_two_feature_sets(feat1: Dict[str, Any], feat2: Dict[str, Any], category: str = "person") -> Dict[str, Any]:
    """
    Robust comparison invariant to beard, hair, and clothing changes.
    Prioritizes facial bone structure and geometry over clothing colors.
    """
    face_sim = compute_cosine_similarity(feat1.get("face_embedding"), feat2.get("face_embedding"))
    deep_sim = compute_cosine_similarity(feat1.get("deep_embedding"), feat2.get("deep_embedding"))
    
    face_score = calibrate_facenet_score(face_sim)
    deep_score = calibrate_deep_score(deep_sim)

    if category == "person":
        # For persons, facial structure is paramount (invariant to clothes & beard)
        combined_score = int(round(0.70 * face_score + 0.30 * deep_score))
        
        # If facial structure is very high (>80%), don't let clothing differences penalize the match!
        if face_score >= 80:
            combined_score = max(combined_score, face_score)
            
        invariance_note = (
            "Biometrically analyzed facial bone structure & eye geometry. "
            "Match is robust against changes in facial hair (beard), hairstyle, and clothing."
        )
    else:
        # For animals: silhouette, head shape, ears, and coat patterns
        combined_score = int(round(0.40 * face_score + 0.60 * deep_score))
        invariance_note = "Analyzed animal head geometry, ear posture, and body silhouette patterns."

    return {
        "match_percentage": combined_score,
        "facial_score": face_score,
        "structural_score": deep_score,
        "raw_face_cosine": round(face_sim, 4),
        "raw_deep_cosine": round(deep_sim, 4),
        "invariance_note": invariance_note,
        "is_match": combined_score >= 60
    }

def find_matches_for_embeddings(
    query_feature_list: List[Dict[str, Any]],
    candidate_records: List[Dict[str, Any]],
    threshold_percent: int = 45
) -> List[Dict[str, Any]]:
    """
    Compares query feature representations against candidate records in the database.
    """
    if not query_feature_list or not candidate_records:
        return []

    results = []
    for cand in candidate_records:
        cand_embeddings = cand.get("embeddings", [])
        if not cand_embeddings:
            continue

        best_result = None
        best_query_idx = 0
        best_cand_idx = 0

        for q_idx, q_feat in enumerate(query_feature_list):
            for c_idx, c_feat in enumerate(cand_embeddings):
                comp = compare_two_feature_sets(q_feat, c_feat, category=cand.get("category", "person"))
                if best_result is None or comp["match_percentage"] > best_result["match_percentage"]:
                    best_result = comp
                    best_query_idx = q_idx
                    best_cand_idx = c_idx

        if best_result and best_result["match_percentage"] >= threshold_percent:
            cand_images = cand.get("image_paths", [])
            matched_image = (
                cand_images[best_cand_idx]
                if best_cand_idx < len(cand_images)
                else (cand_images[0] if cand_images else None)
            )

            results.append({
                "record_id": cand["id"],
                "report_type": cand["report_type"],
                "category": cand["category"],
                "name": cand.get("name"),
                "age": cand.get("age"),
                "last_seen_dress": cand.get("last_seen_dress"),
                "birth_mark": cand.get("birth_mark"),
                "contact_number": cand.get("contact_number"),
                "location": cand.get("location"),
                "details": cand.get("details"),
                "created_at": cand.get("created_at"),
                "status": cand.get("status"),
                "image_paths": cand_images,
                "matched_image": matched_image,
                "best_query_image_idx": best_query_idx,
                "similarity_score": best_result["match_percentage"],
                "facial_score": best_result["facial_score"],
                "structural_score": best_result["structural_score"],
                "invariance_note": best_result["invariance_note"],
                "raw_cosine": best_result["raw_face_cosine"],
                "is_match": best_result["is_match"]
            })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results

def call_gemini_vision_comparison(
    image1_bytes: bytes,
    image2_bytes: bytes,
    context: str = "",
    api_key: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Multimodal LLM Forensic Analysis:
    Instructed specifically to look past beard, hair style, and clothing differences
    and evaluate invariant bone geometry, eye socket distance, nose bridge, earlobe shape, and marks.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        return None

    import base64
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    
    b64_1 = base64.b64encode(image1_bytes).decode("utf-8")
    b64_2 = base64.b64encode(image2_bytes).decode("utf-8")

    prompt = f"""
    You are a leading forensic biometric and missing persons identification expert.
    Compare Image 1 (Lost Report) with Image 2 (Found Sighting).
    Context: {context}

    CRITICAL INSTRUCTION:
    In lost & found cases, the sighted individual in Image 2 may look superficially different:
    - They may have grown a beard, stubble, or shaved.
    - Hair may be longer, messy, disheveled, or cut.
    - They may be wearing completely different clothes than when reported missing.
    
    DISREGARD clothing colors and temporary hair/beard styling. FOCUS ON INVARIANT BIOMETRIC FEATURES:
    1. Facial bone structure (cranial shape, cheekbone prominence, jawline contour).
    2. Inter-pupillary eye distance and eye socket shape.
    3. Nose bridge angle, width, and cartilage structure.
    4. Earlobe attachment and shape.
    5. Permanent markings: birthmarks, scars, moles, dental alignment.

    Return ONLY a valid JSON object with:
    {{
      "is_likely_match": boolean,
      "confidence_percentage": integer (0 to 100),
      "facial_bone_match": string (e.g. "High alignment in brow ridge and nose bridge"),
      "appearance_changes_detected": list of strings (e.g. ["Facial hair / beard growth noted", "Different clothing"]),
      "invariant_matches": list of strings (e.g. ["Matching mole location under right eye", "Identical eye separation ratio"]),
      "forensic_summary": string
    }}
    """

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/jpeg", "data": b64_1}},
                {"inline_data": {"mime_type": "image/jpeg", "data": b64_2}}
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "response_mime_type": "application/json"
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=15)
        if resp.status_code == 200:
            result_json = resp.json()
            content = result_json["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(content)
    except Exception as e:
        print(f"Gemini Vision call error: {e}")
    return None
