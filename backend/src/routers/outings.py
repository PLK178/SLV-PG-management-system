from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import OutingSchema
from ..utils.cache import delete_cached, get_cached_json, set_cached_json

router = APIRouter(prefix="/outings", tags=["Outings"])

@router.get("", response_model=List[OutingSchema])
def get_outings():
    cached_outings = get_cached_json("outings")
    if cached_outings is not None:
        return cached_outings

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM outings")
    rows = cursor.fetchall()
    conn.close()
    outings = [dict(row) for row in rows]
    set_cached_json("outings", outings)
    return outings

@router.post("")
def save_outings(outings: List[OutingSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM outings")
        for o in outings:
            cursor.execute(
                'INSERT INTO outings (id, tenant, room, "departureTime", "expectedReturnTime", "actualReturnTime", purpose, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
                (o.id, o.tenant, o.room, o.departureTime, o.expectedReturnTime, o.actualReturnTime, o.purpose, o.status)
            )
        conn.commit()
        delete_cached("outings")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
