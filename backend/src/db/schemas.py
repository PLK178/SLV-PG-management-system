from pydantic import BaseModel, Field
from typing import Optional, List

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class TenantLoginRequest(BaseModel):
    email: str
    password: str

class RoomSchema(BaseModel):
    id: Optional[int] = None
    number: str
    type: str
    rent: float
    floor: str
    status: str

class TenantSchema(BaseModel):
    id: Optional[int] = None
    name: str
    email: str
    phone: str
    room: str
    joinDate: str
    paymentStatus: str
    password: Optional[str] = "tenant123"

class PaymentSchema(BaseModel):
    id: Optional[int] = None
    tenant: str
    amount: float
    date: str
    method: str
    status: str

class ComplaintSchema(BaseModel):
    id: Optional[int] = None
    tenant: str
    room: str
    issue: str
    severity: str
    status: str

class OutingSchema(BaseModel):
    id: Optional[int] = None
    tenant: str
    room: str
    departureTime: str
    expectedReturnTime: str
    actualReturnTime: Optional[str] = None
    purpose: str
    status: str
