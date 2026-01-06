# Docker Setup - Local & Production

## 🎯 Quick Start (Local Development)

```bash
# 1. Install API dependencies
pnpm api:install

# 2. Start Docker
pnpm docker:up

# 3. Initialize database (wait 10 seconds first)
pnpm db:migrate:columns
pnpm db:seed

# 4. Start frontend
pnpm start
```

## 🌐 Access

- Frontend: http://localhost:4200
- API: http://localhost:3001
- Database: localhost:5432

## 📋 Commands

### Development (Local)

```bash
# Start services (DB + API)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down

# Restart API only
pnpm docker:restart

# Rebuild containers
pnpm docker:rebuild

# Start development (Docker + Frontend)
pnpm dev
```

### Database Management

```bash
# Initialize database schema
pnpm db:init

# Run migrations
pnpm db:migrate:columns

# Seed with 161 students
pnpm db:seed
```

### Production Deployment

```bash
# 1. Create .env.production
cp .env.production.example .env.production
# Edit .env.production with your settings

# 2. Start production services
pnpm docker:prod

# 3. Initialize database
pnpm db:migrate:columns
pnpm db:seed
```

## 📦 Architecture

```
┌─────────────────────────────────┐
│   Frontend (Angular)            │
│   http://localhost:4200         │
│   (or Vercel in production)     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   API Server (Express)          │
│   http://localhost:3001         │
│   Container: sd-plandi-api      │
│                                 │
│   Endpoints:                    │
│   - /health                     │
│   - /auth                       │
│   - /students                   │
│   - /attendance                 │
│   - /intrakurikuler             │
│   - /ekstrakurikuler            │
│   - + 4 more                    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│   PostgreSQL 16                 │
│   localhost:5432                │
│   Container: sd-plandi-db       │
│   Database: sd_plandi           │
└─────────────────────────────────┘
```

## 🔧 Configuration

### Development (.env.development)

```env
NODE_ENV=development
API_PORT=3001
DB_PORT=5432

POSTGRES_DB=sd_plandi
POSTGRES_USER=sd_plandi_user
POSTGRES_PASSWORD=sd_plandi_local_pass
DATABASE_URL=postgresql://sd_plandi_user:sd_plandi_local_pass@localhost:5432/sd_plandi
```

### Production (.env.production)

```env
NODE_ENV=production
API_PORT=3001
DB_PORT=5432

POSTGRES_DB=sd_plandi
POSTGRES_USER=sd_plandi_user
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
DATABASE_URL=postgresql://sd_plandi_user:STRONG_PASSWORD_HERE@db:5432/sd_plandi
```

## 🐳 Docker Services

### Database (PostgreSQL 16)
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Volume**: postgres_data (persistent)
- **Health Check**: Every 10s

### API Server (Node 20)
- **Build**: Dockerfile.api
- **Port**: 3001
- **Volumes**: Source code mounted (dev only)
- **Health Check**: Every 30s

## 🔒 Security

### Production Checklist

- [ ] Change default database password
- [ ] Use strong passwords (min 16 characters)
- [ ] Enable firewall (only expose necessary ports)
- [ ] Use environment variables (never hardcode)
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Regular database backups
- [ ] Monitor logs
- [ ] Update dependencies regularly

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH

# Block direct database access from outside
ufw deny 5432/tcp

# API should be behind reverse proxy
ufw deny 3001/tcp
```

## 🚀 Production Deployment Options

### Option 1: VPS (Recommended)

Deploy to DigitalOcean, AWS, or similar:

```bash
# On server
git clone https://github.com/yourusername/sd-plandi.git
cd sd-plandi

# Setup environment
cp .env.production.example .env.production
nano .env.production  # Edit with your settings

# Start services
pnpm docker:prod

# Initialize database
pnpm db:migrate:columns
pnpm db:seed

# Setup nginx reverse proxy
# (see NGINX_SETUP.md)
```

### Option 2: Home Server

Run on your local computer:

```bash
# Use ngrok or similar for external access
ngrok http 3001

# Or setup port forwarding on router
# Forward port 3001 to your computer's IP
```

### Option 3: Vercel Frontend + VPS API

Best of both worlds:

- **Frontend**: Deploy to Vercel (free, fast CDN)
- **API**: Deploy to VPS (full control, unlimited endpoints)

```bash
# Update src/environments/environment.prod.ts
apiUrl: 'https://api.yourdomain.com'

# Deploy frontend to Vercel
vercel --prod

# API runs on VPS
```

## 📊 Monitoring

### View Logs

```bash
# All services
pnpm docker:logs

# Specific service
docker logs sd-plandi-api
docker logs sd-plandi-db

# Follow logs
docker logs -f sd-plandi-api
```

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database connection
docker exec sd-plandi-db pg_isready -U sd_plandi_user
```

### Resource Usage

```bash
# Container stats
docker stats sd-plandi-api sd-plandi-db

# Disk usage
docker system df
```

## 🔄 Backup & Restore

### Backup Database

```bash
# Create backup
docker exec sd-plandi-db pg_dump -U sd_plandi_user sd_plandi > backup_$(date +%Y%m%d).sql

# Automated daily backup
echo "0 2 * * * cd /path/to/project && docker exec sd-plandi-db pg_dump -U sd_plandi_user sd_plandi > backup_\$(date +\%Y\%m\%d).sql" | crontab -
```

### Restore Database

```bash
# Stop API
pnpm docker:down

# Start only database
docker-compose up -d db

# Restore
cat backup_20260106.sql | docker exec -i sd-plandi-db psql -U sd_plandi_user sd_plandi

# Start all services
pnpm docker:up
```

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in .env.development
API_PORT=3002
DB_PORT=5433
```

### Database Connection Failed

```bash
# Check database is running
docker ps | grep sd-plandi-db

# View database logs
docker logs sd-plandi-db

# Restart database
docker-compose restart db
```

### API Won't Start

```bash
# View API logs
docker logs sd-plandi-api

# Rebuild container
pnpm docker:rebuild

# Check environment variables
docker exec sd-plandi-api env | grep DATABASE_URL
```

### Permission Errors

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Reset Docker
docker-compose down -v
pnpm docker:up
```

## 📈 Performance Tips

### Production Optimization

1. **Enable Docker BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Use Multi-Stage Builds**
   - Already configured in Dockerfile.api

3. **Limit Container Resources**
   ```yaml
   # In docker-compose.yml
   api:
     deploy:
       resources:
         limits:
           cpus: '1.0'
           memory: 512M
   ```

4. **Use Connection Pooling**
   - Already configured in db-config.ts (max: 10 connections)

## 📚 Documentation

- [API Integration](docs/API_INTEGRATION_FIX.md)
- [Build Fixes](docs/BUILD_FIXES.md)
- [Deployment Fix](docs/DEPLOYMENT_FIX.md)

## ✅ Checklist

### First Time Setup
- [ ] Install Docker Desktop
- [ ] Run `pnpm api:install`
- [ ] Run `pnpm docker:up`
- [ ] Run `pnpm db:migrate:columns`
- [ ] Run `pnpm db:seed`
- [ ] Test API: `curl http://localhost:3001/health`
- [ ] Run `pnpm start`
- [ ] Access http://localhost:4200

### Production Deployment
- [ ] Create .env.production
- [ ] Use strong passwords
- [ ] Setup firewall
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Setup automated backups
- [ ] Configure monitoring
- [ ] Test everything

## 🎉 Summary

This unified Docker setup provides:

- ✅ **Single configuration** for local and production
- ✅ **No serverless limits** (unlimited endpoints)
- ✅ **Easy to deploy** (one command)
- ✅ **Portable** (works anywhere Docker runs)
- ✅ **Consistent** (same environment everywhere)
- ✅ **Scalable** (easy to add more services)

---

**Last Updated**: 2026-01-06
**Docker Compose**: docker-compose.yml
**Status**: ✅ Production Ready
