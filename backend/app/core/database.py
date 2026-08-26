import sqlite3
import os
import json
import hashlib
import secrets
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "neurocheck.db")

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, key_hex = stored_hash.split("$", 1)
        calc_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return secrets.compare_digest(calc_key.hex(), key_hex)
    except Exception:
        return False

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                full_name TEXT NOT NULL,
                hashed_password TEXT NOT NULL,
                role TEXT DEFAULT 'patient',
                age INTEGER,
                medical_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Screening history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS screening_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT NOT NULL,
                composite_score REAL NOT NULL,
                risk_tier TEXT NOT NULL,
                motor_score REAL,
                acoustic_score REAL,
                spiral_score REAL,
                details_json TEXT,
                care_plan_markdown TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        conn.commit()

        # Seed default clinician
        cursor.execute("SELECT id FROM users WHERE username = 'clinician'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (username, email, full_name, hashed_password, role, age, medical_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "clinician",
                "doctor@neurocheck.health",
                "Dr. Sarah Vance, MD",
                hash_password("neurocheck2026"),
                "doctor",
                45,
                "DOC-9921"
            ))

        # Seed default patient
        cursor.execute("SELECT id FROM users WHERE username = 'demo_patient'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (username, email, full_name, hashed_password, role, age, medical_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "demo_patient",
                "john.doe@example.com",
                "John Doe",
                hash_password("patient123"),
                "patient",
                68,
                "PT-48201"
            ))
        conn.commit()

# Run DB initialization
init_db()

def create_user(username: str, password: str, full_name: str, email: Optional[str] = None, role: str = "patient", age: Optional[int] = None, medical_id: Optional[str] = None) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()
        hashed = hash_password(password)
        try:
            cursor.execute("""
                INSERT INTO users (username, email, full_name, hashed_password, role, age, medical_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (username, email, full_name, hashed, role, age, medical_id))
            conn.commit()
            user_id = cursor.lastrowid
            return {
                "id": user_id,
                "username": username,
                "email": email,
                "full_name": full_name,
                "role": role,
                "age": age,
                "medical_id": medical_id
            }
        except sqlite3.IntegrityError:
            raise ValueError("An account with this username or email already exists.")

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username))
        row = cursor.fetchone()
        if not row:
            return None
        if not verify_password(password, row["hashed_password"]):
            return None
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "full_name": row["full_name"],
            "role": row["role"],
            "age": row["age"],
            "medical_id": row["medical_id"]
        }

def save_screening_result(username: str, composite_score: float, risk_tier: str, motor_score: Optional[float] = None, acoustic_score: Optional[float] = None, spiral_score: Optional[float] = None, details: Optional[Dict[str, Any]] = None, care_plan_markdown: Optional[str] = None) -> int:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        user_id = row["id"] if row else None
        
        cursor.execute("""
            INSERT INTO screening_records (user_id, username, composite_score, risk_tier, motor_score, acoustic_score, spiral_score, details_json, care_plan_markdown)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            username,
            composite_score,
            risk_tier,
            motor_score,
            acoustic_score,
            spiral_score,
            json.dumps(details or {}),
            care_plan_markdown
        ))
        conn.commit()
        return cursor.lastrowid

def get_user_history(username: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM screening_records WHERE username = ? ORDER BY created_at DESC LIMIT 20
        """, (username,))
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "username": r["username"],
                "composite_score": r["composite_score"],
                "risk_tier": r["risk_tier"],
                "motor_score": r["motor_score"],
                "acoustic_score": r["acoustic_score"],
                "spiral_score": r["spiral_score"],
                "details": json.loads(r["details_json"]) if r["details_json"] else {},
                "care_plan_markdown": r["care_plan_markdown"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]
