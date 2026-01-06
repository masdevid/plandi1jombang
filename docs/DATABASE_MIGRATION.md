# Database Migration: SQLite → PostgreSQL (Neon)

## Overview
Successfully migrated the SDN Plandi attendance system from SQLite to PostgreSQL using Vercel's Neon database.

## Changes Made

### 1. Dependencies
**Added:**
- `@vercel/postgres@0.10.0` - PostgreSQL client for Vercel/Neon
- `@vercel/node@5.5.16` (dev) - TypeScript types for Vercel functions
- `tsx@4.21.0` (dev) - TypeScript execution runtime

**Retained (can be removed if not needed):**
- `better-sqlite3@12.5.0` - No longer used in production code

### 2. Database Configuration

**File: [api/lib/database.ts](api/lib/database.ts)**
- Replaced `better-sqlite3` with `@vercel/postgres`
- Changed from synchronous to asynchronous operations
- Updated table schema with PostgreSQL naming conventions (snake_case for columns)
- Added helper functions to map database rows to TypeScript objects:
  - `mapRowToStudent()`
  - `mapRowToAttendance()`
  - `mapRowToLeaveRequest()`

**Schema Changes:**
```sql
-- Column names now use snake_case (PostgreSQL convention)
students:
  - qrCode → qr_code
  - createdAt → created_at
  - updatedAt → updated_at

attendance:
  - studentId → student_id
  - studentName → student_name
  - studentNis → student_nis
  - studentClass → student_class
  - checkInTime → check_in_time
  - checkOutTime → check_out_time
  - createdAt → created_at

leave_requests:
  - studentId → student_id
  - studentName → student_name
  - studentNis → student_nis
  - studentClass → student_class
  - leaveType → leave_type
  - startDate → start_date
  - endDate → end_date
  - submittedAt → submitted_at
  - parentName → parent_name
  - parentContact → parent_contact
  - attachmentUrl → attachment_url
```

### 3. API Endpoints Updated

All API endpoints converted to async/await:

**[api/students.ts](api/students.ts)**
- GET /api/students - List all students
- GET /api/students?id=xxx - Get student by ID
- GET /api/students?nis=xxx - Get student by NIS
- GET /api/students?qrCode=xxx - Get student by QR code
- POST /api/students - Create new student
- PUT /api/students?id=xxx - Update student
- DELETE /api/students?id=xxx - Soft delete student

**[api/attendance.ts](api/attendance.ts)**
- GET /api/attendance - List recent attendance records
- GET /api/attendance?date=YYYY-MM-DD - Get attendance by date
- GET /api/attendance?studentId=xxx - Get student attendance history
- GET /api/attendance?action=stats&date=YYYY-MM-DD - Get daily statistics
- POST /api/attendance - Mark attendance (check-in)
- PUT /api/attendance - Update attendance (check-out)

**[api/leave-requests.ts](api/leave-requests.ts)**
- GET /api/leave-requests - List all leave requests
- GET /api/leave-requests?studentId=xxx - Get student's leave requests
- GET /api/leave-requests?status=xxx - Filter by status
- POST /api/leave-requests - Submit new leave request
- PUT /api/leave-requests - Approve/reject leave request

### 4. Migration Script

**File: [api/migrate.ts](api/migrate.ts)**
```bash
pnpm db:migrate
```
- Creates all tables with proper schema
- Creates indexes for performance
- Seeds database with 5 sample students

## Environment Variables

The following environment variables are already configured in [.env](.env):

```env
# Primary connection (with PgBouncer pooling)
DATABASE_URL=postgresql://neondb_owner:***@ep-tiny-waterfall-a1zzcmk6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Alternative variable names (Vercel standard)
POSTGRES_URL=postgresql://neondb_owner:***@ep-tiny-waterfall-a1zzcmk6-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Important:** Make sure to add these to your Vercel project environment variables for production deployment.

## Database Schema

### Students Table
```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  photo TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_nis TEXT NOT NULL,
  student_class TEXT NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('hadir', 'terlambat', 'izin', 'sakit', 'alpha')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### Leave Requests Table
```sql
CREATE TABLE leave_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_nis TEXT NOT NULL,
  student_class TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK(leave_type IN ('izin', 'sakit')),
  reason TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
  parent_name TEXT,
  parent_contact TEXT,
  attachment_url TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

## Benefits of PostgreSQL Migration

1. **Production-Ready**: PostgreSQL is enterprise-grade and widely used in production
2. **Serverless Optimization**: Neon database is optimized for serverless environments
3. **Better Concurrency**: Built-in connection pooling with PgBouncer
4. **Vercel Integration**: Native support for Vercel deployments
5. **Free Tier Available**: Neon offers generous free tier for development
6. **Auto-scaling**: Automatic scaling based on usage
7. **Backups**: Automated backups and point-in-time recovery

## Deployment Steps

1. **Ensure environment variables are set** in Vercel:
   - Go to your Vercel project settings
   - Add `POSTGRES_URL` environment variable
   - Copy the value from your local `.env` file

2. **Deploy the application**:
   ```bash
   git add .
   git commit -m "Migrate to PostgreSQL with Neon database"
   git push
   ```

3. **Run migration on first deploy** (automatic):
   - The database will auto-initialize on the first API request
   - Or run manually: `vercel env pull` then `pnpm db:migrate`

## Local Development

1. **Start the development server**:
   ```bash
   pnpm start
   ```

2. **Test API endpoints**:
   ```bash
   # Students API
   curl http://localhost:3000/api/students

   # Attendance API
   curl http://localhost:3000/api/attendance?date=2026-01-06

   # Leave Requests API
   curl http://localhost:3000/api/leave-requests?status=pending
   ```

## Troubleshooting

### Migration Issues
If you encounter errors during migration:
```bash
# Verify environment variables are loaded
cat .env | grep POSTGRES_URL

# Check database connectivity
pnpm db:migrate
```

### API Connection Issues
- Verify `POSTGRES_URL` is set in environment
- Check Neon database is active (auto-pauses after inactivity)
- Review Vercel function logs for connection errors

## Next Steps (Optional)

1. **Remove SQLite dependencies** (if no longer needed):
   ```bash
   pnpm remove better-sqlite3 @types/better-sqlite3
   ```

2. **Delete old SQLite database**:
   ```bash
   rm -rf data/
   ```

3. **Add database migrations system** (e.g., Prisma, Drizzle ORM)
4. **Implement connection pooling optimization**
5. **Add database monitoring and alerts**

---

**Migration completed successfully on 2026-01-06**
