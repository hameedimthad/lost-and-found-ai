import os
import uuid
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .database import (
    init_db,
    create_report,
    get_reports,
    get_report_by_id,
    get_candidate_records_for_matching,
    update_report_status,
    delete_report,
    get_db_connection
)
from .ai_engine import (
    extract_advanced_features,
    find_matches_for_embeddings,
    compare_two_feature_sets,
    call_gemini_vision_comparison
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

init_db()

app = FastAPI(title="Lost & Found AI Portal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "ai_engine": "FaceNet VGGFace2 Biometric + MobileNetV3 Invariant Matching",
        "database": "SQLite Connected"
    }

@app.post("/api/reports")
async def create_new_report(
    report_type: str = Form(...),          # 'lost' or 'found'
    category: str = Form(...),             # 'person' or 'animal'
    contact_number: str = Form(...),
    location: str = Form(...),
    name: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    last_seen_dress: Optional[str] = Form(None),
    birth_mark: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    details: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    x_gemini_api_key: Optional[str] = Header(None)
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required")

    saved_image_paths = []
    embeddings = []

    for file in files:
        unique_name = f"{uuid.uuid4().hex[:10]}_{os.path.basename(file.filename)}"
        destination_path = os.path.join(UPLOADS_DIR, unique_name)
        
        content = await file.read()
        with open(destination_path, "wb") as f:
            f.write(content)
        
        saved_image_paths.append(unique_name)
        
        # Extract advanced invariant features (FaceNet VGGFace2 + MobileNetV3)
        try:
            feat = extract_advanced_features(content)
            embeddings.append(feat)
        except Exception as e:
            print(f"Error computing features for {file.filename}: {e}")

    report = create_report(
        report_type=report_type.lower(),
        category=category.lower(),
        contact_number=contact_number,
        location=location,
        image_paths=saved_image_paths,
        embeddings=embeddings,
        name=name,
        age=age,
        last_seen_dress=last_seen_dress,
        birth_mark=birth_mark,
        latitude=latitude,
        longitude=longitude,
        details=details
    )

    # Automatic cross-matching
    target_type = "lost" if report_type.lower() == "found" else "found"
    candidates = get_candidate_records_for_matching(target_type, category.lower())
    matches = find_matches_for_embeddings(embeddings, candidates, threshold_percent=45)

    return {
        "success": True,
        "report": report,
        "automatic_matches": matches,
        "match_count": len(matches)
    }

@app.get("/api/reports")
def list_reports(
    report_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100)
):
    reports = get_reports(report_type=report_type, category=category, status=status, limit=limit)
    return {"reports": reports}

@app.get("/api/reports/{report_id}")
def fetch_report(report_id: int):
    report = get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.get("/api/reports/{report_id}/matches")
def find_report_matches(report_id: int, threshold: int = Query(45)):
    report = get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    embeddings = report.get("embeddings", [])
    if not embeddings:
        return {"matches": [], "count": 0}

    target_type = "lost" if report["report_type"] == "found" else "found"
    candidates = get_candidate_records_for_matching(target_type, report["category"])
    
    matches = find_matches_for_embeddings(embeddings, candidates, threshold_percent=threshold)
    return {
        "report": report,
        "matches": matches,
        "count": len(matches)
    }

@app.post("/api/match-image")
async def match_arbitrary_image(
    file: UploadFile = File(...),
    category: str = Form("person"),
    target_type: str = Form("lost"),
    threshold: int = Form(45)
):
    content = await file.read()
    try:
        feat = extract_advanced_features(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process image: {e}")

    candidates = get_candidate_records_for_matching(target_type.lower(), category.lower())
    matches = find_matches_for_embeddings([feat], candidates, threshold_percent=threshold)
    
    return {
        "matches": matches,
        "count": len(matches)
    }

class DeepCompareRequest(BaseModel):
    report1_id: int
    report2_id: int
    gemini_api_key: Optional[str] = None

@app.post("/api/deep-compare")
def run_deep_comparison(req: DeepCompareRequest):
    """
    Detailed invariant comparison between two reports (e.g. Lost and Sighted)
    accounting for potential hair, beard, and clothing differences.
    """
    r1 = get_report_by_id(req.report1_id)
    r2 = get_report_by_id(req.report2_id)
    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both reports not found")

    embs1 = r1.get("embeddings", [])
    embs2 = r2.get("embeddings", [])
    
    local_result = None
    if embs1 and embs2:
        local_result = compare_two_feature_sets(embs1[0], embs2[0], category=r1.get("category", "person"))

    gemini_result = None
    if req.gemini_api_key or os.environ.get("GEMINI_API_KEY"):
        img1_path = os.path.join(UPLOADS_DIR, r1["image_paths"][0])
        img2_path = os.path.join(UPLOADS_DIR, r2["image_paths"][0])
        if os.path.exists(img1_path) and os.path.exists(img2_path):
            with open(img1_path, "rb") as f1, open(img2_path, "rb") as f2:
                gemini_result = call_gemini_vision_comparison(
                    f1.read(),
                    f2.read(),
                    context=f"Report 1: {r1.get('name')}, Age: {r1.get('age')}, Last dress: {r1.get('last_seen_dress')}, Mark: {r1.get('birth_mark')}",
                    api_key=req.gemini_api_key
                )

    return {
        "report1": r1,
        "report2": r2,
        "biometric_comparison": local_result,
        "gemini_forensic_analysis": gemini_result
    }

class StatusUpdateRequest(BaseModel):
    status: str

@app.patch("/api/reports/{report_id}/status")
def change_report_status(report_id: int, req: StatusUpdateRequest):
    success = update_report_status(report_id, req.status)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "status": req.status}

@app.delete("/api/reports/{report_id}")
def remove_report(report_id: int):
    success = delete_report(report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True}

@app.get("/api/stats")
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT report_type, category, status, COUNT(*) as cnt FROM reports GROUP BY report_type, category, status")
    rows = cursor.fetchall()
    conn.close()
    
    stats = {
        "total_lost": 0,
        "total_found": 0,
        "reunited": 0,
        "active_cases": 0
    }
    for r in rows:
        d = dict(r)
        if d["report_type"] == "lost":
            stats["total_lost"] += d["cnt"]
        elif d["report_type"] == "found":
            stats["total_found"] += d["cnt"]
        if d["status"] == "reunited":
            stats["reunited"] += d["cnt"]
        elif d["status"] == "active":
            stats["active_cases"] += d["cnt"]
    return stats

# Serve built frontend static files
FRONTEND_DIST = os.path.join(BASE_DIR, "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
