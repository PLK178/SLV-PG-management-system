from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List

from .database import engine, get_db, Base
from . import models, schemas, crud

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

# API Endpoints
@app.get("/api/skills", response_model=List[schemas.SkillOut])
def read_skills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_skills(db, skip=skip, limit=limit)

@app.post("/api/skills", response_model=schemas.SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(skill: schemas.SkillCreate, db: Session = Depends(get_db)):
    return crud.create_skill(db=db, skill=skill)

@app.get("/api/skills/{skill_id}", response_model=schemas.SkillOut)
def read_skill(skill_id: int, db: Session = Depends(get_db)):
    db_skill = crud.get_skill(db, skill_id=skill_id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return db_skill

@app.put("/api/skills/{skill_id}", response_model=schemas.SkillOut)
def update_skill(skill_id: int, skill: schemas.SkillUpdate, db: Session = Depends(get_db)):
    db_skill = crud.update_skill(db=db, skill_id=skill_id, skill_update=skill)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return db_skill

@app.delete("/api/skills/{skill_id}", response_model=schemas.SkillOut)
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    db_skill = crud.delete_skill(db=db, skill_id=skill_id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return db_skill

# Mount static files (must be mounted after API paths to avoid shadowing)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")
