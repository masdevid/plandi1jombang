#!/bin/bash

# SD Plandi Auto-Deployment Script
# This script pulls latest code and restarts Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/sd-plandi"  # Change this to your project path
BRANCH="main"
LOG_FILE="/var/log/sd-plandi-deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    warning "Please run with sudo for Docker permissions"
fi

# Start deployment
log "🚀 Starting SD Plandi deployment..."

# Navigate to project directory
cd "$PROJECT_DIR" || error "Project directory not found: $PROJECT_DIR"

# Stash any local changes
log "💾 Stashing local changes..."
git stash

# Fetch latest changes
log "📥 Fetching latest changes from GitHub..."
git fetch origin || error "Failed to fetch from origin"

# Get current and remote commit hashes
CURRENT_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$BRANCH)

if [ "$CURRENT_COMMIT" == "$REMOTE_COMMIT" ]; then
    log "✓ Already up to date. No deployment needed."
    exit 0
fi

# Show what will be updated
log "📊 Changes to be deployed:"
git log --oneline --decorate --graph HEAD..origin/$BRANCH | head -10

# Pull latest code
log "⬇️  Pulling latest code..."
git reset --hard origin/$BRANCH || error "Failed to pull latest code"

NEW_COMMIT=$(git rev-parse HEAD)

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    error ".env.docker file not found! Please create it before deploying."
fi

# Detect what changed
API_CHANGED=false
DOCKER_CHANGED=false

if [ "$CURRENT_COMMIT" != "$NEW_COMMIT" ]; then
    # Check if API files changed
    if git diff --name-only $CURRENT_COMMIT $NEW_COMMIT | grep -qE '^(api/|api-server/)'; then
        API_CHANGED=true
        log "📌 API files changed - will rebuild API container"
    fi

    # Check if Docker files changed
    if git diff --name-only $CURRENT_COMMIT $NEW_COMMIT | grep -qE '^(Dockerfile|docker-compose.yml)'; then
        DOCKER_CHANGED=true
        log "📌 Docker configuration changed - will rebuild all containers"
    fi
fi

# Smart deployment based on changes
if [ "$DOCKER_CHANGED" = true ]; then
    log "🔨 Docker configuration changed - rebuilding all containers..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
elif [ "$API_CHANGED" = true ]; then
    log "🔨 API changed - rebuilding API container only..."
    docker-compose stop api
    docker-compose build api
    docker-compose up -d api
else
    log "✓ No container changes detected - restarting to pick up code updates..."
    docker-compose restart api
fi

# Ensure all services are running
log "🚀 Ensuring all services are running..."
docker-compose up -d || error "Failed to start containers"

# Wait for services to be healthy
log "⏳ Waiting for services to initialize..."
sleep 10

# Check container status
log "📋 Container status:"
docker-compose ps

# Check API health
log "🏥 Checking API health..."
sleep 5
API_PORT=$(grep API_PORT .env.docker | cut -d '=' -f2 || echo "3001")
if curl -f http://localhost:${API_PORT}/health > /dev/null 2>&1; then
    success "API is healthy!"
else
    warning "API health check failed, but containers are running. Check logs with: docker-compose logs api"
fi

# Show recent logs
log "📜 Recent logs (last 20 lines):"
docker-compose logs --tail=20

# Cleanup
log "🧹 Cleaning up unused Docker resources..."
docker system prune -f || warning "Cleanup failed"

# Log deployment info
echo "" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"
echo "Deployment completed at: $(date)" >> "$LOG_FILE"
echo "Previous commit: $CURRENT_COMMIT" >> "$LOG_FILE"
echo "New commit: $REMOTE_COMMIT" >> "$LOG_FILE"
echo "====================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

success "✅ Deployment completed successfully!"
log "📊 View logs: docker-compose logs -f"
log "🔍 Check status: docker-compose ps"

exit 0
