from sqlalchemy.orm import Session
from . import models, schemas

def get_skills(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Skill).order_by(models.Skill.updated_at.desc()).offset(skip).limit(limit).all()

def get_skill(db: Session, skill_id: int):
    return db.query(models.Skill).filter(models.Skill.id == skill_id).first()

def create_skill(db: Session, skill: schemas.SkillCreate):
    db_skill = models.Skill(**skill.model_dump())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

def update_skill(db: Session, skill_id: int, skill_update: schemas.SkillUpdate):
    db_skill = get_skill(db, skill_id)
    if not db_skill:
        return None
    
    update_data = skill_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_skill, key, value)
        
    db.commit()
    db.refresh(db_skill)
    return db_skill

def delete_skill(db: Session, skill_id: int):
    db_skill = get_skill(db, skill_id)
    if not db_skill:
        return None
    db.delete(db_skill)
    db.commit()
    return db_skill
