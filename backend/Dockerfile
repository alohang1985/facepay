FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for OpenCV/MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download MediaPipe models
RUN mkdir -p models && \
    curl -sL -o models/face_detection_short_range.tflite \
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite" && \
    curl -sL -o models/face_landmarker.task \
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"

# Copy app
COPY app/ app/

# Create data directory for SQLite
RUN mkdir -p /data

ENV PORT=8000
ENV DB_PATH=/data/facepay.db

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
