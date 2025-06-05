from motor.motor_asyncio import AsyncIOMotorClient
import asyncpg
from app.core.config import settings, logger
from app.core.security import pwd_context

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
            await self.mongo_client.admin.command("ping")
            logger.info("MongoDB client initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB: {e}")
            self.mongo_client = None
            self.mongo_db = None

    async def disconnect(self):
        if self.postgres_pool:
            await self.postgres_pool.close()
        if self.mongo_client:
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
            hashed_password = pwd_context.hash("testpassword")
            await conn.execute("""
                INSERT INTO users (email, password)
                VALUES ($1, $2)
                ON CONFLICT (email) DO NOTHING;
            """, "test@example.com", hashed_password)
