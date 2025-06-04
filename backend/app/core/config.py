from pydantic import BaseSettings
import torch

class Settings(BaseSettings):
    NGROK_AUTH_TOKEN: str
    FASTAPI_PORT: int = 8765
    WEBSOCKET_PORT: int = 8765
    SAMPLE_RATE: int = 16000
    CHUNK_DURATION: int = 5  # seconds
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

    class Config:
        env_file = ".env.api"
        env_file_encoding = "utf-8"

settings = Settings()
