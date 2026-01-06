# API Tests

Comprehensive test suite for all SD Plandi API endpoints.

## Quick Start

### Option 1: Automated Setup & Test

```bash
# This will start Docker, initialize database, and run tests
pnpm setup
```

### Option 2: Manual Steps

```bash
# 1. Start Docker
pnpm docker:up

# 2. Wait 10 seconds, then initialize database
pnpm db:migrate:columns
pnpm db:seed

# 3. Run tests
pnpm test:api
```

## Test Scripts

### Node.js Test (Recommended)
```bash
pnpm test:api
# or
node tests/test-api.js
```

**Features**:
- ✅ No external dependencies (uses native fetch)
- ✅ Colored output
- ✅ Detailed results
- ✅ Tests all 10 endpoints
- ✅ Includes authentication flow

### Bash Test (Alternative)
```bash
pnpm test:api:sh
# or
bash tests/test-api.sh
```

**Requirements**: `curl`, `jq`

### Quick Test
```bash
pnpm test:quick
# or
bash tests/quick-test.sh
```

**Purpose**: Fast sanity check of main endpoints

## What Gets Tested

### 1. Health Check (/health)
- ✅ API is running
- ✅ Database connection
- ✅ Table existence

### 2. Students (/students)
- ✅ Endpoint responds
- ✅ Returns array
- ✅ Count is 161 (after seeding)

### 3. Authentication (/auth)
- ✅ Login with admin credentials
- ✅ Token generation
- ✅ Token verification

### 4. Admin Dashboard (/admin)
- ✅ Requires authentication
- ✅ Returns statistics
- ✅ User permissions

### 5. Attendance (/attendance)
- ✅ Endpoint responds
- ✅ Returns attendance records

### 6. Leave Requests (/leave-requests)
- ✅ Endpoint responds
- ✅ Returns leave requests

### 7. Intrakurikuler (/intrakurikuler)
- ✅ Returns subjects
- ✅ Count is correct
- ✅ Data structure valid

### 8. Ekstrakurikuler (/ekstrakurikuler)
- ✅ Returns activities
- ✅ Count is correct
- ✅ Data structure valid

### 9. Database Management
- ℹ️  Documented (not run to avoid data loss)

### 10. Error Handling
- ✅ 404 for non-existent endpoints
- ✅ Proper error responses

## Expected Results

### All Tests Pass
```
================================
Test Summary
================================
Total Tests: 15
Passed: 15
Failed: 0

✓ All tests passed!
```

### Some Tests Fail
If tests fail, common causes:

**Database Empty**:
```bash
# Solution
pnpm db:seed
```

**API Not Running**:
```bash
# Solution
pnpm docker:up
```

**Port Already in Use**:
```bash
# Check what's using port 3001
lsof -i :3001
# Kill it or change port
```

## Test Details

### Node.js Test Output Example

```
==================================================
SD Plandi API Test Suite
==================================================

Testing API at: http://localhost:3001

1. Health Check
Testing: GET /health... ✓ PASSED (HTTP 200)
  Database: Connected
  Tables: 9

2. Students Endpoint
Testing: GET /students... ✓ PASSED (HTTP 200)
  Student count: 161 ✓
  First student: ADELIA PUTRI RAMADHANI (3182391263)

3. Authentication
Testing: POST /auth (login)... ✓ PASSED (HTTP 200)
  Token: a1b2c3d4e5f6g7h8i9j0...
  User: Budi Hartono, S.Pd (admin)
Testing: GET /auth (verify token)... ✓ PASSED (HTTP 200)

4. Admin Endpoint
Testing: GET /admin?resource=dashboard... ✓ PASSED (HTTP 200)
  Total students: 161
  Pending leave requests: 0

5. Attendance Endpoint
Testing: GET /attendance... ✓ PASSED (HTTP 200)
  Attendance records: 0

6. Leave Requests Endpoint
Testing: GET /leave-requests... ✓ PASSED (HTTP 200)
  Leave requests: 0

7. Intrakurikuler Endpoint
Testing: GET /intrakurikuler... ✓ PASSED (HTTP 200)
  Subjects: 12
  First subject: Pendidikan Agama dan Budi Pekerti (PAI)

8. Ekstrakurikuler Endpoint
Testing: GET /ekstrakurikuler... ✓ PASSED (HTTP 200)
  Activities: 4
  First activity: Pramuka (PRAMUKA)

9. Database Management
  Note: Skipping db-init to avoid resetting data

10. Error Handling
Testing: GET /nonexistent (404)... ✓ PASSED (HTTP 404)

==================================================
Test Summary
==================================================
Total Tests: 15
Passed: 15
Failed: 0

✓ All tests passed!
```

## Continuous Integration

These tests can be integrated into CI/CD:

```yaml
# .github/workflows/test.yml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: docker compose up -d
      - run: sleep 10
      - run: npm run db:seed
      - run: npm run test:api
```

## Troubleshooting

### Connection Refused
```bash
# Check if Docker is running
docker ps

# Check API logs
docker compose logs api

# Restart services
pnpm docker:down
pnpm docker:up
```

### Database Empty
```bash
# Re-seed database
pnpm db:seed

# Verify
curl -s http://localhost:3001/students | node -p "JSON.parse(require('fs').readFileSync(0)).length"
```

### Tests Timing Out
```bash
# Increase wait time in start-and-test.sh
# Edit line: sleep 10
# Change to: sleep 20
```

## Manual Testing

### Test Health
```bash
curl http://localhost:3001/health | jq
```

### Test Login
```bash
curl -X POST http://localhost:3001/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "admin@sdnplandi1jombang.sch.id",
    "password": "admin123"
  }' | jq
```

### Test Students
```bash
curl http://localhost:3001/students | jq '. | length'
```

### Test Intrakurikuler
```bash
curl http://localhost:3001/intrakurikuler | jq
```

### Test Ekstrakurikuler
```bash
curl http://localhost:3001/ekstrakurikuler | jq
```

## Test Coverage

| Endpoint | Method | Auth Required | Tested |
|----------|--------|---------------|--------|
| /health | GET | No | ✅ |
| /auth | POST | No | ✅ |
| /auth | GET | Yes | ✅ |
| /students | GET | No | ✅ |
| /admin | GET | Yes | ✅ |
| /attendance | GET | No | ✅ |
| /leave-requests | GET | No | ✅ |
| /db-init | POST | No | ℹ️ |
| /db-migrate-columns | POST | No | ℹ️ |
| /intrakurikuler | GET | No | ✅ |
| /ekstrakurikuler | GET | No | ✅ |

**Legend**:
- ✅ Tested automatically
- ℹ️  Documented (manual test recommended)

---

**Last Updated**: 2026-01-06
**Test Scripts**: 3 (Node.js, Bash, Quick)
**Status**: ✅ Ready
