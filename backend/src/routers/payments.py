from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import PaymentSchema

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentSchema])
def get_payments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@router.post("")
def save_payments(payments: List[PaymentSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM payments")
        for p in payments:
            cursor.execute(
                "INSERT INTO payments (id, tenant, amount, date, method, status) VALUES (?, ?, ?, ?, ?, ?)",
                (p.id, p.tenant, p.amount, p.date, p.method, p.status)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
