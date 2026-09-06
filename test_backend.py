import io
from PIL import Image, ImageDraw
import numpy as np

from backend.database import init_db, create_report, get_reports
from backend.ai_engine import extract_image_embedding, compute_cosine_similarity, calibrate_similarity_score

def create_dummy_image(color=(255, 0, 0), text="Test"):
    img = Image.new("RGB", (200, 200), color=color)
    d = ImageDraw.Draw(img)
    d.rectangle([(50, 50), (150, 150)], fill=(0, 255, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def run_tests():
    print("Testing database init...")
    init_db()
    print("DB initialized successfully.")

    print("Generating test images...")
    img1 = create_dummy_image(color=(255, 0, 0))
    img2 = create_dummy_image(color=(250, 5, 5)) # Very similar
    img3 = create_dummy_image(color=(0, 0, 255)) # Different

    print("Extracting embeddings...")
    emb1 = extract_image_embedding(img1)
    emb2 = extract_image_embedding(img2)
    emb3 = extract_image_embedding(img3)

    sim_1_2 = compute_cosine_similarity(emb1, emb2)
    sim_1_3 = compute_cosine_similarity(emb1, emb3)

    score_1_2 = calibrate_similarity_score(sim_1_2)
    score_1_3 = calibrate_similarity_score(sim_1_3)

    print(f"Similarity (Similar images): Cosine={sim_1_2:.4f}, Calibrated={score_1_2}%")
    print(f"Similarity (Different images): Cosine={sim_1_3:.4f}, Calibrated={score_1_3}%")

    assert sim_1_2 > sim_1_3, "Similar images should have higher similarity than different ones!"
    print("AI Feature Vector Cosine Similarity test passed!")

if __name__ == "__main__":
    run_tests()
