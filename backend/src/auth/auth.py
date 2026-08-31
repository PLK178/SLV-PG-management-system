from fastapi import APIRouter, HTTPException, status
from ..db.database import get_db_connection
from ..db.schemas import AdminLoginRequest, TenantLoginRequest
from ..utils.security import verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/admin/login")
def admin_login(payload: AdminLoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admins WHERE email = %s", (payload.email.lower(),))
    admin = cursor.fetchone()
    conn.close()
    
    if not admin or not verify_password(payload.password, admin["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin email or password"
        )
    return {"status": "success", "role": "admin", "email": admin["email"]}

@router.post("/tenant/login")
def tenant_login(payload: TenantLoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tenants WHERE LOWER(email) = %s", (payload.email.lower(),))
    tenant = cursor.fetchone()
    conn.close()
    
    if not tenant or not verify_password(payload.password, tenant["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tenant email or password"
        )
    
    return {
        "id": tenant["id"],
        "name": tenant["name"],
        "email": tenant["email"],
        "phone": tenant["phone"],
        "room": tenant["room"],
        "joinDate": tenant["joinDate"],
        "paymentStatus": tenant["paymentStatus"]
    }
