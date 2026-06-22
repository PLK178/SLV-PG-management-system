from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List

from .db.database import engine, get_db, Base
from .db import models, schemas, crud, redis_cache
from . import auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Skill Development Hub API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Endpoints
@app.post("/api/auth/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_pwd = auth.get_password_hash(user.password)
    return crud.create_user(db=db, user=user, hashed_password=hashed_pwd)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"user_id": db_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# API Endpoints (protected)
@app.get("/api/skills", response_model=List[schemas.SkillOut])
def read_skills(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check cache first
    cached_skills = redis_cache.get_skills_cache(current_user.id)
    if cached_skills is not None:
        return cached_skills

    db_skills = crud.get_skills(db, owner_id=current_user.id, skip=skip, limit=limit)
    
    # Serialize to JSON-friendly list of dicts
    serialized_skills = []
    for s in db_skills:
        skill_dict = schemas.SkillOut.model_validate(s).model_dump()
        skill_dict["created_at"] = skill_dict["created_at"].isoformat()
        skill_dict["updated_at"] = skill_dict["updated_at"].isoformat()
        serialized_skills.append(skill_dict)
        
    redis_cache.set_skills_cache(current_user.id, serialized_skills)
    return db_skills

@app.post("/api/skills", response_model=schemas.SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill: schemas.SkillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_skill = crud.create_skill(db=db, skill=skill, owner_id=current_user.id)
    redis_cache.clear_skills_cache(current_user.id)
    return db_skill

@app.get("/api/skills/{skill_id}", response_model=schemas.SkillOut)
def read_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_skill = crud.get_skill(db, skill_id=skill_id, owner_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return db_skill

@app.put("/api/skills/{skill_id}", response_model=schemas.SkillOut)
def update_skill(
    skill_id: int,
    skill: schemas.SkillUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_skill = crud.update_skill(db=db, skill_id=skill_id, skill_update=skill, owner_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    redis_cache.clear_skills_cache(current_user.id)
    return db_skill

@app.delete("/api/skills/{skill_id}", response_model=schemas.SkillOut)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_skill = crud.delete_skill(db=db, skill_id=skill_id, owner_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    redis_cache.clear_skills_cache(current_user.id)
    return db_skill

def recalculate_skill_progress(db: Session, skill_id: int):
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        return
    total_subtasks = len(db_skill.subtasks)
    if total_subtasks == 0:
        return
    completed_subtasks = sum(1 for s in db_skill.subtasks if s.is_completed)
    new_progress = int((completed_subtasks / total_subtasks) * 100)
    db_skill.progress = new_progress
    if new_progress == 100:
        db_skill.status = "Mastered"
    elif new_progress == 0:
        db_skill.status = "Not Started"
    else:
        db_skill.status = "In Progress"
    db.commit()
    db.refresh(db_skill)

# Subtask API Endpoints
@app.post("/api/skills/{skill_id}/subtasks", response_model=schemas.SubTaskOut, status_code=status.HTTP_201_CREATED)
def create_subtask(
    skill_id: int,
    subtask: schemas.SubTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_skill = crud.get_skill(db, skill_id=skill_id, owner_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    db_subtask = crud.create_subtask(db=db, subtask=subtask, skill_id=skill_id)
    recalculate_skill_progress(db, skill_id)
    redis_cache.clear_skills_cache(current_user.id)
    return db_subtask

@app.put("/api/subtasks/{subtask_id}", response_model=schemas.SubTaskOut)
def update_subtask(
    subtask_id: int,
    subtask_update: schemas.SubTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_subtask = crud.get_subtask(db, subtask_id=subtask_id)
    if db_subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
        
    db_skill = crud.get_skill(db, skill_id=db_subtask.skill_id, owner_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=403, detail="Not authorized to edit this subtask")
        
    updated = crud.update_subtask(db=db, subtask_id=subtask_id, subtask_update=subtask_update)
    recalculate_skill_progress(db, db_skill.id)
    redis_cache.clear_skills_cache(current_user.id)
    return updated

@app.delete("/api/subtasks/{subtask_id}", response_model=schemas.SubTaskOut)
def delete_subtask(
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_subtask = crud.get_subtask(db, subtask_id=subtask_id)
    if db_subtask is None:
        raise HTTPException(status_code=404, detail="Subtask not found")
        
    db_skill = crud.get_skill(db, skill_id=db_subtask.skill_id, owner_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=403, detail="Not authorized to delete this subtask")
        
    deleted = crud.delete_subtask(db=db, subtask_id=subtask_id)
    recalculate_skill_progress(db, db_skill.id)
    redis_cache.clear_skills_cache(current_user.id)
    return deleted

# Mount static files (must be mounted after API paths to avoid shadowing)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

