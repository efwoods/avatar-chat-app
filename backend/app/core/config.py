from pydantic import BaseSettings
import torch
import logging
from dotenv import load_dotenv
from pathlib import Path
import jwt
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
class Settings(BaseSettings):
    POSTGRES_DB: str = "mvp_db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_HOST: str = "postgres_db"
    POSTGRES_PORT: int = 5432

    MONGO_HOST: str = "mongo_db"
    MONGO_PORT: int = 27017
    MONGO_DB: str = "mvp_media"

    FASTAPI_PORT: int = 8765
    WEBSOCKET_PORT: int = 8765
    NGROK_AUTH_TOKEN: str
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    class Config:
        env_file = ".env"

settings = Settings() 