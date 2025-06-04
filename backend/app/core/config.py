from pydantic import BaseSettings
import torch
import logging
from dotenv import load_dotenv
from pathlib import Path
import os
# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv(dotenv_path=Path(__file__).resolve().parents[3] / ".env.local")

class Settings(BaseSettings):
    NGROK_AUTH_TOKEN: str 
    FASTAPI_PORT: int = 8765
    WEBSOCKET_PORT: int = 8765
    SAMPLE_RATE: int = 16000
    CHUNK_DURATION: int = 5  # seconds
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

settings = Settings() # type: ignore