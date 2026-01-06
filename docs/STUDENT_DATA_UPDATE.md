# Student Data Update - Excel Import

## Overview

Updated the student database schema and seed data to include real student information from the provided Excel file (`public/students.xls`).

**Date**: 2026-01-06
**Students Imported**: 161 students (from 6 classes)
**Source**: Excel file with school records (6 sheets)

## Changes Made

### 1. New Student Fields

Added three new fields to the student model:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `gender` | string (optional) | Student gender (L/P) | "L" or "P" |
| `dateOfBirth` | string (optional) | Birth date (YYYY-MM-DD) | "2018-06-08" |
| `religion` | string (optional) | Student religion | "Islam" |

### 2. Database Schema Update

**File**: [`api/lib/database.ts`](../api/lib/database.ts)

Updated `students` table schema:

```sql
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  gender TEXT,              -- NEW
  date_of_birth TEXT,       -- NEW
  religion TEXT,            -- NEW
  photo TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

### 3. TypeScript Interface Update

**File**: [`api/lib/types.ts`](../api/lib/types.ts)

Updated `Student` interface:

```typescript
export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  gender?: string;          // NEW
  dateOfBirth?: string;     // NEW
  religion?: string;        // NEW
  photo?: string;
  qrCode: string;
  active: boolean;
  createdAt: string;
}
```

### 4. Excel Parsing Script

**File**: [`scripts/parse-students.js`](../scripts/parse-students.js)

Created script to parse **all 6 sheets** in the Excel file (KELAS 1-6) and extract student data:

```bash
node scripts/parse-students.js
```

**Excel Structure**:
- 6 sheets: KELAS 1, KELAS 2, KELAS 3, KELAS 4, KELAS 5, KELAS 6
- Each sheet contains students for that specific class
- Columns: Name (col 2), Gender (col 4), NIS (col 5), Date of Birth (col 7), Religion (col 9)

**Output**: [`api/lib/students-data.json`](../api/lib/students-data.json) - 161 students

### 5. Seed Data Update

Updated `seedDatabase()` function to import from parsed Excel data instead of hardcoded data.

**Before** (7 hardcoded students):
```javascript
const students = [
  { id: 'std001', nis: '2024001', name: 'Ahmad Rizki Pratama', ... },
  // ... 6 more hardcoded students
];
```

**After** (161 real students from all 6 Excel sheets):
```javascript
const studentsModule = await import('./students-data.json', { assert: { type: 'json' } });
const studentsData = studentsModule.default;
// Imports all 161 students from KELAS 1-6
```

### 6. API Endpoints Update

**File**: [`api/students.ts`](../api/students.ts)

Updated POST and PUT endpoints to handle new fields:

**POST** - Create student:
```typescript
const { nis, name, class: className, gender, dateOfBirth, religion, qrCode, photo, active } = req.body;

await sql`
  INSERT INTO students (id, nis, name, class, gender, date_of_birth, religion, qr_code, photo, active, created_at)
  VALUES (${newId}, ${newNis}, ${name}, ${className}, ${gender || null}, ${dateOfBirth || null}, ${religion || null}, ${newQrCode}, ${photo || null}, ${active ? 1 : 0}, ${createdAt})
`;
```

**PUT** - Update student:
```typescript
const { name, class, gender, dateOfBirth, religion, photo, active } = req.body;

await sql`
  UPDATE students
  SET
    name = COALESCE(${updatedName || null}, name),
    class = COALESCE(${updatedClass || null}, class),
    gender = COALESCE(${updatedGender || null}, gender),
    date_of_birth = COALESCE(${updatedDob || null}, date_of_birth),
    religion = COALESCE(${updatedReligion || null}, religion),
    photo = COALESCE(${updatedPhoto || null}, photo),
    active = COALESCE(${updatedActive !== undefined ? (updatedActive ? 1 : 0) : null}, active),
    updated_at = NOW()
  WHERE id = ${id}
`;
```

## Student Data Statistics

### Total Students: 161

### Class Distribution

| Class | Count | Percentage |
|-------|-------|------------|
| K1 | 26 students | 16.1% |
| K2 | 32 students | 19.9% |
| K3 | 25 students | 15.5% |
| K4 | 25 students | 15.5% |
| K5 | 22 students | 13.7% |
| K6 | 31 students | 19.3% |

### Gender Distribution

| Gender | Count | Percentage |
|--------|-------|------------|
| Perempuan (P) | 85 students | 52.8% |
| Laki-laki (L) | 76 students | 47.2% |

### Religion Distribution

| Religion | Count |
|----------|-------|
| Islam | 161 students | 100% |

## Sample Student Records

```json
[
  {
    "id": "std001",
    "nis": "3182391263",
    "name": "ADELIA PUTRI RAMADHANI",
    "class": "K2",
    "gender": "P",
    "dateOfBirth": "2018-06-08",
    "religion": "Islam",
    "qrCode": "STD001-3182391263",
    "active": 1
  },
  {
    "id": "std002",
    "nis": "3186086318",
    "name": "ADIBAH SHAKILA ATMARINI",
    "class": "K3",
    "gender": "P",
    "dateOfBirth": "2018-12-28",
    "religion": "Islam",
    "qrCode": "STD002-3186086318",
    "active": 1
  }
]
```

## Excel File Structure

The Excel file (`public/students.xls`) contains **6 sheets**, one for each class:

### Sheets
1. **KELAS 1** → K1 (26 students)
2. **KELAS 2** → K2 (32 students)
3. **KELAS 3** → K3 (25 students)
4. **KELAS 4** → K4 (25 students)
5. **KELAS 5** → K5 (22 students)
6. **KELAS 6** → K6 (31 students)

### Column Mapping

| Column | Index | Field | Description |
|--------|-------|-------|-------------|
| Name | 2 | `name` | Full student name |
| Gender | 4 | `gender` | L (Laki-laki) or P (Perempuan) |
| NIS | 5 | `nis` | National Identification Number |
| Date of Birth | 7 | `dateOfBirth` | Birth date (Excel date format) |
| Religion | 9 | `religion` | Student religion |

**Class Extraction**: Class is determined by the sheet name (KELAS 1-6 → K1-K6).

## Migration Steps

### For New Deployments

1. **Automatic** - Database will be seeded with 26 real students on first deployment

### For Existing Deployments

#### Option 1: Reset Database (Recommended for Development)

```bash
# Vercel
curl -X POST https://your-app.vercel.app/api/db-init

# Docker
docker-compose -f docker-compose.production.yml exec db psql -U sd_plandi_user -d sd_plandi -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
curl -X POST http://localhost:3000/api/db-init
```

#### Option 2: Manual Migration (For Production with Existing Data)

```sql
-- Add new columns to existing table
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion TEXT;

-- Optionally delete old seed data and re-import
DELETE FROM students WHERE id IN ('std001', 'std002', 'std003', 'std004', 'std005', 'std006', 'std007');

-- New data will be seeded automatically on next deployment
```

## API Usage Examples

### Get Student with New Fields

```bash
GET /api/students?id=std001

Response:
{
  "id": "std001",
  "nis": "3182391263",
  "name": "ADELIA PUTRI RAMADHANI",
  "class": "K2",
  "gender": "P",
  "dateOfBirth": "2018-06-08",
  "religion": "Islam",
  "qrCode": "STD001-3182391263",
  "active": true,
  "createdAt": "2026-01-06T18:43:04.839Z"
}
```

### Create Student with New Fields

```bash
POST /api/students
Content-Type: application/json

{
  "nis": "3199999999",
  "name": "New Student Name",
  "class": "K1",
  "gender": "L",
  "dateOfBirth": "2019-01-15",
  "religion": "Islam",
  "qrCode": "STD027-3199999999"
}
```

### Update Student

```bash
PUT /api/students?id=std001
Content-Type: application/json

{
  "gender": "P",
  "dateOfBirth": "2018-06-08",
  "religion": "Islam"
}
```

## Backward Compatibility

All new fields are **optional** (`nullable`), ensuring backward compatibility:

- Existing students without new fields will work normally
- API endpoints will accept requests with or without new fields
- Frontend can display data conditionally based on field availability

## Testing

### Verify Build

```bash
pnpm build
# ✓ Application bundle generation complete. [2.606 seconds]
```

### Verify Data

```bash
# Check parsed data
cat api/lib/students-data.json | jq '. | length'
# Output: 161

# Check class distribution
cat api/lib/students-data.json | jq '[.[] | .class] | group_by(.) | map({class: .[0], count: length})'
# Output: K1: 26, K2: 32, K3: 25, K4: 25, K5: 22, K6: 31

# Check gender distribution
cat api/lib/students-data.json | jq '[.[] | .gender] | group_by(.) | map({gender: .[0], count: length})'
# Output: L: 76, P: 85
```

### Test API

```bash
# Get all students
curl http://localhost:3000/api/students | jq '. | length'

# Get student by NIS
curl http://localhost:3000/api/students?nis=3182391263 | jq '.gender'
```

## Files Modified

1. ✅ [`api/lib/types.ts`](../api/lib/types.ts) - Added new fields to Student interface
2. ✅ [`api/lib/database.ts`](../api/lib/database.ts) - Updated schema and seed function
3. ✅ [`api/students.ts`](../api/students.ts) - Updated POST/PUT endpoints
4. ✅ [`package.json`](../package.json) - Added `xlsx` dependency

## Files Created

1. ✅ [`scripts/parse-students.js`](../scripts/parse-students.js) - Excel parser script
2. ✅ [`api/lib/students-data.json`](../api/lib/students-data.json) - Parsed student data
3. ✅ [`docs/STUDENT_DATA_UPDATE.md`](STUDENT_DATA_UPDATE.md) - This documentation

## Dependencies Added

```json
{
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

## Next Steps

### Recommended Enhancements

1. **Student Profile Page** - Display gender, date of birth, and religion
2. **Student Filtering** - Filter by gender, age group, or religion
3. **Reports Enhancement** - Include demographic statistics
4. **QR Code Generation** - Generate QR codes with student photos
5. **Data Validation** - Add validation for date formats and gender values

---

**Status**: ✅ Complete
**Build Status**: ✅ Passing
**Students Imported**: 161 (from 6 classes)
**New Fields**: gender, dateOfBirth, religion
**Excel Sheets**: 6 (KELAS 1-6)
**Last Updated**: 2026-01-06
