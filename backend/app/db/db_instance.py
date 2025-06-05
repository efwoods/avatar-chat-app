from app.core.config import settings, logger
import asyncpg
from app.core.monitoring import metrics
from motor.motor_asyncio import AsyncIOMotorClient
from app.db.database import db
from app.db.sql import init_schema_postgres

async def init_postgres():
    try:
        db.postgres_pool = await asyncpg.create_pool(
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database=settings.POSTGRES_DB,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            min_size=1,
            max_size=10
        )

        logger.info("PostgreSQL pool initialized.")
        metrics.db_connection_status.labels(database="postgres").set(1)

        async with db.postgres_pool.acquire() as conn:
            await conn.execute(init_schema_postgres)
            logger.info("PostgreSQL schema initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL pool: {e}")
        db.postgres_pool = None
        metrics.db_connection_status.labels(database="postgres").set(0)

async def init_mongodb():
    try:
        db.mongo_client = AsyncIOMotorClient(f"mongodb://{settings.MONGO_HOST}:{settings.MONGO_PORT}")
        db.mongo_db = db.mongo_client[settings.MONGO_DB]
        await db.mongo_client.admin.command("ping")
        logger.info("MongoDB client initialized.")
        metrics.db_connection_status.labels(database="mongodb").set(1)
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB: {e}")
        db.mongo_client = None
        db.mongo_db = None
        metrics.db_connection_status.labels(database="mongodb").set(0)

async def db_connect():
    logger.info("Database.connect() called")
    await init_postgres()
    await init_mongodb()
    logger.info(f"Database connection pools: postgres_pool={db.postgres_pool}, mongo_client={db.mongo_client}")
    logger.info(f"[connect] Database instance id: {id(db.get_id())}")

async def db_disconnect():
    if db.postgres_pool:
        await db.postgres_pool.close()
        metrics.db_connection_status.labels(database="postgres").set(0)
    if db.mongo_client:
        db.mongo_client.close()
    metrics.db_connection_status.labels(database="mongodb").set(0)