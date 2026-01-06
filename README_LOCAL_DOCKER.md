# SD Plandi - Local Docker API Setup

## 🎯 Quick Start

```bash
# 1. Install API dependencies
pnpm api:install

# 2. Start Docker (PostgreSQL + API Server)
pnpm local:up

# 3. Wait 10 seconds, then initialize database
pnpm local:migrate
pnpm local:seed

# 4. Start frontend
pnpm start
```

## 🌐 URLs

- **Frontend**: http://localhost:4200
- **API**: http://localhost:3001
- **Database**: localhost:5432

## 📚 Documentation

- [Local Docker Setup Guide](docs/LOCAL_DOCKER_SETUP.md) - Complete setup guide
- [Quick Start](LOCAL_SETUP_QUICKSTART.md) - Get started in 3 steps
- [Deployment Comparison](docs/DEPLOYMENT_COMPARISON.md) - Vercel vs Docker

## 🚀 Why Local Docker?

| Before (Vercel) | After (Docker) |
|-----------------|----------------|
| 12 endpoint limit | Unlimited endpoints |
| Cold starts (~1s) | No cold starts |
| $20/month (Pro) | $0/month |
| Slow development | Instant reload |

## 📋 Daily Commands

```bash
# Start services
pnpm local:up

# View logs
pnpm local:logs

# Stop services
pnpm local:down

# Restart API
pnpm local:restart
```

## 🔧 API Endpoints (10 total)

All available at `http://localhost:3001`:

1. `/health` - Health check
2. `/auth` - Authentication
3. `/admin` - Admin dashboard
4. `/students` - 161 students
5. `/attendance` - Check-in/out records
6. `/leave-requests` - Izin/sakit management
7. `/db-init` - Database initialization
8. `/db-migrate-columns` - Schema migrations
9. `/intrakurikuler` - Subjects & schedules
10. `/ekstrakurikuler` - Activities & members

## ✅ Next Steps

1. Start Docker services
2. Initialize database
3. Start frontend development
4. Add more endpoints (no limit!)

## 📖 Full Documentation

See [docs/LOCAL_DOCKER_SETUP.md](docs/LOCAL_DOCKER_SETUP.md) for complete documentation.

---

**Status**: ✅ Production Ready
**Updated**: 2026-01-06
