from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.db.models.user import UserLogin
from passlib.context import CryptContext

import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings, logger
import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from app.core.db_instance import db

class Database:
    def __init__(self):
        self.postgres_pool = None
        self.mongo_client = None
        self.mongo_db = None

    async def connect(self):
        try:
            self.postgres_pool = await asyncpg.create_pool(
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD,
                database=settings.POSTGRES_DB,
                host=settings.POSTGRES_HOST,
                port=settings.POSTGRES_PORT,
                min_size=1,
                max_size=10
            )
            logger.info("PostgreSQL pool initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL pool: {e}")
            self.postgres_pool = None

        try:
            self.mongo_client = AsyncIOMotorClient(f"mongodb://{settings.MONGO_HOST}:{settings.MONGO_PORT}")
            self.mongo_db = self.mongo_client[settings.MONGO_DB]
            # Trigger a simple call to ensure connection
            await self.mongo_client.admin.command("ping")
            logger.info("MongoDB client initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB: {e}")
            self.mongo_client = None
            self.mongo_db = None
    async def disconnect(self):
        await  self.postgres_pool.close() 
        self.mongo_client.close() 
    
    async def init_postgres(self):
        async with self.postgres_pool.acquire() as conn: 
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL
                );
            """)
            # Insert a test user (for demo purposes)
            hashed_password = pwd_context.hash("testpassword")
            await conn.execute(
                "INSERT INTO users (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING;",
                "test@example.com", hashed_password)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception
    async with db.postgres_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id, email FROM users WHERE id = $1", user_id)
        if user is None:
            raise credentials_exception
        return user