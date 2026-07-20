from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import OutingSchema

router = APIRouter(prefix="/outings", tags=["Outings"])

@router.get("", response_model=List[OutingSchema])
def get_outings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outings")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("")
def save_outings(outings: List[OutingSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM outings")
        for o in outings:
            cursor.execute(
                "INSERT INTO outings (id, tenant, room, departureTime, expectedReturnTime, actualReturnTime, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (o.id, o.tenant, o.room, o.departureTime, o.expectedReturnTime, o.actualReturnTime, o.purpose, o.status)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
