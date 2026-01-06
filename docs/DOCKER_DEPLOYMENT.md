# Docker Deployment Guide

## Overview
Complete Docker deployment configuration for SDN Plandi application with multi-stage builds, health checks, and production-ready setup.

**Updated:** 2026-01-06
**Status:** ✅ Complete
**Environment:** Production & Development

---

## Quick Start

### Prerequisites
- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- `.env` file with `POSTGRES_URL` configured

### Build and Run

```bash
# Build Docker image
pnpm docker:build

# OR manually
docker build -t sd-plandi:latest .

# Run with docker-compose
pnpm docker:run

# OR manually
docker-compose up -d

# View logs
pnpm docker:logs

# OR manually
docker-compose logs -f

# Stop containers
pnpm docker:stop

# OR manually
docker-compose down
```

Access the application at: `http://localhost:3000`

---

## Docker Architecture

### Multi-Stage Build

**Stage 1: Angular Builder**
- Base: `node:20-alpine` (lightweight)
- Installs pnpm globally
- Installs dependencies with `--frozen-lockfile`
- Builds Angular production bundle
- Output: `/app/dist/sd-plandi`

**Stage 2: Production Server**
- Base: `node:20-alpine`
- Copies built Angular app from Stage 1
- Installs production dependencies only
- Serves both SPA and API endpoints via Express
- Includes health check endpoint

### Image Size Optimization

**Before optimization:** ~800MB (full node image + dev dependencies)
**After optimization:** ~150MB (alpine + prod deps only)

**Optimization techniques:**
1. Multi-stage build (removes build tools)
2. Alpine Linux base (minimal footprint)
3. Production dependencies only
4. `.dockerignore` excludes unnecessary files

---

## Configuration Files

### Dockerfile

Located at: [/Dockerfile](../Dockerfile)

```dockerfile
# Stage 1: Build Angular
FROM node:20-alpine AS angular-builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY api ./api
COPY --from=angular-builder /app/dist/sd-plandi ./public
EXPOSE 3000
ENV NODE_ENV=production PORT=3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "..."
CMD ["node", "api/server.js"]
```

### docker-compose.yml

Located at: [/docker-compose.yml](../docker-compose.yml)

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - POSTGRES_URL=${POSTGRES_URL}
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "..."]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
    networks:
      - sd-plandi-network
```

### .dockerignore

Located at: [/.dockerignore](../.dockerignore)

Excludes:
- `node_modules`
- Build outputs (`dist`, `.angular`)
- Development files (`.vscode`, logs)
- Environment files (`.env.local`)
- Git files
- Test files

---

## Express Server

### File: api/server.js

**Purpose:** Standalone Express server for Docker deployment

**Features:**
1. **Serves Angular SPA** - Static files from `/public`
2. **API Endpoints** - Proxies Vercel serverless functions
3. **Security Headers** - Same as Vercel (HSTS, X-Frame-Options, etc.)
4. **Health Check** - `/health` endpoint for monitoring
5. **SPA Fallback** - All routes serve `index.html` for client-side routing
6. **Graceful Shutdown** - Handles SIGTERM/SIGINT signals

**Adapter Pattern:**
Converts Vercel serverless handlers to Express middleware:

```javascript
const adaptVercelHandler = (handler) => {
  return async (req, res) => {
    const vercelReq = { ...req, method, headers, body, query };
    const vercelRes = {
      status: (code) => res.status(code),
      json: (data) => res.json(data),
      setHeader: (key, value) => res.setHeader(key, value)
    };
    await handler(vercelReq, vercelRes);
  };
};
```

---

## Environment Variables

### Required Variables

**POSTGRES_URL** (required)
```env
POSTGRES_URL=postgres://user:password@host:5432/database?sslmode=require
```

### Optional Variables

**PORT** (default: 3000)
```env
PORT=3000
```

**NODE_ENV** (auto-set in Docker)
```env
NODE_ENV=production
```

### Setting Environment Variables

#### Method 1: .env file (recommended)
```bash
# Create .env file
cat > .env <<EOF
POSTGRES_URL=your_actual_postgres_url_here
EOF

# Docker Compose will automatically load it
docker-compose up -d
```

#### Method 2: docker-compose.yml override
```yaml
services:
  app:
    environment:
      - POSTGRES_URL=postgres://...
```

#### Method 3: Command line
```bash
docker run -e POSTGRES_URL=postgres://... sd-plandi:latest
```

---

## Health Checks

### Endpoint: /health

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-06T12:00:00.000Z"
}
```

### Docker Health Check

Configured in Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Parameters:**
- `interval`: 30s between checks
- `timeout`: 3s max per check
- `start-period`: 5s grace period on startup
- `retries`: 3 failures before unhealthy

**Check health status:**
```bash
docker ps
# Look for (healthy) or (unhealthy) in STATUS column
```

---

## Networking

### Default Configuration

**Port Mapping:** `3000:3000` (host:container)
**Network:** `sd-plandi-network` (bridge driver)

### Custom Port

Change port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Access on http://localhost:8080
```

### Reverse Proxy (Nginx/Caddy)

Example Nginx configuration:
```nginx
server {
  listen 80;
  server_name sdnplandi1jombang.sch.id;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## Production Deployment

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

### Step 2: Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd sd-plandi

# Create .env file
nano .env
# Add: POSTGRES_URL=postgres://...

# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 3: Setup SSL (with Caddy)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddyfile
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile:**
```caddy
sdnplandi1jombang.sch.id {
    reverse_proxy localhost:3000
}
```

```bash
# Reload Caddy
sudo systemctl reload caddy
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service logs
docker-compose logs app

# Last 100 lines
docker-compose logs --tail=100
```

### Resource Usage

```bash
# Container stats
docker stats

# Detailed inspection
docker inspect sd-plandi-app-1
```

### Restart Container

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

---

## Database Management

### Option 1: Use Neon (Recommended)

Already configured via `POSTGRES_URL` environment variable.

**Advantages:**
- Managed service (automatic backups, scaling)
- No container needed
- Production-ready
- Free tier available

### Option 2: Local PostgreSQL Container

Uncomment database service in `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sd_plandi
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - sd-plandi-network

volumes:
  postgres-data:
```

Update `.env`:
```env
POSTGRES_URL=postgres://postgres:postgres@db:5432/sd_plandi
```

**Run database migration:**
```bash
docker-compose exec app pnpm db:migrate
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs app
```

**Common issues:**
1. Missing `POSTGRES_URL` environment variable
2. Port 3000 already in use
3. Build failed

**Solutions:**
```bash
# 1. Check .env file exists
cat .env

# 2. Check port availability
lsof -i :3000
# Kill process or change port in docker-compose.yml

# 3. Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Health Check Failing

**Check health status:**
```bash
docker ps
```

**Test health endpoint manually:**
```bash
docker-compose exec app curl http://localhost:3000/health
```

**Possible causes:**
- Application crashed
- Database connection failed
- Port not bound correctly

### Database Connection Error

**Verify POSTGRES_URL:**
```bash
docker-compose exec app env | grep POSTGRES
```

**Test database connection:**
```bash
docker-compose exec app node -e "
const { sql } = require('@vercel/postgres');
sql\`SELECT NOW()\`.then(r => console.log(r.rows[0])).catch(e => console.error(e));
"
```

### Permission Denied Errors

**Fix ownership:**
```bash
sudo chown -R $USER:$USER .
```

### Out of Disk Space

**Clean Docker system:**
```bash
# Remove unused images
docker image prune -a

# Remove stopped containers
docker container prune

# Remove all unused data
docker system prune -a --volumes
```

---

## Security Considerations

### Production Checklist

- [ ] Use HTTPS (SSL/TLS certificate)
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Don't expose PostgreSQL port (5432) to public
- [ ] Use environment variables for secrets (never commit .env)
- [ ] Enable Docker security scanning
- [ ] Limit container resources (CPU, memory)
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### Resource Limits

Add to `docker-compose.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Security Scanning

```bash
# Scan image for vulnerabilities
docker scan sd-plandi:latest
```

---

## Performance Optimization

### Build Cache

Use BuildKit for faster builds:
```bash
DOCKER_BUILDKIT=1 docker build -t sd-plandi:latest .
```

### Layer Optimization

Dockerfile already optimized:
1. Separate dependency install from code copy
2. Leverage layer caching
3. Multi-stage build reduces final image size

### Production Tuning

**Node.js optimizations:**
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

---

## Development vs Production

### Development

Use Angular dev server:
```bash
pnpm start
# Runs on http://localhost:4200
# Hot reload enabled
# Development build
```

### Production (Docker)

Build optimized bundle:
```bash
docker-compose up -d
# Runs on http://localhost:3000
# Production build (minified)
# No hot reload
# Optimized performance
```

---

## Alternative: Deploy to Cloud

### Option 1: Vercel (Current)
- Automatic deployment from Git
- Serverless functions
- Global CDN
- Free SSL
- **Recommended for easy deployment**

### Option 2: Docker Cloud Platforms

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**DigitalOcean App Platform:**
- Connect GitHub repository
- Auto-detects Dockerfile
- One-click deployment

**AWS ECS / Azure Container Instances / Google Cloud Run:**
- Enterprise-grade
- Auto-scaling
- More complex setup

---

## Scripts Reference

### Package.json Scripts

```bash
# Development
pnpm start          # Run Angular dev server (port 4200)
pnpm build          # Build Angular production bundle

# Docker
pnpm docker:build   # Build Docker image
pnpm docker:run     # Start containers with docker-compose
pnpm docker:stop    # Stop and remove containers
pnpm docker:logs    # View container logs

# Database
pnpm db:migrate     # Run database migration

# Server (standalone)
pnpm server         # Run Express server directly (requires built Angular app)
```

---

## Support & Resources

### Documentation
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Express.js](https://expressjs.com/)

### Getting Help

**Check existing documentation:**
- [README.md](../README.md)
- [Database Migration](DATABASE_MIGRATION.md)
- [Security Enhancements](SECURITY_ENHANCEMENTS.md)

**Report issues:**
- GitHub Issues
- Email: info@sdnplandi1jombang.sch.id

---

**Created:** 2026-01-06
**Maintained by:** SDN Plandi Dev Team
**Docker Version:** 20.10+
**Node Version:** 20 LTS
