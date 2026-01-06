# Deployment Guide - SD Plandi Attendance System

## Dual Deployment Support

This application supports **two deployment modes** with automatic environment detection:

### 1. Vercel Deployment (Serverless)
- **Database**: Neon DB (PostgreSQL)
- **Best for**: Quick deployment, demos, development
- **URL**: https://plandi1jombang.vercel.app

### 2. Docker Deployment (Dedicated Server)
- **Database**: Local PostgreSQL container
- **Best for**: Production, full control, data sovereignty
- **Self-hosted**: Your own server

## Environment Auto-Detection

The system automatically detects where it's running:

```typescript
// In api/lib/db-config.ts
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  // Use Neon DB via @vercel/postgres
  sql = vercelSql;
} else {
  // Use local PostgreSQL via postgres package
  sql = postgres(DATABASE_URL);
}
```

---

## Option 1: Vercel Deployment

### Prerequisites
- Vercel account
- GitHub account
- Neon DB account (free tier)

### Steps

1. **Fork/Clone Repository**
```bash
git clone <repository-url>
cd sd-plandi
```

2. **Create Neon Database**
- Go to [neon.tech](https://neon.tech)
- Create new project
- Copy connection string

3. **Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

4. **Configure Environment Variables**

In Vercel dashboard, add:
```
POSTGRES_URL=postgresql://user:password@host/database
```

5. **Initialize Database**
```bash
curl -X POST https://your-app.vercel.app/api/db-init
```

**Done!** Access at https://your-app.vercel.app

---

## Option 2: Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+
- 2GB RAM minimum
- 5GB disk space

### Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd sd-plandi

# 2. Configure environment
cp .env.production.example .env.production
nano .env.production  # Change passwords!

# 3. Build and run
pnpm docker:build
pnpm docker:run

# 4. Initialize database
curl -X POST http://localhost:3000/api/db-init

# 5. Open application
open http://localhost:3000
```

### Environment Configuration

Edit `.env.production`:

```env
# Database (change password!)
DB_NAME=sd_plandi
DB_USER=sd_plandi_user
DB_PASSWORD=CHANGE_THIS_PASSWORD

# Application
NODE_ENV=production
PORT=3000
APP_PORT=3000
```

### Docker Commands

```bash
# Start services
pnpm docker:run

# Stop services
pnpm docker:stop

# View logs
pnpm docker:logs

# Restart
docker-compose -f docker-compose.production.yml restart

# Rebuild
docker-compose -f docker-compose.production.yml up -d --build
```

### Production Server Setup

#### Ubuntu/Debian Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone and deploy
git clone <repository-url>
cd sd-plandi
cp .env.production.example .env.production
nano .env.production  # Set secure passwords

# Deploy
docker compose -f docker-compose.production.yml up -d --build

# Initialize database
curl -X POST http://localhost:3000/api/db-init

# Configure firewall
sudo ufw allow 3000/tcp
sudo ufw enable
```

### With SSL/HTTPS (Optional)

```bash
# Start with nginx profile
docker compose --profile with-nginx -f docker-compose.production.yml up -d

# Requires:
# - nginx.conf file
# - SSL certificates in ./ssl/ directory
```

---

## Database Management

### Backup

```bash
# Manual backup
docker compose -f docker-compose.production.yml exec db \
  pg_dump -U sd_plandi_user sd_plandi > backups/backup.sql

# Automated backup (daily at 2 AM)
# Add to crontab:
0 2 * * * /path/to/sd-plandi/backup.sh
```

### Restore

```bash
docker compose -f docker-compose.production.yml exec -T db \
  psql -U sd_plandi_user sd_plandi < backups/backup.sql
```

### Access Database

```bash
# PostgreSQL shell
docker compose -f docker-compose.production.yml exec db \
  psql -U sd_plandi_user sd_plandi
```

---

## Default Credentials

**After deployment, login with:**

### Administrator
- Email: `admin@sdnplandi1jombang.sch.id`
- Password: `admin123`
- Access: All classes

### Wali Kelas Examples
- Email: `siti.aminah@sdnplandi1jombang.sch.id`
- Password: `wali123`
- Access: Class K1 only

**⚠️ IMPORTANT**: Change passwords after first login!

---

## Monitoring

### Health Check

```bash
# Check application health
curl http://localhost:3000/api/health | jq .

# Expected response:
{
  "status": "healthy",
  "database": {
    "connected": true,
    "tables": ["students", "users", "sessions", "attendance", "leave_requests"]
  }
}
```

### Logs

```bash
# Application logs
docker compose -f docker-compose.production.yml logs -f app

# Database logs
docker compose -f docker-compose.production.yml logs -f db

# All services
docker compose -f docker-compose.production.yml logs -f
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs app

# Check database
docker compose -f docker-compose.production.yml ps

# Restart
docker compose -f docker-compose.production.yml restart
```

### Database Connection Failed

```bash
# Check database health
docker compose -f docker-compose.production.yml exec db pg_isready -U sd_plandi_user

# Check environment variable
docker compose -f docker-compose.production.yml exec app env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Find process on port 3000
sudo lsof -i :3000

# Use different port
APP_PORT=3001 docker compose -f docker-compose.production.yml up -d
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Change default admin password
- [ ] Enable firewall (allow only 80, 443, 3000)
- [ ] Use HTTPS/SSL in production
- [ ] Regular automated backups
- [ ] Keep Docker and packages updated
- [ ] Monitor logs for suspicious activity
- [ ] Restrict database port to localhost

---

## Comparison: Vercel vs Docker

| Feature | Vercel | Docker |
|---------|--------|--------|
| Setup Time | 5 minutes | 15 minutes |
| Database | Neon (cloud) | PostgreSQL (local) |
| Scaling | Automatic | Manual |
| Cost | Free tier | Server only |
| Control | Limited | Full |
| Best For | Development | Production |

---

## Support & Documentation

- **Full Docker Guide**: [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md)
- **Admin System**: [docs/ADMIN_SYSTEM.md](docs/ADMIN_SYSTEM.md)
- **Camera Scanner**: [docs/CAMERA_SCANNER_UPDATE.md](docs/CAMERA_SCANNER_UPDATE.md)

---

**Status**: ✅ Production Ready
**Vercel**: https://plandi1jombang.vercel.app
**Last Updated**: 2026-01-06
