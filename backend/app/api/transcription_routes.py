from app.core.config import settings
from fastapi import APIRouter
from fastapi import WebSocket
from app.core.monitoring import metrics
from app.service.transcription import transcribe_audio
from app.core.config import logger
from app.core.ngrok_instance import get_ngrok_client
import json

router = APIRouter()

@router.get("/websocket-url")
async def get_websocket_url():
    metrics.websocket_url_requests.inc()
    ngrok_state = await get_ngrok_client()
    logger.info(f"Websocket URL requested: {ngrok_state + '/transcription/ws'}")
    return {"websocket_url": ngrok_state + '/transcription/ws' or f"ws://localhost:{settings.WEBSOCKET_PORT} + '/transcription/ws'"}

@router.websocket("/ws")
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