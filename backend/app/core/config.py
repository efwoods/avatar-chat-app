from pydantic import BaseSettings
import torch
import logging

# Logging config
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # PostgreSQL
    POSTGRES_DB: str = "mvp_db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # MongoDB
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_DB: str = "mvp_media"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str

    # Ngrok / WebSocket
    FASTAPI_PORT: int = 8765
    WEBSOCKET_PORT: int = 8765
    NGROK_AUTH_TOKEN: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Torch Device
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

    class Config:
        env_file = ".env"  # Local development only

settings = Settings()
