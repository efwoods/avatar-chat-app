from pyngrok import ngrok
from app.core.config import settings, logger
from app.core.monitoring import metrics
import asyncio
import httpx
import json 

_ngrok_tunnel = None
_ngrok_url = None
_ngrok_lock = asyncio.Lock()

async def get_ngrok_client():
    global _ngrok_url, _ngrok_tunnel
    async with _ngrok_lock:
        if _ngrok_tunnel is None:
            try:
                ngrok.set_auth_token(settings.NGROK_AUTH_TOKEN)
                _ngrok_tunnel = ngrok.connect(settings.WEBSOCKET_PORT, "http", bind_tls=True)
                # Explicitly await ngrok URL confirmation (if using async pyngrok wrapper)
                timeout = 10
                while not _ngrok_tunnel.public_url and timeout > 0:
                    logger.info(f"Waiting for ngrok public_url, timeout remaining: {timeout}s")
                    await asyncio.sleep(0.5)
                    timeout -= 0.5
                if _ngrok_tunnel.public_url:
                    _ngrok_url = _ngrok_tunnel.public_url.replace("https", "wss")
                    logger.info(f"Ngrok WebSocket URL: {_ngrok_url}")
                    metrics.ngrok_connections.inc()
                    # Logic to update github GIST with ngrok URL
                    try:
                        async with httpx.AsyncClient() as client:
                            gist_url = f"https://api.github.com/gists/{settings.VITE_GITHUB_GIST_ID}"
                            headers = {"Authorization": f"token {settings.GITHUB_TOKEN}"}
                            # data = json.dumps({ "ws_url": _ngrok_url })

                            gist_data = {
                                "description": "Ngrok WebSocket URL",
                                "files": {
                                    "ngrok_url.txt": {
                                        "content": _ngrok_url
                                    }
                                }
                            }
                            response = await client.patch(gist_url, headers=headers, json=gist_data)
                            response.raise_for_status() 
                            logger.info(f"Registered backend URL: {_ngrok_url}")
                            metrics.github_gist_url_updated.labels(database="github_gist").set(1)
                    except Exception as e:
                        metrics.github_gist_update_errors.inc()
                        raise RuntimeError(f"Failed to register backend URL: {e}")
                else:
                    metrics.ngrok_errors.inc()
                    raise RuntimeError("Ngrok tunnel failed to get public_url.")
                        
            except Exception as e:
                metrics.ngrok_errors.inc()
                _ngrok_tunnel = None
                _ngrok_url = None
                raise RuntimeError(f"Failed to start ngrok: {e}")
    logger.info(f"Websocket URL requested: {_ngrok_url}")
    return _ngrok_url
    

async def close_ngrok_tunnel():
    global _ngrok_url, _ngrok_tunnel
    if _ngrok_url is not None:
        try:
            await ngrok.disconnect(_ngrok_tunnel)
            logger.info("Ngrok tunnel disconnected")
            metrics.ngrok_connections.dec()
            _ngrok_tunnel = None
            _ngrok_url = None
        except Exception as e:
            logger.error(f"Failed to disconnect ngrok: {e}")
            metrics.ngrok_errors.inc()

