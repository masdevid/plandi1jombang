Nice, let’s do this **properly and clean**—a **complete Dapodik-style ERD**, but **developer-friendly** (modern backend, analytics-ready, no bureaucratic noise).

# 1. Conceptual ERD (high level)

```
Student
   │
   │ 1..*
   ▼
RombelMembership
   │
   │ *..1
   ▼
Rombel ──── *..1 ──── AcademicYear
   │
   ├── * Assessment
   ├── * Attendance
   └── * BehaviorRecord

Rombel ──── 1..1 ──── Teacher (Wali Kelas)
```

Key philosophy:

* **Student never changes**
* **Everything else is time-bound**

---

# 2. Logical ERD (tables & fields)

## A. `students` (identity only)

```sql
students
- id (PK)
- nisn (UNIQUE)
- full_name
- gender
- birth_date
- birth_place
- religion
- address
- parent_name
- created_at
- updated_at
```

🔒 **Rules**

* No grade
* No class
* No year

---

## B. `academic_years`

```sql
academic_years
- id (PK)
- name            -- "2024/2025"
- start_date
- end_date
- is_active
```

📌 Used everywhere as the **timeline anchor**

---

## C. `teachers`

```sql
teachers
- id (PK)
- nip (UNIQUE)
- full_name
- role            -- teacher / admin / principal
- created_at
```

---

## D. `rombels` (class groups)

```sql
rombels
- id (PK)
- academic_year_id (FK → academic_years)
- grade_level      -- 1..6
- class_name       -- A, B, C
- wali_teacher_id (FK → teachers)
```

💡 **Rombel defines reality**:

* Grade
* Class
* Year
* Homeroom teacher

---

## E. `rombel_memberships` (core table)

```sql
rombel_memberships
- id (PK)
- student_id (FK → students)
- rombel_id (FK → rombels)
- status            -- active / transferred / dropped
- entry_date
- exit_date
```

🔥 This table enables:

* Promotion
* Retention
* Transfer
* Dropout
* Re-entry

**Retention =**

> same student → next year → rombel with same grade

---

## F. `subjects`

```sql
subjects
- id (PK)
- name
- grade_level
```

---

## G. `attendance`

```sql
attendance
- id (PK)
- student_id (FK → students)
- rombel_id (FK → rombels)
- date
- status           -- present / sick / excused / absent
```

---

## H. (Optional but realistic) `transfers`

```sql
transfers
- id (PK)
- student_id (FK → students)
- from_school
- to_school
- transfer_date
- reason
```

---

# 3. How promotion & retention are derived (important)

### Promotion logic (no stored flag)

```text
IF
  student has rombel in year N
  AND next year rombel.grade = previous grade + 1
THEN
  promoted
```

### Retention logic

```text
IF
  next year rombel.grade = previous grade
THEN
  retained
```

### Dropout

```text
IF
  no rombel_membership in next academic year
THEN
  dropout
```

Zero mutation. Pure history.

---

# 4. What NOT to store (intentional omissions)

❌ `current_grade`
❌ `is_promoted`
❌ `is_repeated`
❌ `current_class`

All of those are **derived views**, not data.

---

# 5. Extension points (this is where you win)

### A. Analytics / ML readiness

This schema supports:

* Retention prediction
* Dropout risk modeling
* Cohort survival analysis
* Teacher load optimization

No refactor needed later.

---

## TL;DR architecture mindset

> **Students persist.
> Years move.
> Classes rotate.
> History never lies.**

