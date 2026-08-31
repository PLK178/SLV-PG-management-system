from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import PaymentSchema
from ..utils.cache import delete_cached, get_cached_json, set_cached_json

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentSchema])
def get_payments():
    cached_payments = get_cached_json("payments")
    if cached_payments is not None:
        return cached_payments

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments")
    rows = cursor.fetchall()
    conn.close()
    payments = [dict(row) for row in rows]
    set_cached_json("payments", payments)
    return payments

@router.post("")
def save_payments(payments: List[PaymentSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM payments")
        for p in payments:
            cursor.execute(
                "INSERT INTO payments (id, tenant, amount, date, method, status) VALUES (%s, %s, %s, %s, %s, %s)",
                (p.id, p.tenant, p.amount, p.date, p.method, p.status)
            )
        conn.commit()
        delete_cached("payments")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
