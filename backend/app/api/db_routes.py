from datetime import datetime
from uuid import UUID
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
from app.db.models.avatar import AvatarCreate, Message
from bson.objectid import ObjectId
import json
from app.core.config import logger
from app.db.sql import signup_user, update_last_user_login, select_id_with_user_email, login_user, create_avatar_sql, get_all_avatars_per_user

router = APIRouter()

@router.post("/signup", status_code=201)
async def signup(user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    async with db.postgres_pool.acquire() as conn:
        try:
            await conn.execute(
                signup_user,
                user.username,
                user.email,
                hashed_password,
                datetime.now(),
            )
            
            # Retrieve user ID (you can alternatively use RETURNING in the INSERT)
            row = await conn.fetchrow(select_id_with_user_email, user.email)
            if not row:
                raise HTTPException(status_code=500, detail="Failed to retrieve user after creation.")

            user_id = str(row["id"])
            access_token = create_access_token(data={"sub": user_id})

            # Cache the token in Redis
            redis_client = await get_redis_client()
            await redis_client.setex(f"token:{access_token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, user_id)
            
            await conn.execute(
                update_last_user_login,
                datetime.now(),
                user_id
            )

            logger.info("User created successfully")
            return {"access_token": access_token, "token_type": "bearer"}

        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Email already registered.")
        
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    async with db.postgres_pool.acquire() as conn:
        row = await conn.fetchrow(login_user, form_data.username)
        if not row or not pwd_context.verify(form_data.password, row["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        access_token = create_access_token(data={"sub": str(row["id"])})
        redis_client = await get_redis_client()
        await redis_client.setex(f"token:{access_token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, str(row["id"]))
        await conn.execute(update_last_user_login, datetime.now(), row["id"]) # update the user's last login timef
        return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # Client should delete token; no server state to clear with JWT
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.debug(f"Logout payload: {payload}")
        user_id = payload.get("sub")
        redis_client = await get_redis_client()
        await redis_client.delete(f"token:{token}")
        return {"message": "Logout successful. Please delete the token on client side."}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token.")

@router.get("/profile")
async def profile(current_user: asyncpg.Record = Depends(get_current_user)):
    return {
        "id": str(current_user["id"]),
        "username": str(current_user["username"]),
        "email": current_user["email"]
    }

# Avatars
@router.post("/avatars/create")
async def create_avatar(
    avatar: AvatarCreate,
    current_user=Depends(get_current_user)
):
    async with db.postgres_pool.acquire() as conn:
        avatar_id: UUID = await conn.fetchval(
            create_avatar_sql,
            current_user["id"], avatar.name, avatar.description
        )
    return {"avatar_id": str(avatar_id)}  # return string form of UUID for frontend use

@router.get("/avatars")
async def get_avatars(current_user=Depends(get_current_user)):
    async with db.postgres_pool.acquire() as conn:
        rows = await conn.fetch(
            get_all_avatars_per_user,
            current_user["id"]
        )
    return [dict(row) for row in rows]

# Load from Mongodb -> Redis
@router.get("/avatars/{avatar_id}/select")
async def select_avatar(avatar_id: int, current_user=Depends(get_current_user)):
    redis_client = await get_redis_client()
    redis_key = f"avatar:{avatar_id}:messages"
    
    cached = await redis_client.get(redis_key)
    if cached:
        messages = json.loads(cached)
    else:
        collection = db.mongo_db["avatar_conversations"]
        doc = await collection.find_one({
            "avatar_id": avatar_id,
            "user_id": str(current_user["id"])
        })
        if not doc:
            raise HTTPException(status_code=404, detail="No conversation found for avatar.")
        messages = doc.get("messages", [])
        await redis_client.set(redis_key, json.dumps(messages))

    return {"avatar_id": avatar_id, "messages": messages}

# Send Message
@router.post("/avatars/message")
async def post_message(msg: Message, current_user=Depends(get_current_user)):
    redis_client = await get_redis_client()
    redis_key = f"avatar:{msg.avatar_id}:messages"

    cached = await redis_client.get(redis_key)
    messages = json.loads(cached) if cached else []

    messages.append({"role": msg.role, "content": msg.content})
    await redis_client.set(redis_key, json.dumps(messages))

    # Persist to MongoDB
    collection = db.mongo_db["avatar_conversations"]
    await collection.update_one(
        {"avatar_id": msg.avatar_id, "user_id": str(current_user["id"])},
        {"$set": {"last_updated": datetime.utcnow()}, "$push": {"messages": {"role": msg.role, "content": msg.content}}},
        upsert=True
    )
    return {"status": "message stored"}

@router.get("/db/health")
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