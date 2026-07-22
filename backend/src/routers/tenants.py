from fastapi import APIRouter, HTTPException
from typing import List
from ..db.database import get_db_connection
from ..db.schemas import TenantSchema
from ..utils.security import hash_password

router = APIRouter(prefix="/tenants", tags=["Tenants"])

@router.get("", response_model=List[TenantSchema])
def get_tenants():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, phone, room, joinDate, paymentStatus FROM tenants")
    rows = cursor.fetchall()
    conn.close()
    
    # We do not return the passwords in the standard list
    return [dict(row) for row in rows]

@router.post("")
def save_tenants(tenants: List[TenantSchema]):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT email, password FROM tenants")
        password_map = {row["email"].lower(): row["password"] for row in cursor.fetchall()}
        
        cursor.execute("DELETE FROM tenants")
        for tenant in tenants:
            email_lower = tenant.email.lower()
            # Respect the custom password if provided, otherwise fallback to existing password or default "tenant123"
            password = tenant.password if (tenant.password and tenant.password.strip()) else (password_map.get(email_lower) or "tenant123")
            
            # Hash the password if it's not already a bcrypt hash
            if not (password.startswith("$2b$") or password.startswith("$2a$")):
                password = hash_password(password)
                
            cursor.execute(
                "INSERT INTO tenants (id, name, email, phone, room, joinDate, paymentStatus, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (tenant.id, tenant.name, tenant.email, tenant.phone, tenant.room, tenant.joinDate, tenant.paymentStatus, password)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    return {"status": "success"}
