from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import ComplaintSchema

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("", response_model=List[ComplaintSchema])
def get_complaints():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("")
def save_complaints(complaints: List[ComplaintSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM complaints")
        for c in complaints:
            cursor.execute(
                "INSERT INTO complaints (id, tenant, room, issue, severity, status) VALUES (?, ?, ?, ?, ?, ?)",
                (c.id, c.tenant, c.room, c.issue, c.severity, c.status)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
