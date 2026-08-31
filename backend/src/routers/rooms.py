from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import RoomSchema
from ..utils.cache import delete_cached, get_cached_json, set_cached_json

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomSchema])
def get_rooms():
    cached_rooms = get_cached_json("rooms")
    if cached_rooms is not None:
        return cached_rooms

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rooms")
    rows = cursor.fetchall()
    conn.close()
    
    rooms = [dict(row) for row in rows]
    set_cached_json("rooms", rooms)
    return rooms

@router.post("")
def save_rooms(rooms: List[RoomSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # We overwrite the rooms table with the current UI state
        cursor.execute("DELETE FROM rooms")
        for room in rooms:
            cursor.execute(
                "INSERT INTO rooms (id, number, type, rent, floor, status) VALUES (%s, %s, %s, %s, %s, %s)",
                (room.id, room.number, room.type, room.rent, room.floor, room.status)
            )
        conn.commit()
        delete_cached("rooms")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
