import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "lost_and_found.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT NOT NULL,          -- 'lost' or 'found'
            category TEXT NOT NULL,             -- 'person' or 'animal'
            name TEXT,                          -- person name or pet name
            age TEXT,                           -- age or estimated age
            last_seen_dress TEXT,               -- dress/clothing worn
            birth_mark TEXT,                    -- birth mark or distinguishing physical mark
            contact_number TEXT NOT NULL,       -- phone number of uploader
            location TEXT NOT NULL,             -- location where lost or found
            latitude REAL,                      -- optional GPS lat
            longitude REAL,                     -- optional GPS lng
            details TEXT,                       -- notes / situation description
            image_paths TEXT NOT NULL,          -- JSON array of file paths
            embeddings TEXT,                    -- JSON array of 512-dim embedding arrays
            status TEXT DEFAULT 'active',       -- 'active', 'reunited', 'closed'
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def create_report(
    report_type: str,
    category: str,
    contact_number: str,
    location: str,
    image_paths: List[str],
    embeddings: List[List[float]],
    name: Optional[str] = None,
    age: Optional[str] = None,
    last_seen_dress: Optional[str] = None,
    birth_mark: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    details: Optional[str] = None,
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO reports (
            report_type, category, name, age, last_seen_dress, birth_mark,
            contact_number, location, latitude, longitude, details,
            image_paths, embeddings, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    """, (
        report_type,
        category,
        name,
        age,
        last_seen_dress,
        birth_mark,
        contact_number,
        location,
        latitude,
        longitude,
        details,
        json.dumps(image_paths),
        json.dumps(embeddings),
        created_at
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_report_by_id(report_id)

def get_report_by_id(report_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    data = dict(row)
    data["image_paths"] = json.loads(data["image_paths"]) if data["image_paths"] else []
    data["embeddings"] = json.loads(data["embeddings"]) if data.get("embeddings") else []
    return data

def get_reports(
    report_type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM reports WHERE 1=1"
    params = []
    if report_type:
        query += " AND report_type = ?"
        params.append(report_type)
    if category:
        query += " AND category = ?"
        params.append(category)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["image_paths"] = json.loads(d["image_paths"]) if d["image_paths"] else []
        # exclude heavy embeddings from list endpoint for speed
        d.pop("embeddings", None)
        results.append(d)
    return results

def get_candidate_records_for_matching(
    target_report_type: str,
    category: str
) -> List[Dict[str, Any]]:
    """Fetches candidate records with their embeddings to perform visual matching."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT id, report_type, category, name, age, last_seen_dress, birth_mark,
               contact_number, location, details, image_paths, embeddings, created_at, status
        FROM reports
        WHERE report_type = ? AND category = ? AND status = 'active'
    """
    cursor.execute(query, (target_report_type, category))
    rows = cursor.fetchall()
    conn.close()
    candidates = []
    for r in rows:
        d = dict(r)
        d["image_paths"] = json.loads(d["image_paths"]) if d["image_paths"] else []
        d["embeddings"] = json.loads(d["embeddings"]) if d["embeddings"] else []
        candidates.append(d)
    return candidates

def update_report_status(report_id: int, status: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE reports SET status = ? WHERE id = ?", (status, report_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def delete_report(report_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0
