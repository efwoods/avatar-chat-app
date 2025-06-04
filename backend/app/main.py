import asyncio
import json
import logging
import os
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
import uvicorn
from .service.transcription import transcribe_audio
from .core.config import settings
from .core.monitoring import metrics
from .service.database import init_db
from .api.db_routes import router as db_router
from .api.transcription_routes import router as transcription_router
from .core.config import logger
from .core import state # type: ignore

app = FastAPI(title="Real-Time Whisper Transcription Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(db_router, prefix="/api/db", tags=["Database"])
app.include_router(transcription_router, prefix="/api/transcription", tags=["Transcription"])

# Store ngrok public URL
ngrok_url = None

@app.on_event("startup")
async def startup_event():
    init_db()

    global ngrok_url
    try:
        ngrok.set_auth_token(settings.NGROK_AUTH_TOKEN)
        tunnel = ngrok.connect(settings.WEBSOCKET_PORT, "http", bind_tls=True)
        state.ngrok_url = tunnel.public_url.replace("https", "wss")
        logger.info(f"Ngrok WebSocket URL: {ngrok_url}")
        metrics.ngrok_connections.inc()
    except Exception as e:
        logger.error(f"Failed to start ngrok: {e}")
        metrics.ngrok_errors.inc()

@app.on_event("shutdown")
async def shutdown_event():
    ngrok.disconnect(ngrok_url)
    logger.info("Ngrok tunnel disconnected")

@app.get("/api/health")
async def health():
    metrics.health_requests.inc()
    return {"status": "healthy"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.FASTAPI_PORT)