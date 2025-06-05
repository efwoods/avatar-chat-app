# app/core/redis_instance.py

import asyncio
import redis.asyncio as redis
from app.core.config import settings
from app.core.config import logger
from app.core.monitoring import metrics

_redis_client = None
_redis_lock = asyncio.Lock()

async def get_redis_client():
    global _redis_client
    async with _redis_lock:
        if _redis_client is None:
            try:
                _redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD,
                    decode_responses=True,
                )
                # Test connection once at startup
                await _redis_client.ping()
                logger.info("Redis client initialized.")
                metrics.db_connection_status.labels(database="redis").set(1)
            except Exception as e:
                logger.error(f"Failed to initialize Redis client: {e}")
                metrics.db_connection_status.labels(database="redis").set(0)
                _redis_client = None
    return _redis_client

async def close_redis_client():
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.close()        # Close connection pool
            await _redis_client.wait_closed()  # Wait for connections to close
            logger.info("Redis client closed.")
            _redis_client = None
            metrics.db_connection_status.labels(database="redis").set(0)
        except Exception as e:
            logger.error(f"Failed to close Redis client: {e}")
