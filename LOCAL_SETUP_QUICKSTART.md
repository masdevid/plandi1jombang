# Quick Start - Local Docker Development

## 🚀 Get Started in 3 Steps

### Step 1: Start Docker Services

```bash
pnpm local:up
```

This starts:
- PostgreSQL database on port 5432
- API server on port 3001

### Step 2: Initialize Database

```bash
# Wait 10 seconds for services to start, then run:
pnpm local:migrate
pnpm local:seed
```

This creates tables and loads 161 students.

### Step 3: Start Frontend

```bash
pnpm start
```

Open http://localhost:4200

## ✅ Verify Everything Works

```bash
# Check API health
curl http://localhost:3001/health

# Check student count
curl -s http://localhost:3001/students | jq 'length'
# Should return: 161
```

## 📋 Daily Workflow

```bash
# Morning - Start services
pnpm local:up

# Develop
pnpm start

# Evening - Stop services
pnpm local:down
```

## 🔧 Useful Commands

```bash
# View logs
pnpm local:logs

# Restart API server
pnpm local:restart

# Stop everything
pnpm local:down
```

## 🌐 URLs

- Frontend: http://localhost:4200
- API: http://localhost:3001
- Database: localhost:5432

## 📚 Full Documentation

See [docs/LOCAL_DOCKER_SETUP.md](docs/LOCAL_DOCKER_SETUP.md)

## ⚠️ Troubleshooting

**Port 3001 already in use?**
```bash
lsof -i :3001
# Kill the process or use different port
```

**Database won't start?**
```bash
docker-compose -f docker-compose.local.yml logs db
```

**API server errors?**
```bash
pnpm local:logs
```

---

**Status**: ✅ Ready
**Support**: See docs/LOCAL_DOCKER_SETUP.md
