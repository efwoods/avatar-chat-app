from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.models.user import UserLogin
from fastapi import APIRouter, HTTPException
from app.service.database import get_db_connection, pwd_context
from core.config import settings
from app.service.database import db

router = APIRouter()

@router.post("/login")
async def login(user: UserLogin):
    async with db.postgres_pool.acquire() as conn: 
        result = await conn.fetchrow("SELECT password FROM users WHERE email = $1", user.email)
        if not result or not pwd_context.verify(user.password, result['password']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return {"message": "Login successful"}


