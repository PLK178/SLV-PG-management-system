from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserOut(UserBase):
    id: int
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class SubTaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    is_completed: Optional[bool] = False

class SubTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)

class SubTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    is_completed: Optional[bool] = None

class SubTaskOut(SubTaskBase):
    id: int
    skill_id: int

    class Config:
        from_attributes = True

class SkillBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    level: str = Field(..., pattern="^(Beginner|Intermediate|Advanced)$")
    description: Optional[str] = None
    status: Optional[str] = Field("Not Started", pattern="^(Not Started|In Progress|Mastered)$")
    progress: Optional[int] = Field(0, ge=0, le=100)

class SkillCreate(SkillBase):
    pass

class SkillUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    level: Optional[str] = Field(None, pattern="^(Beginner|Intermediate|Advanced)$")
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(Not Started|In Progress|Mastered)$")
    progress: Optional[int] = Field(None, ge=0, le=100)

class SkillOut(SkillBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubTaskOut] = []

    class Config:
        from_attributes = True

