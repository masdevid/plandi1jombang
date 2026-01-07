# Student Promotion Guide

## Overview

The student promotion system handles year-end transitions in the cohort-based academic year model. This guide explains how to promote students to the next academic year.

## Cohort-Based Model

Each rombel (class) in the system links to the academic year when that cohort **first entered Grade 1**:

| Grade | Current Year (2026/2027) | Cohort Entry Year | Rombel ID |
|-------|--------------------------|-------------------|-----------|
| 1 | 26 students | 2025/2026 | rmb2501 |
| 2 | 32 students | 2024/2025 | rmb2402 |
| 3 | 25 students | 2023/2024 | rmb2303 |
| 4 | 25 students | 2022/2023 | rmb2204 |
| 5 | 22 students | 2021/2022 | rmb2105 |
| 6 | 31 students | 2020/2021 | rmb2006 |

## How Promotion Works

### Step 1: Close Current Academic Year

All active `rombel_memberships` are marked as `completed` with an `exit_date`:

```sql
UPDATE rombel_memberships
SET status = 'completed', exit_date = '2027-06-30'
WHERE status = 'active'
```

###Step 2: Create New Rombels for Next Academic Year

New rombels are created for the next academic year (2027/2028):

| New Rombel ID | Grade | Academic Year | Purpose |
|---------------|-------|---------------|---------|
| rmb202701 | 1 | ay2027 | Ready for new student enrollment |
| rmb202702 | 2 | ay2027 | Grade 1 students promoted here |
| rmb202703 | 3 | ay2027 | Grade 2 students promoted here |
| rmb202704 | 4 | ay2027 | Grade 3 students promoted here |
| rmb202705 | 5 | ay2027 | Grade 4 students promoted here |
| rmb202706 | 6 | ay2027 | Grade 5 students promoted here |

### Step 3: Promote Students

- **Grades 1-5**: Students get new `active` memberships in next grade's rombel
- **Grade 6**: Students marked as graduated (`completed` status, no new membership)

### Step 4: Result

After promotion:
- Old memberships: `status = 'completed'`, `exit_date` set
- New memberships: `status = 'active'`, `entry_date` = start of new academic year
- Grade 6 students: Graduated, no active membership

## API Usage

### Endpoint

```
POST /promote-students
```

### Request Body

```json
{
  "newAcademicYearId": "ay2027",
  "promotionDate": "2027-06-30"
}
```

**Parameters:**
- `newAcademicYearId` (required): ID of the new academic year (e.g., "ay2027")
- `promotionDate` (optional): Date when promotion happens (defaults to current date)

### Response

```json
{
  "success": true,
  "message": "Students promoted to academic year 2027/2028",
  "academicYear": {
    "id": "ay2027",
    "name": "2027/2028",
    "start_date": "2027-07-15T00:00:00.000Z"
  },
  "summary": {
    "totalPromoted": 130,
    "totalGraduated": 31,
    "newRombelsCreated": 6
  },
  "details": {
    "promoted": [
      {
        "student_id": "std001",
        "nisn": "3182391263",
        "full_name": "ADELIA PUTRI RAMADHANI",
        "from_grade": 1,
        "to_grade": 2,
        "new_rombel_id": "rmb202702",
        "new_membership_id": "mem0162"
      }
      // ... more students
    ],
    "graduated": [
      {
        "student_id": "std131",
        "nisn": "0147403607",
        "full_name": "AISYAH NUR JANNAH",
        "from_grade": 6,
        "status": "graduated"
      }
      // ... more graduates
    ],
    "newRombels": [
      {
        "id": "rmb202701",
        "grade_level": 1,
        "class_name": "Kelas 1",
        "academic_year": "2027/2028",
        "note": "Ready for new student enrollment"
      }
      // ... more rombels
    ]
  }
}
```

## Prerequisites

### 1. Create Next Academic Year

Before promoting, ensure the next academic year exists:

```sql
INSERT INTO academic_years (id, name, start_date, end_date, is_active) VALUES
('ay2027', '2027/2028', '2027-07-15', '2028-06-30', false);
```

Or use the admin interface to create it.

### 2. Set Active Academic Year

After promotion is complete, update which academic year is active:

```sql
-- Deactivate old year
UPDATE academic_years SET is_active = false WHERE id = 'ay2026';

-- Activate new year
UPDATE academic_years SET is_active = true WHERE id = 'ay2027';
```

## Example Workflow

### Year-End Process (June 2027)

1. **Create new academic year** (if not exists):
   ```bash
   # Via SQL or admin interface
   INSERT INTO academic_years (id, name, start_date, end_date, is_active)
   VALUES ('ay2027', '2027/2028', '2027-07-15', '2028-06-30', false);
   ```

2. **Run promotion**:
   ```bash
   curl -X POST http://localhost:3001/promote-students \
     -H "Content-Type: application/json" \
     -d '{"newAcademicYearId":"ay2027","promotionDate":"2027-06-30"}'
   ```

3. **Switch active academic year**:
   ```sql
   UPDATE academic_years SET is_active = false WHERE id = 'ay2026';
   UPDATE academic_years SET is_active = true WHERE id = 'ay2027';
   ```

4. **Enroll new Grade 1 students**:
   - New students can now be enrolled in `rmb202701` (Grade 1, 2027/2028)

## Important Notes

### Cannot Promote Twice

The promotion endpoint prevents duplicate promotions. If you try to promote to an academic year that already has active students, you'll get an error:

```json
{
  "error": "Students already promoted to 2027/2028. Promotion can only be done once per academic year."
}
```

### Historical Records Preserved

All student progression history is preserved:
- Old memberships remain with `status = 'completed'`
- You can query student history by looking at all memberships (active + completed)

### Graduated Students

Grade 6 students who graduate:
- Have their last membership marked as `completed`
- Do not get a new active membership
- Can still be queried from the students table
- Their full history is preserved in rombel_memberships

## Querying After Promotion

### Get Currently Active Students

```sql
SELECT s.id, s.full_name, r.grade_level, r.class_name, ay.name
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
JOIN academic_years ay ON r.academic_year_id = ay.id
WHERE rm.status = 'active'
ORDER BY r.grade_level, s.full_name;
```

### Get Graduated Students

```sql
SELECT DISTINCT s.id, s.full_name, s.nisn
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
WHERE r.grade_level = 6
  AND rm.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM rombel_memberships rm2
    WHERE rm2.student_id = s.id AND rm2.status = 'active'
  )
ORDER BY s.full_name;
```

### Get Student Progression History

```sql
SELECT
  s.full_name,
  r.grade_level,
  ay.name as academic_year,
  rm.status,
  rm.entry_date,
  rm.exit_date
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
JOIN academic_years ay ON r.academic_year_id = ay.id
WHERE s.id = 'std001'
ORDER BY rm.entry_date;
```

## Troubleshooting

### Error: Academic Year Not Found

**Problem**: `Academic year ay2027 not found. Create it first.`

**Solution**: Create the academic year before promoting:
```sql
INSERT INTO academic_years (id, name, start_date, end_date, is_active)
VALUES ('ay2027', '2027/2028', '2027-07-15', '2028-06-30', false);
```

### Error: Students Already Promoted

**Problem**: `Students already promoted to 2027/2028`

**Solution**: This is intentional. Promotion can only happen once per academic year. If you need to redo the promotion:
1. Reset the database OR
2. Manually update the memberships (not recommended)

### Wrong Student Counts

**Problem**: Student counts don't match expected numbers

**Solution**: Verify active memberships:
```sql
SELECT COUNT(*) as active_students FROM rombel_memberships WHERE status = 'active';
```

## Next Steps

After successful promotion:

1. **Enroll new Grade 1 students** in the new Grade 1 rombel
2. **Update teacher assignments** if needed
3. **Generate new class lists** for teachers
4. **Set up new academic year schedule** (term dates, holidays, etc.)
5. **Archive or export** previous year's data for records

---

**Last Updated**: 2026-01-08
**API Version**: 1.0
**Schema Version**: Dapodik Cohort-Based
