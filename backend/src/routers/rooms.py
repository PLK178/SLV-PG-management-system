from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import RoomSchema

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomSchema])
def get_rooms():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@router.post("")
def save_rooms(rooms: List[RoomSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # We overwrite the rooms table with the current UI state
        cursor.execute("DELETE FROM rooms")
        for room in rooms:
            cursor.execute(
                "INSERT INTO rooms (id, number, type, rent, floor, status) VALUES (?, ?, ?, ?, ?, ?)",
                (room.id, room.number, room.type, room.rent, room.floor, room.status)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
