import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..db.database import init_db
from ..auth import auth
from . import rooms, tenants, payments, complaints, outings

# Initialize DB tables and seed data
init_db()

app = FastAPI(title="StayEase PG Management System Backend")

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(complaints.router, prefix="/api")
app.include_router(outings.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to StayEase PG Management System API"}

if __name__ == "__main__":
    uvicorn.run("backend.src.routers.main:app", host="0.0.0.0", port=8000, reload=True)
