from fastapi import APIRouter, Depends
from app.db.models.user import UserLogin, UserCreate
from fastapi import APIRouter, HTTPException
from core.config import settings
from core.config import logger
from app.db.models.user import Token
from app.service.auth import create_access_token, get_current_user, oauth2_scheme
import asyncpg
from app.core.security import pwd_context
from app.core.monitoring import metrics
from app.core.redis_instance import get_redis_client
import jwt
from app.core.monitoring import metrics
from app.db.database import db

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
        redis_client = get_redis_client()
        await redis_client.setex(f"token:{access_token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, str(row["id"]))
        return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # Client should delete token; no server state to clear with JWT
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        redis_client = get_redis_client()
        await redis_client.delete(f"token:{token}")
        return {"message": "Logout successful. Please delete the token on client side."}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/profile")
async def profile(current_user=Depends(get_current_user)):
    return {"id": current_user["id"], "email": current_user["email"]}

@router.get("/test-db")
async def test_db():
    if db.postgres_pool:
        return {"status": "postgres pool exists"}
    return {"status": "postgres pool is None"}


@router.get("/health")
async def health():
    metrics.health_requests.inc()
    logger.info(f"[health] Database instance id: {id(db)}, pool={db.postgres_pool}, mongo={db.mongo_client}")

    postgres_ok = False
    if db.postgres_pool:
        logger.info("Postgres pool is initialized, attempting test query")
        try:
            async with db.postgres_pool.acquire() as conn:
                result = await conn.execute("SELECT 1")
                logger.info(f"Postgres test query result: {result}")
                postgres_ok = True
        except Exception as e:
            logger.error(f"PostgreSQL health check failed: {type(e).__name__}: {e}")
    else:
        logger.error("Postgres pool is None")
    # Check MongoDB connection
    mongo_ok = False
    if db.mongo_client is not None and db.mongo_db is not None:
        try:
            await db.mongo_client.admin.command("ping")
            mongo_ok = True
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
    
    # Check Redis connection
    redis_ok = False
    redis_client = await get_redis_client()
    if redis_client:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
    else:
        logger.error("Redis client not initialized yet")

    metrics.db_connection_status.labels(database="redis").set(1 if redis_ok else 0)

    # Update metrics
    metrics.db_connection_status.labels(database="postgres").set(1 if postgres_ok else 0)
    metrics.db_connection_status.labels(database="mongodb").set(1 if mongo_ok else 0)
    metrics.db_connection_status.labels(database="redis").set(1 if redis_ok else 0)
    
    status = "healthy" if postgres_ok and mongo_ok and redis_ok else "degraded"
    
    return {
        "status": status,
        "postgres": postgres_ok,
        "mongodb": mongo_ok,
        "redis": redis_ok
    }