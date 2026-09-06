# Multi-stage Dockerfile for Lost & Found AI Portal

# Stage 1: Build the React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Serving
FROM python:3.10-slim

# Install system dependencies for OpenCV/Pillow and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install python dependencies (CPU-optimized PyTorch)
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir facenet-pytorch && \
    pip install --no-cache-dir -r backend/requirements.txt && \
    pip install --no-cache-dir "urllib3<2.0.0"

# Copy backend source code and seed script
COPY backend/ ./backend/
COPY seed_demo_data.py ./

# Copy built frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Seed demo data if db doesn't exist, then launch uvicorn
CMD python3 seed_demo_data.py && uvicorn backend.main:app --host 0.0.0.0 --port 8000
