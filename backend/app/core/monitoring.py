from prometheus_client import Counter, Gauge

health_requests = Counter("health_requests_total", "Total health check requests")
websocket_url_requests = Counter("websocket_url_requests_total", "Total WebSocket URL requests")
active_websockets = Gauge("active_websockets", "Number of active WebSocket connections")
transcriptions_processed = Counter("transcriptions_processed_total", "Total transcriptions processed")
ngrok_connections = Counter("ngrok_connections_total", "Total ngrok connections established")
ngrok_errors = Counter("ngrok_errors_total", "Total ngrok connection errors")
websocket_errors = Counter("websocket_errors_total", "Total WebSocket errors")

class Metrics:
    def __init__(self):
        self.health_requests = health_requests
        self.websocket_url_requests = websocket_url_requests
        self.active_websockets = active_websockets
        self.transcriptions_processed = transcriptions_processed
        self.ngrok_connections = ngrok_connections
        self.ngrok_errors = ngrok_errors
        self.websocket_errors = websocket_errors

metrics = Metrics()