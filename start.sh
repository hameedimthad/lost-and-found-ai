#!/bin/bash
# Lost & Found AI Application Runner

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo "    ReuniteAI: Lost & Found AI Visual Matching Portal    "
echo "=========================================================="

# Activate python virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Virtual environment .venv not found. Creating..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
fi

# Seed demo data if database does not exist
if [ ! -f "backend/lost_and_found.db" ]; then
    echo "Seeding initial demo data..."
    python3 seed_demo_data.py
fi

# Function to kill background tasks on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Backend Server on Port 8000
echo "Starting Backend API server on http://127.0.0.1:8000 ..."
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait briefly for backend to start
sleep 2

# Start Frontend Dev Server on Port 5173
echo "Starting Frontend server on http://localhost:5173 ..."
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host

wait
