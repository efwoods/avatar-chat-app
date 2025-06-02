FROM python:3.9-slim

WORKDIR /app

# Install git for pip dependencies that require it
RUN apt-get update && apt-get install -y git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ /app/api/

EXPOSE 8765

CMD ["python", "api/realtime_whisper_server.py"]
