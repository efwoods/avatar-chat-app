from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db.models.user import UserLogin
import psycopg2
from passlib.context import CryptContext

import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


# Database connection
def get_db_connection():
    return psycopg2.connect(
        dbname="mvp_db",
        user="postgres",
        password="password",
        host="db",
        port="5432"
    )

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize database
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );
    """)
    # Insert a test user (for demo purposes)
    hashed_password = pwd_context.hash("testpassword")
    cursor.execute(
        "INSERT INTO users (email, password) VALUES (%s, %s) ON CONFLICT (email) DO NOTHING;",
        ("test@example.com", hashed_password)
    )
    conn.commit()
    cursor.close()
    conn.close()

class Database:
    def __init__(self):
        self.postgres_pool = None
        self.mongo_client = None
        self.mongo_db = None

    async def connect(self):
        self.postgres_pool = await asyncpg.create_pool(
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database=settings.POSTGRES_DB,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            min_size=1,
            max_size=10
        )
        self.mongo_client = AsyncIOMotorClient(f"mongodb://{settings.MONGO_HOST}:{settings.MONGO_PORT}")
        self.mongo_db = self.mongo_client[settings.MONGO_DB]
    
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

db = Database()
