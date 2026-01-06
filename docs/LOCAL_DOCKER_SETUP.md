# Local Docker Setup - API Server

**Date**: 2026-01-06
**Status**: ✅ Ready

## Overview

This setup separates the API from Vercel deployment to avoid serverless function limits. The API runs locally in Docker while the frontend can be deployed to Vercel or run locally.

## Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Angular)            │
│      http://localhost:4200              │
│      OR                                 │
│      https://plandi1jombang.vercel.app  │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────┐
│      API Server (Express + Docker)      │
│      http://localhost:3001              │
│                                         │
│  Endpoints:                             │
│  - /health                              │
│  - /auth                                │
│  - /admin                               │
│  - /students                            │
│  - /attendance                          │
│  - /leave-requests                      │
│  - /db-init                             │
│  - /db-migrate-columns                  │
│  - /intrakurikuler                      │
│  - /ekstrakurikuler                     │
└─────────────────┬───────────────────────┘
                  │
                  │ SQL Queries
                  ▼
┌─────────────────────────────────────────┐
│      PostgreSQL Database (Docker)       │
│      localhost:5432                     │
│      Database: sd_plandi                │
└─────────────────────────────────────────┘
```

## Files Created

1. **api-server/package.json** - Express server dependencies
2. **api-server/server.js** - Express server with all endpoints
3. **docker-compose.local.yml** - Docker Compose configuration
4. **Dockerfile.api** - Docker image for API server
5. **.env.local** - Local environment variables
6. **.vercelignore** - Exclude API from Vercel

## Prerequisites

- Docker Desktop installed
- Docker Compose installed
- Node.js 20+ installed
- pnpm installed

## Quick Start

### 1. Install API Dependencies

```bash
pnpm api:install
```

### 2. Start Docker Services

```bash
# Start database and API server
pnpm local:up

# Check logs
pnpm local:logs
```

### 3. Initialize Database

```bash
# Run migration first
pnpm local:migrate

# Seed with 161 students
pnpm local:seed
```

### 4. Start Frontend

```bash
# In another terminal
pnpm start
```

### 5. Access Application

- **Frontend**: http://localhost:4200
- **API**: http://localhost:3001
- **Database**: localhost:5432

## npm Scripts Reference

### Docker Commands

```bash
# Start all services (DB + API)
pnpm local:up

# Stop all services
pnpm local:down

# View logs
pnpm local:logs

# Restart API server only
pnpm local:restart
```

### Database Commands

```bash
# Initialize database schema
pnpm local:init

# Run migrations
pnpm local:migrate

# Force re-seed with 161 students
pnpm local:seed
```

### Development

```bash
# Start everything (Docker + Frontend)
pnpm dev

# Start frontend only
pnpm start
```

## API Endpoints

All endpoints available at `http://localhost:3001`:

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check and DB status |
| GET | /students | List all students (161 total) |

### Authentication Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth | Login |
| GET | /auth | Verify token |
| DELETE | /auth | Logout |
| ALL | /admin | Admin dashboard |
| ALL | /attendance | Attendance records |
| ALL | /leave-requests | Leave request management |
| ALL | /intrakurikuler | Intracurricular subjects |
| ALL | /ekstrakurikuler | Extracurricular activities |

### Database Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /db-init | Initialize & seed database |
| POST | /db-init?force=true | Force re-seed |
| POST | /db-migrate-columns | Add new columns to tables |

## Configuration

### Database Connection

**File**: `api/lib/db-config.ts`

```typescript
// Automatically detects environment
const connectionString = 
  process.env['DATABASE_URL'] || 
  process.env['POSTGRES_URL'] ||
  'postgresql://sd_plandi_user:sd_plandi_local_pass@localhost:5432/sd_plandi';
```

### Frontend API URL

**File**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001' // Local Docker API
};
```

## Docker Services

### PostgreSQL Database

- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: sd_plandi
- **User**: sd_plandi_user
- **Password**: sd_plandi_local_pass
- **Volume**: postgres_data (persistent)

### API Server

- **Base Image**: node:20-alpine
- **Port**: 3001
- **Framework**: Express.js
- **Language**: Node.js (ES Modules)
- **Hot Reload**: Volume-mounted source code

## Database Schema

Tables created automatically on first run:

1. **students** - 161 students from Excel
2. **users** - Admin, teachers, staff
3. **sessions** - Authentication sessions
4. **attendance** - Check-in/out records
5. **leave_requests** - Izin/sakit requests
6. **intrakurikuler_subjects** - Subjects (12 total)
7. **intrakurikuler_class_assignments** - Class schedules
8. **extrakurikuler_activities** - Activities (4 total)
9. **extrakurikuler_members** - Student memberships

## Testing

### Test API Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-06T...",
  "environment": {
    "NODE_ENV": "development"
  },
  "database": {
    "connected": true,
    "tables": ["students", "users", ...]
  }
}
```

### Test Student Endpoint

```bash
curl -s http://localhost:3001/students | jq 'length'
# Expected: 161
```

### Test Authentication

```bash
# Login
curl -X POST http://localhost:3001/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@sdnplandi1jombang.sch.id",
    "password": "admin123"
  }'
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3001
lsof -i :3001

# Or use different port
PORT=3002 pnpm local:up
```

### Database Connection Failed

```bash
# Check database is running
docker ps | grep sd-plandi-db

# View database logs
docker logs sd-plandi-db

# Restart database
docker-compose -f docker-compose.local.yml restart db
```

### API Server Crashes

```bash
# View API logs
pnpm local:logs

# Rebuild API container
docker-compose -f docker-compose.local.yml up -d --build api
```

### Cannot Import TypeScript Files

The server uses Node.js with `--experimental-specifier-resolution=node` to import `.ts` files directly. If issues occur:

```bash
# Rebuild API container
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

## Development Workflow

### Day-to-Day Development

1. **Start Docker** (once per day):
   ```bash
   pnpm local:up
   ```

2. **Start Frontend**:
   ```bash
   pnpm start
   ```

3. **Develop**: Edit files, auto-reload enabled

4. **Stop when done**:
   ```bash
   pnpm local:down
   ```

### Adding New API Endpoints

1. Create endpoint file in `/api` folder
2. Add route in `api-server/server.js`
3. Restart API server:
   ```bash
   pnpm local:restart
   ```

### Database Changes

1. Update schema in `api/lib/database.ts`
2. Create migration in `api/db-migrate-columns.ts`
3. Run migration:
   ```bash
   pnpm local:migrate
   ```

## Deployment Strategy

### Local Development
- Frontend: `http://localhost:4200`
- API: `http://localhost:3001` (Docker)
- Database: `localhost:5432` (Docker)

### Production Option 1: Vercel Frontend + Local API
- Frontend: `https://plandi1jombang.vercel.app`
- API: `http://your-ip:3001` (Expose Docker API)
- Database: `localhost:5432` (Docker)

### Production Option 2: Full Docker
- Frontend: Docker container
- API: Docker container
- Database: Docker container
- Use `docker-compose.production.yml`

## Advantages

### No Serverless Limits
- Unlimited API endpoints
- No 12-function restriction
- Can add as many endpoints as needed

### Full Control
- Complete control over API server
- Custom middleware
- Advanced routing
- WebSocket support (if needed)

### Cost Effective
- Free local development
- No Vercel function costs
- Only pay for hosting if deployed

### Better Performance
- No cold starts
- Faster response times
- Persistent connections
- Better caching

## Current Endpoint Count

**Total**: 10 endpoints (no limit!)

1. /health
2. /auth
3. /admin
4. /students
5. /attendance
6. /leave-requests
7. /db-init
8. /db-migrate-columns
9. /intrakurikuler
10. /ekstrakurikuler

## Next Steps

1. ✅ Install API dependencies
2. ✅ Start Docker services
3. ✅ Initialize database
4. ✅ Seed with 161 students
5. ✅ Test API endpoints
6. ✅ Start frontend development

## Summary

This setup provides:
- ✅ No serverless function limits
- ✅ All 10 endpoints working locally
- ✅ Easy to add more endpoints
- ✅ Better development experience
- ✅ Full database control
- ✅ Production-ready architecture

---

**Last Updated**: 2026-01-06
**Docker Compose**: docker-compose.local.yml
**API Server**: http://localhost:3001
**Status**: ✅ Ready for Development
