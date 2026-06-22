import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db

# Create an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in the in-memory test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Override the app dependency
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_root_redirect():
    """Test that root URL redirects to the static index page."""
    response = client.get("/", follow_redirects=False)
    assert response.status_code in [302, 307]
    assert response.headers["location"] == "/static/index.html"

def test_static_files():
    """Test that static web pages and assets load successfully."""
    # Test index.html
    response = client.get("/static/index.html")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Skill Development Hub" in response.text or "Skill" in response.text

    # Test style.css
    response = client.get("/static/style.css")
    assert response.status_code == 200
    assert "text/css" in response.headers["content-type"]

    # Test app.js
    response = client.get("/static/app.js")
    assert response.status_code == 200
    assert "javascript" in response.headers["content-type"]

    # Test signup.html
    response = client.get("/static/signup.html")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "SkillCraft | Join Us" in response.text or "Sign Up" in response.text

    # Test signup.js
    response = client.get("/static/signup.js")
    assert response.status_code == 200
    assert "javascript" in response.headers["content-type"]

def test_auth_and_skills_flow():
    """Test the complete auth signup, login, and skills CRUD lifecycle."""
    # 1. Signup a new user
    user_payload = {
        "email": "testuser@example.com",
        "password": "securepassword123"
    }
    signup_response = client.post("/api/auth/signup", json=user_payload)
    assert signup_response.status_code == 201
    assert signup_response.json()["email"] == user_payload["email"]
    assert "id" in signup_response.json()

    # 2. Try to signup again with the same email (should fail)
    signup_dup_response = client.post("/api/auth/signup", json=user_payload)
    assert signup_dup_response.status_code == 400
    assert signup_dup_response.json()["detail"] == "Email already registered"

    # 3. Try to login with incorrect password
    bad_login_payload = {
        "email": "testuser@example.com",
        "password": "wrongpassword"
    }
    bad_login_response = client.post("/api/auth/login", json=bad_login_payload)
    assert bad_login_response.status_code == 401

    # 4. Login with correct password
    login_response = client.post("/api/auth/login", json=user_payload)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 5. Access skills without token (should fail)
    no_auth_response = client.get("/api/skills")
    assert no_auth_response.status_code == 401

    # 6. Retrieve skills (should be empty initially)
    skills_response = client.get("/api/skills", headers=headers)
    assert skills_response.status_code == 200
    assert skills_response.json() == []

    # 7. Create a new skill
    skill_payload = {
        "title": "Python Programming",
        "category": "Software Engineering",
        "level": "Intermediate",
        "description": "Learn advanced Python features and paradigms",
        "status": "In Progress",
        "progress": 45
    }
    create_response = client.post("/api/skills", json=skill_payload, headers=headers)
    assert create_response.status_code == 201
    created_skill = create_response.json()
    assert created_skill["title"] == skill_payload["title"]
    assert created_skill["progress"] == 45
    assert "id" in created_skill

    skill_id = created_skill["id"]

    # 8. Get specific skill
    get_skill_response = client.get(f"/api/skills/{skill_id}", headers=headers)
    assert get_skill_response.status_code == 200
    assert get_skill_response.json()["title"] == "Python Programming"

    # 9. Update the skill
    update_payload = {
        "progress": 90,
        "status": "Mastered"
    }
    update_response = client.put(f"/api/skills/{skill_id}", json=update_payload, headers=headers)
    assert update_response.status_code == 200
    assert update_response.json()["progress"] == 90
    assert update_response.json()["status"] == "Mastered"

    # 10. Delete the skill
    delete_response = client.delete(f"/api/skills/{skill_id}", headers=headers)
    assert delete_response.status_code == 200

    # 11. Get deleted skill (should return 404)
    get_deleted_response = client.get(f"/api/skills/{skill_id}", headers=headers)
    assert get_deleted_response.status_code == 404
