# Getting Started - SD Plandi

Complete guide to get SD Plandi running locally with Docker.

## 📋 Prerequisites

1. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
2. **Node.js 20+** - [Download](https://nodejs.org/)
3. **pnpm** - Install: `npm install -g pnpm`

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install API dependencies
pnpm api:install

# 2. Setup and test (automated)
pnpm setup

# 3. Start frontend
pnpm start
```

Open http://localhost:4200 🎉

## 📖 Step-by-Step Guide

### Step 1: Install Dependencies

```bash
# Install API server dependencies
pnpm api:install

# This installs Express, CORS, and postgres driver
```

### Step 2: Start Docker Services

```bash
# Option A: Automated (recommended)
pnpm setup

# Option B: Manual
pnpm docker:up

# Wait 10 seconds for services to start
```

This starts:
- PostgreSQL database on port 5432
- API server on port 3001

### Step 3: Initialize Database

```bash
# Only needed if not using `pnpm setup`

# Run migrations (add new columns)
pnpm db:migrate:columns

# Seed with 161 students
pnpm db:seed
```

### Step 4: Verify API Works

```bash
# Run comprehensive tests
pnpm test:api

# Or quick test
pnpm test:quick
```

Expected output:
```
==================================================
SD Plandi API Test Suite
==================================================
...
Total Tests: 15
Passed: 15 ✓
Failed: 0

✓ All tests passed!
```

### Step 5: Start Frontend

```bash
pnpm start
```

Access at: http://localhost:4200

## 🔧 Commands Reference

### Docker Management

```bash
# Start services
pnpm docker:up

# Stop services
pnpm docker:down

# View logs
pnpm docker:logs

# Restart API only
pnpm docker:restart

# Rebuild containers
pnpm docker:rebuild
```

### Database Management

```bash
# Initialize schema
pnpm db:init

# Run migrations
pnpm db:migrate:columns

# Seed with 161 students
pnpm db:seed
```

### Testing

```bash
# Comprehensive test
pnpm test:api

# Quick test
pnpm test:quick

# Automated setup + test
pnpm setup
```

### Development

```bash
# Start Docker + Frontend
pnpm dev

# Or separately
pnpm docker:up
pnpm start
```

## 🌐 Access Points

Once running:

- **Frontend**: http://localhost:4200
- **API**: http://localhost:3001
- **Database**: localhost:5432
- **Health Check**: http://localhost:3001/health

## 🔍 Verify Everything Works

### 1. Check API Health

```bash
curl http://localhost:3001/health
```

Expected:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "tables": [...]
  }
}
```

### 2. Check Student Count

```bash
curl http://localhost:3001/students | node -p "JSON.parse(require('fs').readFileSync(0)).length"
```

Expected: `161`

### 3. Test Login

```bash
curl -X POST http://localhost:3001/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@sdnplandi1jombang.sch.id",
    "password": "admin123"
  }'
```

Expected: `{"user": {...}, "token": "..."}`

### 4. Test Frontend

1. Open http://localhost:4200
2. Click "Portal Orang Tua"
3. Search for "ADELIA"
4. Should see: ADELIA PUTRI RAMADHANI

## 📊 What You Get

### 10 API Endpoints (Unlimited!)

1. **GET /health** - API health and database status
2. **POST/GET /auth** - Authentication (login/verify)
3. **GET /admin** - Admin dashboard (requires auth)
4. **GET /students** - 161 students from Excel
5. **GET /attendance** - Attendance records
6. **GET /leave-requests** - Leave management
7. **POST /db-init** - Database initialization
8. **POST /db-migrate-columns** - Schema migrations
9. **GET /intrakurikuler** - 12 subjects
10. **GET /ekstrakurikuler** - 4 activities

### Database

- **PostgreSQL 16** in Docker
- **9 tables**: students, users, sessions, attendance, leave_requests, intrakurikuler_subjects, intrakurikuler_class_assignments, extrakurikuler_activities, extrakurikuler_members
- **161 students** from Excel file
- **9 users**: 1 admin, 6 wali kelas, 1 teacher, 1 staff

### Frontend (Angular 21)

- **Home page** with school info
- **Admin login** for teachers/staff
- **Admin dashboard** with statistics
- **Check-in page** with QR scanner
- **Parent portal** with student search
- **Reports page** for attendance data

## 🛠️ Troubleshooting

### Docker Won't Start

```bash
# Check if Docker Desktop is running
docker ps

# If error "command not found: docker"
# Install Docker Desktop and make sure it's running
```

### Port Already in Use

```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in .env.development
echo "API_PORT=3002" >> .env.development
```

### Database Empty

```bash
# Check student count
curl -s http://localhost:3001/students | node -p "JSON.parse(require('fs').readFileSync(0)).length"

# If 0, re-seed
pnpm db:seed

# Verify
curl -s http://localhost:3001/students | node -p "JSON.parse(require('fs').readFileSync(0)).length"
# Should return: 161
```

### API Not Responding

```bash
# Check API logs
docker compose logs api

# Restart API
pnpm docker:restart

# Or restart everything
pnpm docker:down
pnpm docker:up
```

### Tests Fail

```bash
# Make sure Docker is running
docker ps

# Make sure API is responding
curl http://localhost:3001/health

# Re-run setup
pnpm setup
```

## 📚 Next Steps

### Daily Development

```bash
# Morning
pnpm docker:up
pnpm start

# Work...

# Evening
pnpm docker:down
```

### Add New Features

1. Add API endpoint in `api/` folder
2. Add route in `api-server/server.js`
3. Restart API: `pnpm docker:restart`
4. Test: `pnpm test:api`

### Deploy to Production

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for production deployment guide.

## 🎯 Summary

You now have:

✅ **Local API server** (unlimited endpoints)  
✅ **PostgreSQL database** (161 students)  
✅ **Comprehensive tests** (all endpoints verified)  
✅ **Automated setup** (one command)  
✅ **Full documentation** (multiple guides)  

## 📖 Documentation

- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Complete Docker guide
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Quick reference
- **[tests/README.md](tests/README.md)** - Testing guide
- **[docs/LOCAL_DOCKER_SETUP.md](docs/LOCAL_DOCKER_SETUP.md)** - Detailed local setup
- **[docs/DEPLOYMENT_COMPARISON.md](docs/DEPLOYMENT_COMPARISON.md)** - Vercel vs Docker

## 💡 Tips

- Use `pnpm setup` for first-time setup
- Use `pnpm dev` for daily development
- Use `pnpm test:api` to verify changes
- Use `pnpm docker:logs` to debug issues

## 🆘 Need Help?

1. Check [DOCKER_SETUP.md](DOCKER_SETUP.md) troubleshooting section
2. View logs: `pnpm docker:logs`
3. Test API: `pnpm test:api`
4. Check health: `curl http://localhost:3001/health`

---

**Status**: ✅ Ready to Use  
**Last Updated**: 2026-01-06  
**Support**: See documentation above

Happy coding! 🚀
