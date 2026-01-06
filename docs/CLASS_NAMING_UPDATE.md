# Class Naming Convention Update

## Overview
Updated the class naming convention from "1A", "2A", "3A" format to **"K1" through "K6"** representing **"Kelas 1"** through **"Kelas 6"** (Grade 1-6).

## Changes Made

### 1. Database Schema
No schema changes required - the `class` column remains `TEXT`.

### 2. Seed Data Updated
**File:** [api/lib/database.ts](api/lib/database.ts)

**New Sample Data (7 students):**
- Student 1 & 2: **K1** (Kelas 1)
- Student 3: **K2** (Kelas 2)
- Student 4: **K3** (Kelas 3)
- Student 5: **K4** (Kelas 4)
- Student 6: **K5** (Kelas 5)
- Student 7: **K6** (Kelas 6)

### 3. Frontend Display Logic
**File:** [src/app/models/attendance.model.ts](src/app/models/attendance.model.ts)

Added utility function to convert class codes to display names:

```typescript
export function getClassDisplayName(classCode: string): string {
  const classMap: Record<string, string> = {
    'K1': 'Kelas 1',
    'K2': 'Kelas 2',
    'K3': 'Kelas 3',
    'K4': 'Kelas 4',
    'K5': 'Kelas 5',
    'K6': 'Kelas 6'
  };
  return classMap[classCode] || classCode;
}
```

### 4. Student Management Page
**Files Updated:**
- [src/app/pages/absensi/students/students.ts](src/app/pages/absensi/students/students.ts)
- [src/app/pages/absensi/students/students.html](src/app/pages/absensi/students/students.html)

**Changes:**
- Imported `getClassDisplayName` function
- Added component method to expose utility function to template
- Updated template to display full class names:
  - Student cards: Show "Kelas 1", "Kelas 2", etc. instead of "K1", "K2"
  - Class filter dropdown: Shows "Kelas 1", "Kelas 2", etc.
  - QR Code modal: Shows full class name
  - Print QR Codes: Shows full class name on printed cards

## Display Examples

### Before (Old Format)
- Database: `1A`, `2A`, `3A`
- Display: "Kelas: 1A"

### After (New Format)
- Database: `K1`, `K2`, `K3`, `K4`, `K5`, `K6`
- Display: "Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"

## Usage in Other Components

To use the class display name in any component:

```typescript
// Import the function
import { getClassDisplayName } from '../models/attendance.model';

// Use in component
export class MyComponent {
  getClassDisplayName(classCode: string): string {
    return getClassDisplayName(classCode);
  }
}
```

```html
<!-- Use in template -->
<p>{{ getClassDisplayName(student.class) }}</p>
```

## Class Code Reference

| Code | Display Name | Grade Level |
|------|-------------|-------------|
| K1   | Kelas 1     | Grade 1     |
| K2   | Kelas 2     | Grade 2     |
| K3   | Kelas 3     | Grade 3     |
| K4   | Kelas 4     | Grade 4     |
| K5   | Kelas 5     | Grade 5     |
| K6   | Kelas 6     | Grade 6     |

## API Responses

The API continues to return the class code (`K1`, `K2`, etc.) in responses. The frontend is responsible for converting these to display names using the `getClassDisplayName()` function.

**Example API Response:**
```json
{
  "id": "std001",
  "nis": "2024001",
  "name": "Ahmad Rizki Pratama",
  "class": "K1",
  "qrCode": "STD001-2024001",
  "active": true,
  "createdAt": "2024-01-15T08:00:00.000Z"
}
```

**Frontend Display:**
- Class code: `K1`
- Display: `Kelas 1`

## Migration Notes

When creating new students, use the class codes **K1** through **K6**:

```typescript
// Correct
const newStudent = {
  nis: "2024008",
  name: "Student Name",
  class: "K1",  // ✓ Correct
  qrCode: "STD008-2024008",
  active: true
};

// Incorrect (old format)
const newStudent = {
  nis: "2024008",
  name: "Student Name",
  class: "1A",  // ✗ Old format, don't use
  qrCode: "STD008-2024008",
  active: true
};
```

## Updating Existing Data

If you have existing data with old class names, you can update them:

### Using SQL (Neon Dashboard)
```sql
-- Update existing data if needed
UPDATE students SET class = 'K1' WHERE class = '1A';
UPDATE students SET class = 'K2' WHERE class = '2A';
UPDATE students SET class = 'K3' WHERE class = '3A';
-- etc.

-- Do the same for attendance table
UPDATE attendance SET student_class = 'K1' WHERE student_class = '1A';
-- etc.

-- Do the same for leave_requests table
UPDATE leave_requests SET student_class = 'K1' WHERE student_class = '1A';
-- etc.
```

### Fresh Database
For a fresh start with the new naming convention:
```bash
# This will create tables and seed with new class names
pnpm db:migrate
```

## Testing

### 1. Verify Display Names
- Navigate to `/absensi/students`
- Check that students show "Kelas 1", "Kelas 2", etc.
- Verify dropdown filter shows full class names
- Generate QR code and verify modal shows full class name
- Print QR codes and verify printed cards show full class names

### 2. Verify API Responses
```bash
# Get all students - should show K1, K2, etc. in responses
curl http://localhost:3000/api/students

# Expected: class property will be "K1", "K2", etc.
```

### 3. Verify New Student Creation
```bash
# Create student with new format
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "nis": "2024008",
    "name": "Test Student",
    "class": "K1",
    "qrCode": "STD008-2024008",
    "active": true
  }'
```

---

**Updated:** 2026-01-06
**Status:** ✅ Complete
**Build Status:** ✅ Passing
