from sqlalchemy.orm import Session
from . import models, schemas

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Skill operations (user-scoped)
def get_skills(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Skill).filter(models.Skill.owner_id == owner_id).order_by(models.Skill.updated_at.desc()).offset(skip).limit(limit).all()

def get_skill(db: Session, skill_id: int, owner_id: int):
    return db.query(models.Skill).filter(models.Skill.id == skill_id, models.Skill.owner_id == owner_id).first()

def create_skill(db: Session, skill: schemas.SkillCreate, owner_id: int):
    db_skill = models.Skill(**skill.model_dump(), owner_id=owner_id)
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

def update_skill(db: Session, skill_id: int, skill_update: schemas.SkillUpdate, owner_id: int):
    db_skill = get_skill(db, skill_id, owner_id)
    if not db_skill:
        return None
    
    update_data = skill_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_skill, key, value)
        
    db.commit()
    db.refresh(db_skill)
    return db_skill

def delete_skill(db: Session, skill_id: int, owner_id: int):
    db_skill = get_skill(db, skill_id, owner_id)
    if not db_skill:
        return None
    db.delete(db_skill)
    db.commit()
    return db_skill

# Subtask operations
def get_subtask(db: Session, subtask_id: int):
    return db.query(models.SubTask).filter(models.SubTask.id == subtask_id).first()

def create_subtask(db: Session, subtask: schemas.SubTaskCreate, skill_id: int):
    db_subtask = models.SubTask(**subtask.model_dump(), skill_id=skill_id)
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

def update_subtask(db: Session, subtask_id: int, subtask_update: schemas.SubTaskUpdate):
    db_subtask = get_subtask(db, subtask_id)
    if not db_subtask:
        return None
    update_data = subtask_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subtask, key, value)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

def delete_subtask(db: Session, subtask_id: int):
    db_subtask = get_subtask(db, subtask_id)
    if not db_subtask:
        return None
    db.delete(db_subtask)
    db.commit()
    return db_subtask

