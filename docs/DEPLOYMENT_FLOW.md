# Deployment Flow Diagram

**Date**: 2026-01-08

## Smart Deployment Decision Tree

```
┌─────────────────────────────────┐
│   Push to main branch           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   GitHub Actions Triggered      │
│   (detect-changes job)          │
└────────────┬────────────────────┘
             │
             ▼
      ┌──────┴──────┐
      │  Git Diff   │
      │  Analysis   │
      └──────┬──────┘
             │
    ┌────────┴────────┬────────────────┬─────────────┐
    │                 │                │             │
    ▼                 ▼                ▼             ▼
┌─────────┐    ┌──────────┐    ┌───────────┐  ┌──────────┐
│ docs/** │    │ api/**   │    │ src/**    │  │Dockerfile│
│ *.md    │    │api-server│    │angular.   │  │docker-   │
│         │    │          │    │  json     │  │compose.yml│
└────┬────┘    └────┬─────┘    └─────┬─────┘  └────┬─────┘
     │              │                 │             │
     │              │                 │             │
     ▼              ▼                 ▼             ▼
 ┌───────┐     ┌─────────┐      ┌─────────┐   ┌──────────┐
 │ SKIP  │     │REBUILD  │      │  PULL   │   │ REBUILD  │
 │DEPLOY │     │API ONLY │      │  CODE   │   │   ALL    │
 └───────┘     └────┬────┘      └────┬────┘   └────┬─────┘
                    │                 │             │
                    ▼                 ▼             ▼
              ┌──────────┐      ┌──────────┐  ┌──────────┐
              │docker-   │      │git pull  │  │docker-   │
              │compose   │      │docker-   │  │compose   │
              │stop api  │      │compose   │  │down      │
              │          │      │restart   │  │          │
              │docker-   │      │api       │  │docker-   │
              │compose   │      │          │  │compose   │
              │build api │      └──────────┘  │build     │
              │          │           │        │--no-cache│
              │docker-   │           │        │          │
              │compose   │           │        │docker-   │
              │up -d api │           │        │compose   │
              └────┬─────┘           │        │up -d     │
                   │                 │        └────┬─────┘
                   └─────────────────┴─────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Health Checks   │
                            │ - API /health   │
                            │ - DB pg_isready │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Deployment Done │
                            │ Show logs       │
                            └─────────────────┘
```

## Deployment Time Comparison

### Before Optimization
```
Every push → Full rebuild → 3 minutes
```

| Scenario | Time | Steps |
|----------|------|-------|
| Fix typo in README | 3 min | Full Docker rebuild 😞 |
| Update dashboard UI | 3 min | Full Docker rebuild 😞 |
| Fix API bug | 3 min | Full Docker rebuild 😞 |
| Update Dockerfile | 3 min | Full Docker rebuild ✅ |

**Total**: ~12 minutes for 4 deployments

### After Optimization
```
Smart detection → Selective rebuild → 10s to 3 min
```

| Scenario | Time | Steps | Savings |
|----------|------|-------|---------|
| Fix typo in README | 0 sec | Deployment skipped ✅ | -3 min |
| Update dashboard UI | 10 sec | Pull code + restart ✅ | -2m 50s |
| Fix API bug | 2 min | Rebuild API only ✅ | -1 min |
| Update Dockerfile | 3 min | Rebuild all ✅ | Same |

**Total**: ~2 minutes 10 seconds for 3 deployments (1 skipped)

**Improvement**: **83% faster** on average

## File Change Detection Rules

### 1. Documentation Changes (SKIP DEPLOYMENT)
```yaml
paths-ignore:
  - 'docs/**'
  - 'README.md'
  - '*.md'
```

**Files**:
- `docs/AUTO_DEPLOYMENT.md`
- `docs/SCHEMA_UPDATE_SUMMARY.md`
- `README.md`
- Any `*.md` file

**Action**: Workflow doesn't run at all

### 2. API Changes (REBUILD API ONLY)
```bash
if changed: api/ OR api-server/
  → rebuild API container
```

**Files**:
- `api/auth.ts`
- `api/admin.ts`
- `api-server/server.js`
- `api-server/package.json`

**Action**:
```bash
docker-compose stop api
docker-compose build api
docker-compose up -d api
```

### 3. Frontend Changes (PULL CODE ONLY)
```bash
if changed: src/ OR angular.json OR package.json
  → pull code, restart
```

**Files**:
- `src/app/**/*`
- `angular.json`
- `package.json` (if not in api-server)

**Action**:
```bash
git pull
docker-compose restart api
```

**Note**: Frontend is served statically by Vercel/nginx, not by Docker

### 4. Docker Configuration (REBUILD ALL)
```bash
if changed: Dockerfile OR docker-compose.yml
  → rebuild all containers
```

**Files**:
- `Dockerfile.api`
- `docker-compose.yml`
- `.env.docker`

**Action**:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 5. Scripts/Config Changes (RESTART ONLY)
```bash
if changed: scripts/ OR other files
  → pull code, restart
```

**Files**:
- `scripts/deploy.sh`
- `.github/workflows/deploy.yml`
- Configuration files

**Action**:
```bash
git pull
docker-compose restart
```

## Manual Force Rebuild

When you need to rebuild everything (e.g., after npm update):

### Via GitHub Actions UI
1. Go to **Actions** → **Deploy to Production Server**
2. Click **Run workflow**
3. ✅ Check **Force rebuild Docker images**
4. Click **Run workflow**

### Via SSH
```bash
ssh user@server
cd /opt/sd-plandi
sudo bash scripts/deploy.sh
# OR manually:
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

Deployment script uses these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_DIR` | `/opt/sd-plandi` | Project directory on server |
| `BRANCH` | `main` | Git branch to deploy |
| `LOG_FILE` | `/var/log/sd-plandi-deploy.log` | Deployment log file |

GitHub Actions uses these secrets:

| Secret | Required | Description |
|--------|----------|-------------|
| `SERVER_HOST` | ✅ Yes | Server IP or domain |
| `SERVER_USER` | ✅ Yes | SSH username |
| `SERVER_SSH_KEY` | ✅ Yes | SSH private key |
| `SERVER_PORT` | No | SSH port (default: 22) |
| `PROJECT_PATH` | No | Project path (default: /opt/sd-plandi) |

## Monitoring Deployments

### GitHub Actions
- View logs: **GitHub** → **Actions** → Select workflow run
- Re-run failed deployment: Click **Re-run jobs**
- Cancel running deployment: Click **Cancel workflow**

### Server Logs
```bash
# Deployment logs
sudo tail -f /var/log/sd-plandi-deploy.log

# Container logs
docker-compose logs -f
docker-compose logs -f api
docker-compose logs -f db

# System logs (for webhook method)
sudo journalctl -u webhook -f
```

## Best Practices

### 1. Commit Meaningful Messages
```bash
# Good - triggers smart deployment
git commit -m "fix(api): correct authentication query"
git commit -m "feat(dashboard): add Material components"
git commit -m "docs: update deployment guide"

# Bad - unclear what changed
git commit -m "update"
git commit -m "fix"
```

### 2. Separate Concerns
- Don't mix API and frontend changes in one commit
- API changes → separate commit → faster rebuild detection
- Documentation → separate commit → skip deployment

### 3. Test Locally First
```bash
# Before pushing, test locally:
docker-compose down
docker-compose build
docker-compose up -d
docker-compose ps
curl http://localhost:3001/health
```

### 4. Use Force Rebuild Sparingly
Only force rebuild when:
- Updated npm dependencies
- Changed system dependencies
- Build cache corruption suspected
- After major Docker updates

Regular code changes don't need force rebuild!

## Troubleshooting

### Deployment Skipped When It Shouldn't Be

**Problem**: Changed API code but workflow didn't run

**Solution**: Check if you edited a file in `docs/` or `*.md` - these are ignored

### Rebuild When It Shouldn't

**Problem**: Changed README but Docker rebuilt

**Solution**: Ensure your README filename matches `*.md` pattern and is in root or `docs/`

### Failed Health Check

**Problem**: Deployment succeeded but API health check failed

**Solution**:
```bash
# Check API logs
docker-compose logs api

# Check database
docker exec sd-plandi-db pg_isready -U sd_plandi_user

# Manually restart
docker-compose restart api
```

---

**Last Updated**: 2026-01-08
**See Also**: [AUTO_DEPLOYMENT.md](./AUTO_DEPLOYMENT.md) for full setup guide
