# SDN Plandi - Backend API Documentation

## Overview

The backend API is built with TypeScript and uses **better-sqlite3** for secure, local database storage. All API endpoints are serverless functions that deploy to Vercel.

## Database

- **Type**: SQLite (better-sqlite3)
- **Location**: `data/attendance.db`
- **Features**:
  - ACID compliant
  - WAL mode for better concurrency
  - Automatic schema initialization
  - Indexed queries for performance

## API Endpoints

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

### Students API (`/api/students`)

#### GET /api/students
Get all students or search by ID/NIS/QR code

**Query Parameters**:
- `id` (optional): Student ID
- `nis` (optional): Student NIS
- `qrCode` (optional): QR Code

**Response**: `Student[]` or `Student`

#### POST /api/students
Create a new student

**Body**:
```json
{
  "nis": "2024001",
  "name": "Ahmad Rizki",
  "class": "1A",
  "qrCode": "STD001-2024001",
  "photo": "url (optional)",
  "active": true
}
```

**Response**: `Student`

#### PUT /api/students?id={studentId}
Update student information

**Body**:
```json
{
  "name": "Updated Name",
  "class": "2A",
  "active": true
}
```

**Response**: `Student`

### Attendance API (`/api/attendance`)

#### GET /api/attendance
Get attendance records

**Query Parameters**:
- `date` (optional): Filter by date (YYYY-MM-DD)
- `studentId` (optional): Filter by student
- `className` (optional): Filter by class (use with date)
- `action=stats&date={date}`: Get statistics

**Response**: `AttendanceRecord[]` or `AttendanceStats`

#### POST /api/attendance
Check-in or mark attendance

**Body**:
```json
{
  "qrCode": "STD001-2024001",
  "notes": "Optional notes",
  "status": "hadir" // optional, auto-determined if not provided
}
```

**Response**: `AttendanceRecord`

#### PUT /api/attendance
Update attendance record (e.g., checkout)

**Body**:
```json
{
  "id": "att000001",
  "checkOutTime": "2024-01-15T15:30:00.000Z",
  "status": "hadir",
  "notes": "Updated notes"
}
```

**Response**: `AttendanceRecord`

### Leave Requests API (`/api/leave-requests`)

#### GET /api/leave-requests
Get leave requests

**Query Parameters**:
- `studentId` (optional): Filter by student
- `nis` (optional): Filter by NIS
- `status` (optional): Filter by status (pending/approved/rejected)

**Response**: `LeaveRequest[]`

#### POST /api/leave-requests
Submit a new leave request

**Body**:
```json
{
  "studentId": "std001",
  "studentName": "Ahmad Rizki",
  "studentNis": "2024001",
  "studentClass": "1A",
  "leaveType": "sakit",
  "reason": "Demam tinggi",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "parentName": "Bapak Ahmad",
  "parentContact": "08123456789"
}
```

**Response**: `LeaveRequest`

#### PUT /api/leave-requests
Update leave request status

**Body**:
```json
{
  "id": "lr000001",
  "status": "approved"
}
```

**Response**: `LeaveRequest`

## Data Models

### Student
```typescript
interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  photo?: string;
  qrCode: string;
  active: boolean;
  createdAt: string;
}
```

### AttendanceRecord
```typescript
interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'alpha';
  notes?: string;
}
```

### LeaveRequest
```typescript
interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentClass: string;
  leaveType: 'izin' | 'sakit';
  reason: string;
  startDate: string;
  endDate: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  parentName?: string;
  parentContact?: string;
  attachmentUrl?: string;
}
```

## Using the API in Angular

The `AttendanceHttpService` provides methods to interact with the API:

```typescript
import { AttendanceHttpService } from './services/attendance-http.service';

// Inject the service
constructor(private attendanceService: AttendanceHttpService) {}

// Check-in
const record = await this.attendanceService.checkIn('STD001-2024001');

// Get attendance stats
const stats = await this.attendanceService.getAttendanceStats('2024-01-15');

// Submit leave request
const request = await this.attendanceService.submitLeaveRequest({
  studentId: 'std001',
  studentName: 'Ahmad Rizki',
  studentNis: '2024001',
  studentClass: '1A',
  leaveType: 'sakit',
  reason: 'Flu',
  startDate: '2024-01-15',
  endDate: '2024-01-15',
  parentName: 'Bapak Ahmad',
  parentContact: '08123456789'
});
```

## Deployment

### Vercel Deployment

1. The API endpoints are automatically deployed as serverless functions
2. SQLite database persists using Vercel's filesystem
3. CORS is configured to allow all origins (can be restricted in production)

### Environment Variables

No environment variables are required for basic operation. The database is file-based and stored in the `data/` directory.

## Security Features

- Input validation on all endpoints
- SQL injection protection (parameterized queries)
- CORS headers configured
- Error handling with appropriate HTTP status codes
- Data integrity constraints in database schema

## Performance

- Database indexes on frequently queried fields
- WAL mode for better concurrent read/write performance
- Efficient SQL queries with proper filtering
- Automatic connection pooling via better-sqlite3
