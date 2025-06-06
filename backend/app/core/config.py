from pydantic import BaseSettings
import torch
import logging

# Logging config
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

logger.debug("This is a DEBUG message")
logger.info("This is an INFO message")
logger.error("This is an ERROR message")

class Settings(BaseSettings):
    # PostgreSQL
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str  # no default
    POSTGRES_PORT: int = 5432

    # MongoDB
    MONGO_DB: str
    MONGO_HOST: str
    MONGO_PORT: int = 27017

    # Redis
    REDIS_HOST: str
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str

    # Ngrok / WebSocket
    FASTAPI_PORT: int = 8765
    WEBSOCKET_PORT: int = 8765
    NGROK_AUTH_TOKEN: str
    REGISTRY_ENDPOINT: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Torch
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

    # Transcription
    SAMPLE_RATE = 16000
    CHUNK_DURATION = 5
    
    # GITHUB
    GITHUB_TOKEN: str
    VITE_GITHUB_GIST_ID: str

    class Config:
        env_file = ".env"


settings = Settings()
