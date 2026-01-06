# Docker Deployment Guide

## Overview

The SD Plandi attendance system supports **two deployment modes**:

1. **Vercel Deployment** - Uses Neon DB (serverless PostgreSQL)
2. **Docker Deployment** - Uses local PostgreSQL database

The system **automatically detects** the environment and uses the appropriate database configuration.

See full documentation at: https://github.com/yourusername/sd-plandi

## Quick Start

```bash
# 1. Configure environment
cp .env.production.example .env.production
nano .env.production  # Set secure passwords

# 2. Build and run
pnpm docker:build
pnpm docker:run

# 3. Initialize database
curl -X POST http://localhost:3000/api/db-init

# 4. Access application
open http://localhost:3000
```

**Default Login**: admin@sdnplandi1jombang.sch.id / admin123

For complete documentation, see the full guide in this file.
