from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
