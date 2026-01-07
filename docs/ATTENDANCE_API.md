# Attendance API Documentation

**Last Updated:** 2026-01-08
**Schema Version:** Unified Dapodik-style

## Overview

The Attendance API works with the new Dapodik-style schema, utilizing relationships between students, rombels, rombel_memberships, and attendance tables. It supports QR code scanning and tracks daily attendance for students in their active rombels.

## Base URL

```
http://localhost:3001/attendance
```

## Schema Integration

The attendance system uses:
- **students** - Student identity
- **rombels** - Class groups (e.g., "Kelas 1", "Kelas 2")
- **rombel_memberships** - Student enrollment in classes
- **academic_years** - School year context (2026/2027 active)
- **attendance** - Daily attendance records

## Endpoints

### 1. Record Attendance (QR Scanner)

**POST** `/attendance`

Record student attendance via QR code or student ID.

**Request Body:**
```json
{
  "qrCode": "STD001-3182391263",  // OR use studentId in query
  "status": "present",             // Optional: present|sick|excused|absent
  "notes": "Optional notes"
}
```

**Query Parameters:**
- `studentId` (optional) - Alternative to qrCode

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "record": {
    "id": "att000001",
    "student_id": "std001",
    "nisn": "3182391263",
    "full_name": "ADELIA PUTRI RAMADHANI",
    "rombel_id": "rmb2601",
    "grade_level": 1,
    "class_name": "Kelas 1",
    "attendance_date": "2026-01-08",
    "status": "present",
    "notes": null,
    "created_at": "2026-01-08T07:30:00.000Z"
  }
}
```

**Status Values:**
- `present` - Student is present
- `sick` - Student is sick
- `excused` - Student is excused
- `absent` - Student is absent

**Auto-detection:** If status is not provided, system automatically determines:
- `present` if check-in before 7:15 AM
- `sick` if check-in after 7:15 AM (you can change this logic)

**Error Responses:**

409 Conflict - Already checked in:
```json
{
  "error": "Already checked in today",
  "record": { /* existing record */ }
}
```

404 Not Found - Student not enrolled:
```json
{
  "error": "Student not found or not enrolled in active academic year"
}
```

### 2. Get Attendance by Date

**GET** `/attendance?date=2026-01-08`

Get all attendance records for a specific date.

**Response:**
```json
[
  {
    "id": "att000001",
    "student_id": "std001",
    "nisn": "3182391263",
    "full_name": "ADELIA PUTRI RAMADHANI",
    "rombel_id": "rmb2601",
    "grade_level": 1,
    "class_name": "Kelas 1",
    "attendance_date": "2026-01-08",
    "status": "present",
    "notes": null,
    "created_at": "2026-01-08T07:30:00.000Z"
  }
]
```

### 3. Get Attendance Statistics

**GET** `/attendance?action=stats&date=2026-01-08`

Get attendance statistics for a specific date.

**Response:**
```json
{
  "date": "2026-01-08",
  "totalStudents": 161,
  "present": 145,
  "sick": 5,
  "excused": 3,
  "absent": 2,
  "notRecorded": 6,
  "attendanceRate": "90.06"
}
```

### 4. Get Attendance by Rombel

**GET** `/attendance?action=by-rombel&rombelId=rmb2601&date=2026-01-08`

Get attendance for a specific class on a specific date.

**Response:**
```json
[
  {
    "id": "att000001",
    "student_id": "std001",
    "nisn": "3182391263",
    "full_name": "ADELIA PUTRI RAMADHANI",
    "gender": "P",
    "attendance_date": "2026-01-08",
    "status": "present",
    "notes": null,
    "created_at": "2026-01-08T07:30:00.000Z"
  }
]
```

### 5. Get Attendance by Grade Level

**GET** `/attendance?action=by-grade&gradeLevel=1&date=2026-01-08`

Get attendance for all students in a specific grade on a specific date.

**Response:**
```json
[
  {
    "id": "att000001",
    "student_id": "std001",
    "nisn": "3182391263",
    "full_name": "ADELIA PUTRI RAMADHANI",
    "gender": "P",
    "class_name": "Kelas 1",
    "attendance_date": "2026-01-08",
    "status": "present",
    "notes": null,
    "created_at": "2026-01-08T07:30:00.000Z"
  }
]
```

### 6. Get Student Attendance History

**GET** `/attendance?action=by-student&studentId=std001`

Get attendance history for a specific student.

**Response:**
```json
[
  {
    "id": "att000001",
    "attendance_date": "2026-01-08",
    "status": "present",
    "notes": null,
    "grade_level": 1,
    "class_name": "Kelas 1",
    "academic_year": "2026/2027",
    "created_at": "2026-01-08T07:30:00.000Z"
  }
]
```

### 7. Update Attendance Record

**PUT** `/attendance`

Update an existing attendance record.

**Request Body:**
```json
{
  "id": "att000001",
  "status": "sick",
  "notes": "Updated status to sick"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "record": { /* updated record */ }
}
```

### 8. Get Recent Attendance

**GET** `/attendance`

Get the last 100 attendance records.

**Response:**
```json
[
  { /* attendance record */ },
  { /* attendance record */ }
]
```

## Key Features

### QR Code Integration
- Scan student QR code for instant check-in
- QR code format: `STD{id}-{nisn}` (e.g., "STD001-3182391263")
- Automatic student lookup with active rombel

### Academic Year Awareness
- Only records attendance for students in active academic year (2026/2027)
- Links attendance to student's current rombel
- Supports historical queries across academic years

### Duplicate Prevention
- One attendance record per student per rombel per date
- Returns existing record if already checked in

### Automatic Status Detection
- Late detection based on 7:15 AM cutoff
- Can be overridden by providing explicit status

## Usage Examples

### QR Code Scanner Integration

```javascript
// Scan QR code and record attendance
async function scanAndRecord(qrCode) {
  const response = await fetch('http://localhost:3001/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCode })
  });

  const result = await response.json();

  if (response.status === 201) {
    console.log('✅ Attendance recorded:', result.record);
  } else if (response.status === 409) {
    console.log('⚠️ Already checked in:', result.record);
  } else {
    console.log('❌ Error:', result.error);
  }
}

// Example: Scan student QR code
scanAndRecord('STD001-3182391263');
```

### Daily Attendance Dashboard

```javascript
// Get today's attendance statistics
async function getDailyStats() {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(
    `http://localhost:3001/attendance?action=stats&date=${today}`
  );
  const stats = await response.json();

  console.log(`
    Total Students: ${stats.totalStudents}
    Present: ${stats.present}
    Sick: ${stats.sick}
    Excused: ${stats.excused}
    Absent: ${stats.absent}
    Not Recorded: ${stats.notRecorded}
    Attendance Rate: ${stats.attendanceRate}%
  `);
}
```

### Class Attendance Report

```javascript
// Get attendance for a specific class
async function getClassAttendance(rombelId, date) {
  const response = await fetch(
    `http://localhost:3001/attendance?action=by-rombel&rombelId=${rombelId}&date=${date}`
  );
  const attendance = await response.json();

  console.log(`Class Attendance for ${rombelId} on ${date}:`);
  attendance.forEach(record => {
    console.log(`- ${record.full_name}: ${record.status}`);
  });
}

// Example: Get Kelas 1 attendance for today
getClassAttendance('rmb2601', '2026-01-08');
```

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Data retrieved |
| 201 | Created - Attendance recorded |
| 400 | Bad Request - Missing required parameters |
| 404 | Not Found - Student not found or not enrolled |
| 405 | Method Not Allowed |
| 409 | Conflict - Already checked in |
| 500 | Internal Server Error |

## Database Schema Reference

```sql
-- Attendance table structure
CREATE TABLE attendance (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id),
  rombel_id VARCHAR(50) NOT NULL REFERENCES rombels(id),
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'sick', 'excused', 'absent')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, rombel_id, attendance_date)
);
```

## Migration from Old Schema

If migrating from the old flat schema:
- `student_class` → now derived from `rombels.class_name` via JOIN
- `check_in_time` → now `created_at`
- `date` → now `attendance_date`
- Status values updated: `hadir`→`present`, `terlambat`→(removed, use notes), `izin`→`excused`, `sakit`→`sick`, `alpha`→`absent`

---

**Next Steps:**
1. Integrate QR scanner with frontend
2. Build attendance dashboard
3. Generate attendance reports
4. Set up notifications for absences
