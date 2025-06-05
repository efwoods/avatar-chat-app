from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Configurations & Metrics
from app.core.ngrok_instance import get_ngrok_client, close_ngrok_tunnel
from core.config import settings
from core.monitoring import metrics
from core.config import logger
# from core import redis_instance 
from app.db.db_instance import db_connect, db_disconnect

# API Routes
from api.db_routes import router as db_router
from api.transcription_routes import router as transcription_router
from api.media_routes import router as media_router

from app.core.redis_instance import get_redis_client, close_redis_client

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
app.include_router(db_router, tags=["Database"])
app.include_router(transcription_router, prefix="/transcription", tags=["Transcription"])
app.include_router(media_router, prefix="/media", tags=["Media"])

# Store ngrok public URL
@app.on_event("startup")
async def startup_event():
    await db_connect()
    await get_redis_client()
    await get_ngrok_client()

@app.on_event("shutdown")
async def shutdown_event():
    await close_ngrok_tunnel()
    await db_disconnect()
    await close_redis_client()
    
@app.get("/health")
async def health():
    metrics.health_requests.inc()
    return {"status": "healthy"}

@app.get("/metrics")
def metrics_endpoint():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.FASTAPI_PORT)