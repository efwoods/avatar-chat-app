import asyncio
import json
import logging
import os
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
import uvicorn
from .transcription import transcribe_audio
from .config import settings
from .monitoring import metrics

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Real-Time Whisper Transcription Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store ngrok public URL
ngrok_url = None

@app.on_event("startup")
async def startup_event():
    global ngrok_url
    try:
        ngrok.set_auth_token(settings.NGROK_AUTH_TOKEN)
        tunnel = ngrok.connect(settings.WEBSOCKET_PORT, "http", bind_tls=True)
        ngrok_url = tunnel.public_url.replace("https", "wss")
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

@app.get("/api/websocket-url")
async def get_websocket_url():
    metrics.websocket_url_requests.inc()
    return {"websocket_url": ngrok_url or f"ws://localhost:{settings.WEBSOCKET_PORT}"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    metrics.active_websockets.inc()
    try:
        buffer = bytearray()
        while True:
            data = await websocket.receive_bytes()
            buffer.extend(data)
            chunk_size = settings.SAMPLE_RATE * settings.CHUNK_DURATION * 2  # 16-bit mono
            while len(buffer) >= chunk_size:
                chunk = buffer[:chunk_size]
                buffer = buffer[chunk_size:]
                result = await transcribe_audio(chunk)
                await websocket.send_text(json.dumps(result))
                metrics.transcriptions_processed.inc()
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        metrics.websocket_errors.inc()
    finally:
        await websocket.close()
        metrics.active_websockets.dec()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.FASTAPI_PORT)