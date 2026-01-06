#!/bin/bash

echo "SD Plandi - Start and Test"
echo "==========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Start Docker
echo -e "${YELLOW}Step 1: Starting Docker services...${NC}"
docker compose --env-file .env.development up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker started${NC}"
echo ""

# Step 2: Wait for services
echo -e "${YELLOW}Step 2: Waiting for services to be ready...${NC}"
sleep 10

# Check if API is responding
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done
echo ""

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ API failed to start${NC}"
    echo "Check logs with: docker compose logs api"
    exit 1
fi

# Step 3: Check database
echo -e "${YELLOW}Step 3: Checking database...${NC}"
student_count=$(curl -s http://localhost:3001/students 2>/dev/null | node -e "const data = JSON.parse(require('fs').readFileSync(0)); console.log(data.length)" 2>/dev/null || echo "0")

if [ "$student_count" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Database is empty. Initializing...${NC}"
    echo ""
    
    echo "Running migrations..."
    curl -s -X POST http://localhost:3001/db-migrate-columns > /dev/null
    sleep 2
    
    echo "Seeding database with 161 students..."
    curl -s -X POST "http://localhost:3001/db-init?force=true" > /dev/null
    sleep 3
    
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${GREEN}✓ Database has $student_count students${NC}"
fi
echo ""

# Step 4: Run tests
echo -e "${YELLOW}Step 4: Running API tests...${NC}"
echo ""

if command -v node &> /dev/null; then
    node tests/test-api.js
else
    echo -e "${YELLOW}Node.js not found, running bash tests...${NC}"
    bash tests/test-api.sh
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Services:"
echo "  - API: http://localhost:3001"
echo "  - Database: localhost:5432"
echo ""
echo "Next steps:"
echo "  1. Run: pnpm start"
echo "  2. Open: http://localhost:4200"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop services: docker compose down"
echo "  - Run tests: node tests/test-api.js"
echo ""
