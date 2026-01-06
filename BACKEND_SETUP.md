# Backend API Setup Guide

## Overview

Your SDN Plandi application now has two attendance services:

1. **AttendanceService** (Original) - Uses local JSON file
2. **AttendanceHttpService** (New) - Uses secure backend API with SQLite database

## Quick Start

### Option 1: Using the New Backend API (Recommended)

The backend API provides:
- ✅ Secure SQLite database
- ✅ Proper data persistence
- ✅ RESTful API endpoints
- ✅ Ready for production deployment
- ✅ ACID compliance
- ✅ Better performance with indexed queries

**To use the new backend API**, you need to update your components to inject `AttendanceHttpService` instead of `AttendanceService`.

### Option 2: Keep Using JSON File (Development Only)

The original `AttendanceService` still works but data is lost on page refresh.

## Switching to the Backend API

### Update Components

You need to update the service injection in each component. Here's how:

**Before** (using JSON):
```typescript
import { AttendanceService } from '../services/attendance.service';

constructor(private attendanceService: AttendanceService) {}
```

**After** (using Backend API):
```typescript
import { AttendanceHttpService } from '../services/attendance-http.service';

constructor(private attendanceService: AttendanceHttpService) {}
```

### Components to Update

1. `src/app/pages/absensi/check-in/check-in.ts`
2. `src/app/pages/absensi/report/report.ts`
3. `src/app/pages/absensi/students/students.ts`
4. `src/app/pages/absensi/parent-portal/parent-portal.ts`

### Important: Method Changes

Most methods in `AttendanceHttpService` are **async** and return Promises. You need to:

1. Add `async` to your methods
2. Use `await` when calling service methods

**Example Update**:

**Before**:
```typescript
loadReport() {
  this.attendanceRecords = this.attendanceService.getAttendanceByDate(this.selectedDate);
  this.stats = this.attendanceService.getAttendanceStats(this.selectedDate);
}
```

**After**:
```typescript
async loadReport() {
  this.attendanceRecords = await this.attendanceService.getAttendanceByDate(this.selectedDate);
  this.stats = await this.attendanceService.getAttendanceStats(this.selectedDate);
}
```

## Running the Backend Locally

### Start the Development Server

The backend API is serverless and runs automatically with Vercel. For local development:

```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Start local development server
vercel dev
```

This will start:
- **Angular app**: http://localhost:4200
- **API endpoints**: http://localhost:3000/api

### Database Location

The SQLite database is stored at:
```
data/attendance.db
```

You can inspect it using any SQLite browser tool.

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

Quick overview:
- `GET/POST /api/students` - Manage students
- `GET/POST/PUT /api/attendance` - Manage attendance
- `GET/POST/PUT /api/leave-requests` - Manage leave requests

## Deployment to Vercel

### Automatic Deployment

When you push to your repository, Vercel automatically:
1. Builds the Angular application
2. Deploys API functions
3. Creates the SQLite database

### Manual Deployment

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod
```

## Environment Configuration

### Development
Uses: `src/environments/environment.ts`
API URL: `http://localhost:3000/api`

### Production
Uses: `src/environments/environment.prod.ts`
API URL: `/api` (relative path)

## Troubleshooting

### Issue: API calls fail with CORS errors

**Solution**: Make sure you're running both the Angular dev server and the API:
```bash
# Terminal 1: Angular
pnpm start

# Terminal 2: API
vercel dev
```

### Issue: Database not found

**Solution**: The database is created automatically on first API call. Make sure the `data/` directory exists:
```bash
mkdir -p data
```

### Issue: Better-sqlite3 build errors

**Solution**: Rebuild the native module:
```bash
cd node_modules/better-sqlite3
npm run build-release
```

## Migration Path

### Step 1: Test the New Service
Keep both services available and test the new one first in development.

### Step 2: Update One Component at a Time
Start with the check-in component, then move to others.

### Step 3: Remove Old Service
Once all components use `AttendanceHttpService`, you can remove `AttendanceService`.

## Benefits of Backend API

- **Data Persistence**: Data survives page refreshes and deployments
- **Security**: Proper database with constraints and validation
- **Performance**: Indexed queries, faster lookups
- **Scalability**: Ready to handle more users
- **Professional**: Production-ready architecture
- **Concurrent Access**: Multiple users can access simultaneously

## Next Steps

1. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Update one component to use `AttendanceHttpService`
3. Test the functionality
4. Update remaining components
5. Deploy to Vercel

Need help? Check the API documentation or review the service implementation in `src/app/services/attendance-http.service.ts`.
