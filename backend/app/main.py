import asyncio
import json
import logging
import os
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
import uvicorn

# Configurations & Metrics
from core import state 
from core.config import settings
from core.monitoring import metrics
from core.config import logger

# API Routes
from api.db_routes import router as db_router
from api.transcription_routes import router as transcription_router
from api.media_routes import router as media_router

# Services
from service.database import db

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
app.include_router(media_router, prefix="/api/media", tags=["Media"])

# Store ngrok public URL

@app.on_event("startup")
async def startup_event():
    await db.connect()
    await db.init_postgres()

    try:
        ngrok.set_auth_token(settings.NGROK_AUTH_TOKEN)
        tunnel = ngrok.connect(settings.WEBSOCKET_PORT, "http", bind_tls=True)
        state.ngrok_url = tunnel.public_url.replace("https", "wss")
        logger.info(f"Ngrok WebSocket URL: {state.ngrok_url}")
        metrics.ngrok_connections.inc()
    except Exception as e:
        logger.error(f"Failed to start ngrok: {e}")
        metrics.ngrok_errors.inc()

@app.on_event("shutdown")
async def shutdown_event():
    ngrok.disconnect(state.ngrok_url)
    logger.info("Ngrok tunnel disconnected")
    await db.disconnect()

@app.get("/api/health")
async def health():
    metrics.health_requests.inc()
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.FASTAPI_PORT)