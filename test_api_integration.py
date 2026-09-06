import os
from fastapi.testclient import TestClient
from backend.main import app, UPLOADS_DIR

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("Health check endpoint passed.")

def test_get_reports():
    response = client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert len(data["reports"]) >= 4
    print(f"Get reports endpoint passed. Found {len(data['reports'])} reports.")

def test_found_submission_and_auto_match():
    # We test submitting a Found report using the image of Arjun Rao (demo_lost_person_arjun.jpg)
    arjun_img_path = os.path.join(UPLOADS_DIR, "demo_lost_person_arjun.jpg")
    assert os.path.exists(arjun_img_path), "Sample image should exist in uploads"

    with open(arjun_img_path, "rb") as f:
        img_bytes = f.read()

    files = [("files", ("found_arjun_test.jpg", img_bytes, "image/jpeg"))]
    form_data = {
        "report_type": "found",
        "category": "person",
        "contact_number": "+1 (555) 999-0000",
        "location": "Near 79th St Subway Station, New York",
        "details": "Found teenager wandering near the turnstiles wearing navy blue hoodie."
    }

    response = client.post("/api/reports", data=form_data, files=files)
    assert response.status_code == 200, f"Error: {response.text}"
    res = response.json()
    assert res["success"] is True
    assert "automatic_matches" in res
    matches = res["automatic_matches"]
    print(f"Matches found: {len(matches)}")
    assert len(matches) > 0, "Should have detected at least one match!"

    top_match = matches[0]
    print(f"Top Match: Name={top_match['name']}, Similarity={top_match['similarity_score']}%, Contact={top_match['contact_number']}")
    assert top_match["name"] == "Arjun Rao"
    assert top_match["similarity_score"] >= 90
    assert top_match["contact_number"] == "+1 (555) 234-5678"
    assert top_match["last_seen_dress"] == "Navy blue hoodie, dark blue denim jeans, white sneakers"
    print("Automatic AI Match & Contact Number Revelation test PASSED!")

if __name__ == "__main__":
    test_health()
    test_get_reports()
    test_found_submission_and_auto_match()
