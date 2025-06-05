from prometheus_client import Counter, Gauge, REGISTRY

def get_or_create_metric(name, description, metric_type="counter", labelnames="None"):
    registry = REGISTRY._names_to_collectors
    labelnames = labelnames or []
    if name in registry:
        return registry[name]
    if metric_type == "counter":
        return Counter(name, description)
    elif metric_type == "gauge":
        if labelnames == "None":
            return Gauge(name, description)
        else:
            return Gauge(name, description, labelnames=labelnames)
    else:
        raise ValueError(f"Unsupported metric type: {metric_type}")


health_requests = get_or_create_metric("health_requests_total", "Total health check requests")
websocket_url_requests = get_or_create_metric("websocket_url_requests_total", "Total WebSocket URL requests")
active_websockets = get_or_create_metric("active_websockets", "Number of active WebSocket connections", "gauge")
transcriptions_processed = get_or_create_metric("transcriptions_processed_total", "Total transcriptions processed")
ngrok_connections = get_or_create_metric("ngrok_connections_total", "Total ngrok connections established")
ngrok_errors = get_or_create_metric("ngrok_errors_total", "Total ngrok connection errors")
websocket_errors = get_or_create_metric("websocket_errors_total", "Total WebSocket errors")
db_connection_status = get_or_create_metric("db_connection_status", "Database connection status (1=up, 0=down)", "gauge",  labelnames=["database"])

class Metrics:
    def __init__(self):
        self.health_requests = health_requests
        self.websocket_url_requests = websocket_url_requests
        self.active_websockets = active_websockets
        self.transcriptions_processed = transcriptions_processed
        self.ngrok_connections = ngrok_connections
        self.ngrok_errors = ngrok_errors
        self.websocket_errors = websocket_errors
        self.db_connection_status = db_connection_status

metrics = Metrics()