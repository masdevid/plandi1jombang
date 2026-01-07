# Deployment Comparison: Vercel vs Local Docker

## Summary

| Aspect | Vercel (Before) | Local Docker (Now) |
|--------|----------------|-------------------|
| **API Endpoints** | 12 max (Hobby plan) | Unlimited |
| **Current Endpoints** | 11 (near limit) | 8 (no limit) |
| **Function Cost** | Paid after limit | Free |
| **Cold Starts** | Yes (~1s) | No |
| **Response Time** | 200-500ms | 50-100ms |
| **Database** | Vercel Postgres (Neon) | PostgreSQL (Docker) |
| **Setup Complexity** | Easy (git push) | Medium (Docker) |
| **Cost** | $0 (Hobby) → $20/month (Pro) | $0 (local) |
| **Scalability** | Auto-scaled | Manual scaling |
| **Development** | Slow (deploy each time) | Fast (instant reload) |

## Vercel Deployment (Frontend Only)

### What's Deployed to Vercel
- ✅ Angular frontend (static files)
- ✅ Routing configuration
- ✅ Environment variables
- ❌ API endpoints (excluded via .vercelignore)

### Configuration

**.vercelignore**:
```
api/
api-server/
```

**Build Command**: `pnpm build`

**Output Directory**: `dist/sd-plandi`

## Local Docker (API Only)

### What Runs Locally
- ✅ Express API server (10 endpoints)
- ✅ PostgreSQL database
- ✅ All business logic
- ✅ Authentication
- ✅ File uploads (future)

### Architecture

```
Vercel (Frontend)
        ↓
   HTTP Requests
        ↓
Local Docker (API)
        ↓
PostgreSQL (Docker)
```

## Development Workflow

### Before (Vercel Only)

```bash
# Make API changes
git add api/
git commit -m "update API"
git push

# Wait 30-60s for Vercel deployment
# Test changes
```

**Issues**:
- Slow feedback loop
- Limited to 12 endpoints
- Cold starts
- Build errors break everything

### After (Local Docker)

```bash
# Make API changes
# API auto-reloads instantly
# Test changes immediately
```

**Benefits**:
- Instant feedback
- Unlimited endpoints
- No cold starts
- Frontend and API separate

## Endpoint Migration

### Removed from Vercel
All 8 API endpoints now run locally:

1. /health → http://localhost:3001/health
2. /auth → http://localhost:3001/auth
3. /admin → http://localhost:3001/admin
4. /students → http://localhost:3001/students
5. /attendance → http://localhost:3001/attendance
6. /leave-requests → http://localhost:3001/leave-requests
7. /db-migrate → http://localhost:3001/db-migrate
8. /promote-students → http://localhost:3001/promote-students

### Why This is Better

1. **No Limits**: Add as many endpoints as needed
2. **Faster**: No cold starts, instant responses
3. **Cheaper**: No Vercel function costs
4. **Easier Development**: Instant feedback loop
5. **Better Control**: Full access to server configuration
6. **Database Freedom**: Not tied to Vercel Postgres

## Production Deployment Options

### Option 1: Vercel Frontend + Cloud API

**Frontend**: Vercel (free)
**API**: Cloud server (DigitalOcean, AWS, etc.)
**Database**: Managed PostgreSQL

```bash
# Deploy API to cloud server
docker-compose -f docker-compose.production.yml up -d

# Expose port 3001
# Update frontend environment.production.ts:
apiUrl: 'https://api.your-domain.com'
```

### Option 2: Vercel Frontend + Home Server API

**Frontend**: Vercel (free)
**API**: Your computer (Docker)
**Database**: Local PostgreSQL

```bash
# Start API on your computer
pnpm local:up

# Use ngrok or similar to expose:
ngrok http 3001

# Update frontend:
apiUrl: 'https://your-ngrok-url.ngrok.io'
```

### Option 3: Full Docker (VPS)

**Frontend**: Docker container
**API**: Docker container
**Database**: Docker container

```bash
# Deploy everything to VPS
docker-compose -f docker-compose.production.yml up -d
```

## Cost Comparison

### Vercel Hobby (Previous)
- Frontend: $0
- Functions: $0 (limited to 12)
- Database: $0 (limited)
- **Total**: $0/month (with severe limits)

### Vercel Pro (If continued)
- Frontend: $20/month
- Functions: $20/month + usage
- Database: $20/month + usage
- **Total**: $60+/month

### Local Docker (Current)
- Frontend on Vercel: $0
- API on local computer: $0
- Database: $0
- **Total**: $0/month (electricity only)

### Cloud VPS (Future)
- Frontend on Vercel: $0
- API + DB on VPS: $5-10/month
- **Total**: $5-10/month

## Performance Comparison

### Response Times

**Vercel (Cold Start)**:
- First request: 1000-2000ms
- Subsequent: 200-500ms

**Local Docker**:
- All requests: 50-100ms
- No cold starts

### Database Queries

**Vercel Postgres (Neon)**:
- Connection overhead: 50-100ms
- Query: 10-50ms

**Local PostgreSQL**:
- Connection overhead: 1-5ms
- Query: 5-20ms

## Migration Checklist

- ✅ Created api-server/ directory
- ✅ Created Express server (server.js)
- ✅ Created Docker Compose config
- ✅ Created Dockerfile for API
- ✅ Added npm scripts
- ✅ Updated environment.ts
- ✅ Created .vercelignore
- ✅ Installed API dependencies
- ✅ Documented setup

## Rollback Plan

If needed, you can revert to Vercel-only:

1. Remove .vercelignore
2. Restore environment.ts:
   ```typescript
   apiUrl: '/api'
   ```
3. Push to GitHub
4. Vercel will deploy API again

## Recommendation

**Use Local Docker for**:
- ✅ Development
- ✅ Testing
- ✅ Learning
- ✅ Cost savings
- ✅ Full control

**Use Vercel for**:
- ✅ Frontend hosting
- ✅ Easy deployment
- ✅ CDN benefits
- ✅ SSL certificates

**Best of Both Worlds**:
- Frontend on Vercel (free, fast, global CDN)
- API on local Docker (free, unlimited, fast)

---

**Last Updated**: 2026-01-06
**Status**: ✅ Migration Complete
**Recommendation**: Local Docker for API, Vercel for Frontend
