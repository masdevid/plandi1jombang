# Database Migration Summary

## Overview
Unified database architecture using **Dapodik-style time-bound schema** with single migration script and real student data for academic year 2026/2027.

## Migration Date
**2026-01-08** - Unified and simplified

## Core Philosophy
> **Students persist. Years move. Classes rotate. History never lies.**

## Schema Architecture

### Key Tables

#### 1. **students** (Identity Only)
- No grade, no class, no year embedded
- Contains only permanent student information
- Fields: id, nisn, full_name, gender, birth_date, birth_place, religion, address, parent info, qr_code
- **Data Source**: `students-data.json` (161 real students)

#### 2. **academic_years** (Timeline Anchor)
- Defines school years (e.g., "2026/2027")
- All time-bound data references this table
- **Active Year**: 2026/2027

#### 3. **teachers**
- Teacher identity and role
- Fields: id, nip, full_name, role (teacher/admin/principal), email, phone
- 7 teachers seeded

#### 4. **rombels** (Class Groups - Defines Reality)
- Combination of: Academic Year + Grade Level + Class Name + Homeroom Teacher
- **Cohort-based**: Each rombel links to the academic year when that cohort entered Grade 1
- Example: Grade 6 students link to 2020/2021 (when they entered), now in Grade 6 for 2026/2027
- **Total**: 6 rombels (Kelas 1-6), each linked to their cohort's entry year

#### 5. **rombel_memberships** (Core Table)
- Links students to rombels
- Enables: Promotion, Retention, Transfer, Dropout, Re-entry
- Fields: student_id, rombel_id, status, entry_date, exit_date
- **Total**: 161 active memberships

#### 6. **subjects**
- Unified subject catalog for both intrakurikuler and ekstrakurikuler
- Filtered by `subject_type` column
- Supports Kurikulum Merdeka structure (Groups A, B, C)
- **Intrakurikuler**: 12 subjects (PAI, PPKN, BIND, MTK, IPA, IPS, PJOK, SRP, BING, JAWA, MULOK_AGAMA, DINIYAH)
- **Ekstrakurikuler**: 4 activities (Pramuka, Tari, Banjari, Volly)

#### 7. **attendance**
- Daily attendance tracking with QR code support
- Status: present, sick, excused, absent
- Linked to student and rombel
- **Seeded**: Empty (no sample data)

#### 8. **leave_requests**
- Parent-submitted absence requests
- Workflow: submit → approve/reject → auto-create attendance
- Status: pending, approved, rejected
- **Seeded**: Empty (no sample data)

#### 9. **transfers**
- Student transfer records (incoming/outgoing)
- Tracks school changes with dates and reasons
- **Seeded**: Empty (no sample data)

#### 10. **users** (Authentication)
- User accounts for admin, teachers, and parents
- Linked to teachers or students
- **Seeded**: 3 users (admin, principal, teacher)

## Student Distribution (2026/2027)

| Grade | Students | Class Name | Cohort Entry Year | Rombel ID |
|-------|----------|------------|-------------------|-----------|
| 1 | 26 | Kelas 1 | 2025/2026 | rmb2501 |
| 2 | 32 | Kelas 2 | 2024/2025 | rmb2402 |
| 3 | 25 | Kelas 3 | 2023/2024 | rmb2303 |
| 4 | 25 | Kelas 4 | 2022/2023 | rmb2204 |
| 5 | 22 | Kelas 5 | 2021/2022 | rmb2105 |
| 6 | 31 | Kelas 6 | 2020/2021 | rmb2006 |
| **Total** | **161** | **6 rombels** | **6 cohorts** | |

## Migration Files

### Single Source of Truth
- **Schema**: [api/lib/schema.sql](../api/lib/schema.sql)
- **Seed**: [api/lib/seed.sql](../api/lib/seed.sql) (auto-generated)
- **Generator**: [api/lib/generate-seed.js](../api/lib/generate-seed.js)
- **Data Source**: [api/lib/students-data.json](../api/lib/students-data.json)

### Removed Files
- ❌ `api/lib/schema-new.sql`
- ❌ `api/lib/seed-new.sql`

## API Changes

### Unified Endpoints
- `POST /db-migrate` - Single migration endpoint (replaces all previous migration endpoints)

### Removed v2 Endpoints
- ❌ `/v2/attendance`
- ❌ `/v2/intrakurikuler`
- ❌ `/v2/ekstrakurikuler`
- ❌ `/db-migrate-new-schema`
- ❌ `/db-migrate-columns`

### Active Endpoints
- `GET /health` - Database health check
- `ALL /students` - Student management
- `ALL /attendance` - Attendance tracking (QR scanner)
- `ALL /intrakurikuler` - Academic assessments
- `ALL /ekstrakurikuler` - Extracurricular activities

## Migration Process

### Run Migration
```bash
# Via API endpoint
curl -X POST http://localhost:3001/db-migrate

# Or regenerate seed.sql from students-data.json
cd api/lib
node generate-seed.js
```

### What Gets Created
1. ✅ 11 core database tables (students, teachers, rombels, etc.)
2. ✅ 161 students from `students-data.json`
3. ✅ Academic years 2020/2021 through 2026/2027 (cohort entry years only)
4. ✅ 7 teachers
5. ✅ 6 rombels (Kelas 1-6), each linked to their cohort's entry year
6. ✅ 161 rombel memberships (all active for 2026/2027)
7. ✅ 16 subjects (12 intrakurikuler + 4 ekstrakurikuler)
8. ✅ 3 user accounts
9. ✅ Database views (v_current_students, v_student_progression)
10. ✅ Triggers for auto-updating timestamps

### What Doesn't Get Created (By Design)
- ❌ No sample attendance records
- ❌ No sample leave requests
- ❌ No sample transfers

These should be created through normal application usage.

### Tables Removed (Not Needed Yet)
- ❌ `assessments` - Will be added when grading module is needed
- ❌ `behavior_records` - Will be added when behavior tracking is needed
- ❌ `learning_levels` - Will be added when progress tracking is needed

**Focus**: Student management, attendance, and leave requests only.

## Verification

After migration, run these queries:

```sql
-- Total students
SELECT COUNT(*) FROM students;
-- Expected: 161

-- Students per rombel
SELECT r.grade_level, r.class_name, COUNT(rm.student_id) as total
FROM rombels r
LEFT JOIN rombel_memberships rm ON r.id = rm.rombel_id
WHERE r.academic_year_id = 'ay2026' AND rm.status = 'active'
GROUP BY r.grade_level, r.class_name
ORDER BY r.grade_level, r.class_name;

-- Active academic year
SELECT * FROM academic_years WHERE is_active = true;
-- Expected: 2026/2027

-- Subject types
SELECT subject_type, COUNT(*) as total
FROM subjects
GROUP BY subject_type;
-- Expected: intrakurikuler: 12, ekstrakurikuler: 4
```

## Benefits of Unified Approach

1. **Single Migration**: One endpoint, one schema, one seed script
2. **Real Data**: 161 actual students, no fake data
3. **Current Year**: 2026/2027 as active academic year
4. **Clean Start**: No sample attendance/assessments/behavior records
5. **Maintainable**: Schema and seed generated from single source (students-data.json)
6. **Documented**: Clear separation of concerns

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ACADEMIC YEARS (Cohorts)                 │
│  2020/21  2021/22  2022/23  2023/24  2024/25  2025/26      │
│                    2026/27 (Current, Active)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ROMBELS (6 Classes, Cohort-based)               │
│  Grade 1→ay2025  Grade 2→ay2024  Grade 3→ay2023            │
│  Grade 4→ay2022  Grade 5→ay2021  Grade 6→ay2020            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         ROMBEL MEMBERSHIPS (Active Enrollment 2026/27)       │
│         Links 161 students to their cohort classes           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 STUDENTS (161 - Identity)                    │
│             Source: students-data.json                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                SUBJECTS (16 Total)                           │
│  Intrakurikuler (12)  |  Ekstrakurikuler (4)                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────┬──────────────────┬────────────────────────┐
│   ASSESSMENTS    │    ATTENDANCE    │   BEHAVIOR RECORDS     │
│   (Empty)        │    (Empty)       │     (Empty)            │
└──────────────────┴──────────────────┴────────────────────────┘
```

## Next Steps

1. ✅ Run `/db-migrate` endpoint
2. ✅ Verify student count and distribution
3. ⏭️ Start recording daily attendance
4. ⏭️ Begin academic assessments
5. ⏭️ Track extracurricular participation

---

**Last Updated:** 2026-01-08
**Author:** Claude Sonnet 4.5
**Status:** ✅ Production Ready
