-- SD Plandi Database Schema (Dapodik-style)
-- Architecture: Students persist, years move, classes rotate, history never lies

-- ============================================================================
-- A. STUDENTS TABLE (Identity Only - Never Changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  nisn VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
  birth_date DATE NOT NULL,
  birth_place VARCHAR(100),
  religion VARCHAR(50) NOT NULL,
  address TEXT,
  parent_name VARCHAR(200),
  parent_phone VARCHAR(20),
  photo_url TEXT,
  qr_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_nisn ON students(nisn);
CREATE INDEX idx_students_name ON students(full_name);

-- ============================================================================
-- B. ACADEMIC YEARS (Timeline Anchor)
-- ============================================================================
CREATE TABLE IF NOT EXISTS academic_years (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE, -- "2024/2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_academic_years_active ON academic_years(is_active);

-- ============================================================================
-- C. TEACHERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(50) PRIMARY KEY,
  nip VARCHAR(30) UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL, -- teacher / admin / principal
  email VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_nip ON teachers(nip);

-- ============================================================================
-- D. ROMBELS (Class Groups - Defines Reality: Grade, Class, Year, Wali)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rombels (
  id VARCHAR(50) PRIMARY KEY,
  academic_year_id VARCHAR(50) NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  class_name VARCHAR(10) NOT NULL, -- A, B, C
  wali_teacher_id VARCHAR(50) REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(academic_year_id, grade_level, class_name)
);

CREATE INDEX idx_rombels_year ON rombels(academic_year_id);
CREATE INDEX idx_rombels_grade ON rombels(grade_level);
CREATE INDEX idx_rombels_wali ON rombels(wali_teacher_id);

-- ============================================================================
-- E. ROMBEL MEMBERSHIPS (Core Table - Enables Promotion/Retention/Transfer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rombel_memberships (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rombel_id VARCHAR(50) NOT NULL REFERENCES rombels(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active / transferred / dropped
  entry_date DATE NOT NULL,
  exit_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('active', 'transferred', 'dropped', 'completed'))
);

CREATE INDEX idx_memberships_student ON rombel_memberships(student_id);
CREATE INDEX idx_memberships_rombel ON rombel_memberships(rombel_id);
CREATE INDEX idx_memberships_status ON rombel_memberships(status);

-- ============================================================================
-- F. SUBJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 6),
  subject_group VARCHAR(10), -- A, B, C (Kelompok)
  subject_type VARCHAR(20) NOT NULL DEFAULT 'intrakurikuler', -- intrakurikuler / ekstrakurikuler
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (subject_type IN ('intrakurikuler', 'ekstrakurikuler'))
);

CREATE INDEX idx_subjects_grade ON subjects(grade_level);
CREATE INDEX idx_subjects_active ON subjects(is_active);
CREATE INDEX idx_subjects_type ON subjects(subject_type);

-- ============================================================================
-- G. ATTENDANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rombel_id VARCHAR(50) NOT NULL REFERENCES rombels(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- present / sick / excused / absent
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('present', 'sick', 'excused', 'absent')),
  UNIQUE(student_id, rombel_id, attendance_date)
);

CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_rombel ON attendance(rombel_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ============================================================================
-- H. TRANSFERS (Optional but Realistic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transfers (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_school VARCHAR(200),
  to_school VARCHAR(200),
  transfer_date DATE NOT NULL,
  transfer_type VARCHAR(20), -- incoming / outgoing
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (transfer_type IN ('incoming', 'outgoing'))
);

CREATE INDEX idx_transfers_student ON transfers(student_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);

-- ============================================================================
-- K. LEAVE REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rombel_id VARCHAR(50) NOT NULL REFERENCES rombels(id) ON DELETE CASCADE,
  leave_type VARCHAR(20) NOT NULL, -- sick / excused / other
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  parent_name VARCHAR(200),
  parent_contact VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending / approved / rejected
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(50) REFERENCES teachers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (leave_type IN ('sick', 'excused', 'other')),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_leave_student ON leave_requests(student_id);
CREATE INDEX idx_leave_rombel ON leave_requests(rombel_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);

-- ============================================================================
-- J. USERS (Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin / teacher / parent
  teacher_id VARCHAR(50) REFERENCES teachers(id),
  student_id VARCHAR(50) REFERENCES students(id), -- for parent accounts
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- K. SESSIONS (For Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ============================================================================
-- VIEWS (Derived Data - Not Stored)
-- ============================================================================

-- Current Active Students by Rombel
CREATE OR REPLACE VIEW v_current_students AS
SELECT
  s.id,
  s.nisn,
  s.full_name,
  s.gender,
  r.grade_level,
  r.class_name,
  ay.name as academic_year,
  rm.status,
  t.full_name as wali_teacher
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
JOIN academic_years ay ON r.academic_year_id = ay.id
LEFT JOIN teachers t ON r.wali_teacher_id = t.id
WHERE rm.status = 'active' AND ay.is_active = true;

-- Student Promotion Status
CREATE OR REPLACE VIEW v_student_progression AS
SELECT
  s.id as student_id,
  s.full_name,
  ay.name as academic_year,
  r.grade_level,
  r.class_name,
  LAG(r.grade_level) OVER (PARTITION BY s.id ORDER BY ay.start_date) as previous_grade,
  CASE
    WHEN r.grade_level > LAG(r.grade_level) OVER (PARTITION BY s.id ORDER BY ay.start_date) THEN 'promoted'
    WHEN r.grade_level = LAG(r.grade_level) OVER (PARTITION BY s.id ORDER BY ay.start_date) THEN 'retained'
    ELSE 'new'
  END as status
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
JOIN academic_years ay ON r.academic_year_id = ay.id
WHERE rm.status IN ('active', 'completed');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON rombel_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
