from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models.user import UserLogin, UserCreate
from fastapi import APIRouter, HTTPException
from core.config import settings
from app.core.db_instance import db
from core.config import logger
from app.db.models.user import Token
from app.service.auth import create_access_token, get_current_user
import asyncpg
from app.core.security import pwd_context
from app.core.monitoring import metrics

router = APIRouter()

@router.post("/signup", status_code=201)
async def signup(user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    async with db.postgres_pool.acquire() as conn:
        try:
            await conn.execute(
                "INSERT INTO users (email, password) VALUES ($1, $2)",
                user.email,
                hashed_password,
            )
            return {"message": "User created successfully"}
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Email already registered")

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    async with db.postgres_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, password FROM users WHERE email = $1", user.email)
        if not row or not pwd_context.verify(user.password, row["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        access_token = create_access_token(data={"sub": str(row["id"])})
        return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout():
    # Client should delete token; no server state to clear with JWT
    return {"message": "Logout successful. Please delete the token on client side."}

@router.get("/profile")
async def profile(current_user=Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"]}

@router.get("/health")
async def health():
    metrics.health_requests.inc()
    postgres_ok = db.postgres_pool is not None
    mongo_ok = db.mongo_client is not None and db.mongo_db is not None
    return {
        "status": "healthy" if postgres_ok and mongo_ok else "degraded",
        "postgres": postgres_ok,
        "mongodb": mongo_ok
    }
