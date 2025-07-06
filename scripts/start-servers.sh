#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Set default ports
WEBSOCKET_PORT=${PORT:-3000}
STATIC_PORT=${STATIC_PORT:-8080}

log "Starting Amazon Nova Sonic Application"
log "WebSocket Server Port: $WEBSOCKET_PORT"
log "Static Frontend Port: $STATIC_PORT"

# Check if required directories exist
if [ ! -d "/app/dist-static" ]; then
    error "Static build directory not found. Running build-static..."
    cd /app
    npm run build-static
fi

if [ ! -d "/app/dist" ]; then
    error "TypeScript build directory not found. Running build..."
    cd /app
    npm run build
fi

# Function to cleanup background processes
cleanup() {
    log "Shutting down servers..."
    kill $STATIC_PID $WEBSOCKET_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGTERM SIGINT

# Start static file server in background
log "Starting static file server on port $STATIC_PORT..."
cd /app/dist-static
python3 -m http.server $STATIC_PORT &
STATIC_PID=$!

# Wait a moment for static server to start
sleep 2

# Check if static server started successfully
if ! kill -0 $STATIC_PID 2>/dev/null; then
    error "Failed to start static file server"
    exit 1
fi

log "Static file server started successfully (PID: $STATIC_PID)"

# Start WebSocket server in background
log "Starting WebSocket server on port $WEBSOCKET_PORT..."
cd /app
npm start &
WEBSOCKET_PID=$!

# Wait a moment for WebSocket server to start
sleep 3

# Check if WebSocket server started successfully
if ! kill -0 $WEBSOCKET_PID 2>/dev/null; then
    error "Failed to start WebSocket server"
    kill $STATIC_PID 2>/dev/null || true
    exit 1
fi

log "WebSocket server started successfully (PID: $WEBSOCKET_PID)"

# Display access information
log "Application is ready!"
log "Frontend: http://localhost:$STATIC_PORT"
log "WebSocket API: http://localhost:$WEBSOCKET_PORT"
log "Health Check: http://localhost:$WEBSOCKET_PORT/health"

# Wait for both processes
wait $STATIC_PID $WEBSOCKET_PID
