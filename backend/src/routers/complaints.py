from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import ComplaintSchema
from ..utils.cache import delete_cached, get_cached_json, set_cached_json

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("", response_model=List[ComplaintSchema])
def get_complaints():
    cached_complaints = get_cached_json("complaints")
    if cached_complaints is not None:
        return cached_complaints

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints")
    rows = cursor.fetchall()
    conn.close()
    complaints = [dict(row) for row in rows]
    set_cached_json("complaints", complaints)
    return complaints

@router.post("")
def save_complaints(complaints: List[ComplaintSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM complaints")
        for c in complaints:
            cursor.execute(
                "INSERT INTO complaints (id, tenant, room, issue, severity, status) VALUES (%s, %s, %s, %s, %s, %s)",
                (c.id, c.tenant, c.room, c.issue, c.severity, c.status)
            )
        conn.commit()
        delete_cached("complaints")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
