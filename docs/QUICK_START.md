# Quick Start Guide - PostgreSQL Database

## Environment Setup

1. **Copy environment variables** (already configured):
   ```bash
   # Your .env file is already set up with Neon credentials
   cat .env
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run database migration**:
   ```bash
   pnpm db:migrate
   ```
   ✅ Creates tables, indexes, and seeds 5 sample students

## Development Commands

```bash
# Start Angular dev server
pnpm start

# Run database migration
pnpm db:migrate

# Build for production
pnpm build

# Run tests
pnpm test
```

## API Endpoints

### Base URL
- **Local**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

### Students
```bash
# List all students
GET /api/students

# Get student by ID
GET /api/students?id=std001

# Get student by NIS
GET /api/students?nis=2024001

# Get student by QR code
GET /api/students?qrCode=STD001-2024001

# Create student
POST /api/students
{
  "nis": "2024006",
  "name": "Student Name",
  "class": "1A",
  "qrCode": "STD006-2024006",
  "active": true
}

# Update student
PUT /api/students?id=std001
{
  "name": "Updated Name",
  "class": "2A"
}

# Soft delete student
DELETE /api/students?id=std001
```

### Attendance
```bash
# List recent attendance (last 100)
GET /api/attendance

# Get attendance by date
GET /api/attendance?date=2026-01-06

# Get student attendance history
GET /api/attendance?studentId=std001

# Get attendance by class and date
GET /api/attendance?date=2026-01-06&className=1A

# Get daily statistics
GET /api/attendance?action=stats&date=2026-01-06

# Mark attendance (check-in)
POST /api/attendance
{
  "qrCode": "STD001-2024001",
  "notes": "On time"
}

# Update attendance (check-out)
PUT /api/attendance
{
  "id": "att000001",
  "checkOutTime": "2026-01-06T15:00:00.000Z",
  "notes": "Left early"
}
```

### Leave Requests
```bash
# List all leave requests
GET /api/leave-requests

# Get student's leave requests
GET /api/leave-requests?studentId=std001

# Filter by status (pending, approved, rejected)
GET /api/leave-requests?status=pending

# Submit leave request
POST /api/leave-requests
{
  "studentId": "std001",
  "studentName": "Ahmad Rizki Pratama",
  "studentNis": "2024001",
  "studentClass": "1A",
  "leaveType": "sakit",
  "reason": "Flu",
  "startDate": "2026-01-07",
  "endDate": "2026-01-08",
  "parentName": "Parent Name",
  "parentContact": "081234567890"
}

# Update leave request status
PUT /api/leave-requests
{
  "id": "lr000001",
  "status": "approved"
}
```

## Database Connection

### Connection String Format
```
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

### Current Setup (Neon PostgreSQL)
- **Provider**: Neon (Vercel's serverless PostgreSQL)
- **Region**: ap-southeast-1 (Singapore)
- **Connection**: Pooled (PgBouncer)
- **SSL**: Required

## Testing the Setup

### 1. Test Database Connection
```bash
pnpm db:migrate
# Should output:
# ✓ Database schema initialized
# ✓ Database seeded with initial data
# Migration completed successfully!
```

### 2. Test API Endpoints
```bash
# Get all students
curl http://localhost:3000/api/students

# Expected output: Array of 5 students
[
  {
    "id": "std001",
    "nis": "2024001",
    "name": "Ahmad Rizki Pratama",
    "class": "1A",
    "qrCode": "STD001-2024001",
    "active": true,
    "createdAt": "2024-01-15T08:00:00.000Z"
  },
  ...
]
```

### 3. Test Attendance
```bash
# Mark attendance
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"STD001-2024001"}'

# Get today's stats
curl "http://localhost:3000/api/attendance?action=stats&date=$(date +%Y-%m-%d)"
```

## Frontend Integration

The Angular frontend already uses the HTTP service:

```typescript
// src/app/services/attendance-http.service.ts
constructor(private http: HttpClient) {}

// All API calls go through this service
getStudents(): Observable<Student[]>
getAttendance(date?: string): Observable<AttendanceRecord[]>
markAttendance(data: any): Observable<AttendanceRecord>
// etc.
```

No changes needed in the frontend! The API endpoints remain the same.

## Common Issues

### "Missing connection string" error
**Solution**: Make sure `.env` file exists and contains `POSTGRES_URL`
```bash
cat .env | grep POSTGRES_URL
```

### Database not initialized
**Solution**: Run the migration script
```bash
pnpm db:migrate
```

### Vercel deployment fails
**Solution**: Add environment variables in Vercel dashboard
1. Go to Vercel project → Settings → Environment Variables
2. Add `POSTGRES_URL` with your Neon connection string
3. Redeploy

## Sample Data

After running `pnpm db:migrate`, you'll have 5 sample students:

| ID | NIS | Name | Class | QR Code |
|----|-----|------|-------|---------|
| std001 | 2024001 | Ahmad Rizki Pratama | 1A | STD001-2024001 |
| std002 | 2024002 | Siti Nurhaliza | 1A | STD002-2024002 |
| std003 | 2024003 | Budi Santoso | 2A | STD003-2024003 |
| std004 | 2024004 | Dewi Lestari | 2A | STD004-2024004 |
| std005 | 2024005 | Eko Prasetyo | 3A | STD005-2024005 |

## Production Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: migrate to PostgreSQL with Neon"
   git push
   ```

2. **Configure Vercel**:
   - Add `POSTGRES_URL` in environment variables
   - Deploy

3. **Verify**:
   ```bash
   curl https://your-domain.vercel.app/api/students
   ```

---

**Database Type**: PostgreSQL (Neon)
**Last Updated**: 2026-01-06
**Status**: ✅ Production Ready
