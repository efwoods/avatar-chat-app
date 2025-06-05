from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, status, Depends
from app.core.config import settings
import jwt
from datetime import datetime, timedelta
from app.db.database import db

# Instance-level shared components

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# get_current_user in app.service.auth
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception
    async with db.postgres_pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id, email FROM users WHERE id = $1", user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt