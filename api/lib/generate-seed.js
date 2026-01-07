#!/usr/bin/env node
/**
 * Generate seed.sql from students-data.json
 * Academic Year: 2026/2027
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const studentsData = JSON.parse(
  fs.readFileSync(join(__dirname, 'students-data.json'), 'utf8')
);

// SQL escape helper
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

const escapeDate = (dateStr) => {
  if (!dateStr) return 'NULL';
  return `'${dateStr}'`;
};

// Generate SQL
let sql = `-- Seed Data for SD Plandi Database
-- Generated from students-data.json
-- Current Academic Year: 2026/2027
-- Cohort-based: Each grade links to their entry year

-- ============================================================================
-- 1. ACADEMIC YEARS (Cohort Entry Years Only)
-- ============================================================================
-- Each year represents when a cohort entered Grade 1
-- Only includes years for currently active students + current year
INSERT INTO academic_years (id, name, start_date, end_date, is_active) VALUES
-- Grade 6 cohort - entered Grade 1 in 2020/2021
('ay2020', '2020/2021', '2020-07-15', '2021-06-30', false),
-- Grade 5 cohort - entered Grade 1 in 2021/2022
('ay2021', '2021/2022', '2021-07-15', '2022-06-30', false),
-- Grade 4 cohort - entered Grade 1 in 2022/2023
('ay2022', '2022/2023', '2022-07-15', '2023-06-30', false),
-- Grade 3 cohort - entered Grade 1 in 2023/2024
('ay2023', '2023/2024', '2023-07-15', '2024-06-30', false),
-- Grade 2 cohort - entered Grade 1 in 2024/2025
('ay2024', '2024/2025', '2024-07-15', '2025-06-30', false),
-- Grade 1 cohort - entered Grade 1 in 2025/2026
('ay2025', '2025/2026', '2025-07-15', '2026-06-30', false),
-- Current active academic year (for reference only)
('ay2026', '2026/2027', '2026-07-15', '2027-06-30', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. TEACHERS
-- ============================================================================
INSERT INTO teachers (id, nip, full_name, role, email, phone) VALUES
('tch001', '197805152008012001', 'Dra. Siti Aminah, M.Pd', 'principal', 'siti.aminah@sdplandi.sch.id', '081234567001'),
('tch002', '198206102009012002', 'Ahmad Yusuf, S.Pd', 'teacher', 'ahmad.yusuf@sdplandi.sch.id', '081234567002'),
('tch003', '198509152010012001', 'Nur Hidayah, S.Pd.I', 'teacher', 'nur.hidayah@sdplandi.sch.id', '081234567003'),
('tch004', '199001202015012001', 'Eko Prasetyo, S.Pd', 'teacher', 'eko.prasetyo@sdplandi.sch.id', '081234567004'),
('tch005', '198703142012012001', 'Dewi Kartika, S.Pd', 'teacher', 'dewi.kartika@sdplandi.sch.id', '081234567005'),
('tch006', '199205182016011001', 'Budi Santoso, S.Pd', 'teacher', 'budi.santoso@sdplandi.sch.id', '081234567006'),
('tch007', '198812252014012002', 'Sri Wahyuni, S.Pd', 'admin', 'sri.wahyuni@sdplandi.sch.id', '081234567007')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. ROMBELS (Class Groups - Cohort Entry Years)
-- ============================================================================
-- Each rombel links to the academic year when that cohort first entered Grade 1
INSERT INTO rombels (id, academic_year_id, grade_level, class_name, wali_teacher_id) VALUES
-- Grade 1 (26 students) - Entered in 2025/2026 (currently in Grade 1 for 2026/2027)
('rmb2501', 'ay2025', 1, 'Kelas 1', 'tch002'),
-- Grade 2 (32 students) - Entered in 2024/2025 (now in Grade 2 for 2026/2027)
('rmb2402', 'ay2024', 2, 'Kelas 2', 'tch003'),
-- Grade 3 (25 students) - Entered in 2023/2024 (now in Grade 3 for 2026/2027)
('rmb2303', 'ay2023', 3, 'Kelas 3', 'tch004'),
-- Grade 4 (25 students) - Entered in 2022/2023 (now in Grade 4 for 2026/2027)
('rmb2204', 'ay2022', 4, 'Kelas 4', 'tch005'),
-- Grade 5 (22 students) - Entered in 2021/2022 (now in Grade 5 for 2026/2027)
('rmb2105', 'ay2021', 5, 'Kelas 5', 'tch006'),
-- Grade 6 (31 students) - Entered in 2020/2021 (now in Grade 6 for 2026/2027)
('rmb2006', 'ay2020', 6, 'Kelas 6', 'tch002')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. SUBJECTS (Kurikulum Merdeka) - Intrakurikuler & Ekstrakurikuler
-- ============================================================================
INSERT INTO subjects (id, code, name, grade_level, subject_group, subject_type, description, is_active) VALUES
-- INTRAKURIKULER
('subj001', 'PAI', 'Pendidikan Agama dan Budi Pekerti', NULL, 'A', 'intrakurikuler', 'Pendidikan Agama dan Budi Pekerti', true),
('subj002', 'PPKN', 'Pendidikan Pancasila', NULL, 'A', 'intrakurikuler', 'Pendidikan Pancasila', true),
('subj003', 'BIND', 'Bahasa Indonesia', NULL, 'A', 'intrakurikuler', 'Bahasa Indonesia', true),
('subj004', 'MTK', 'Matematika', NULL, 'A', 'intrakurikuler', 'Matematika', true),
('subj005', 'IPA', 'Ilmu Pengetahuan Alam', NULL, 'A', 'intrakurikuler', 'Ilmu Pengetahuan Alam', true),
('subj006', 'IPS', 'Ilmu Pengetahuan Sosial', NULL, 'A', 'intrakurikuler', 'Ilmu Pengetahuan Sosial', true),
('subj007', 'PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', NULL, 'B', 'intrakurikuler', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', true),
('subj008', 'SRP', 'Seni Rupa', NULL, 'B', 'intrakurikuler', 'Seni Rupa', true),
('subj009', 'BING', 'Bahasa Inggris', NULL, 'B', 'intrakurikuler', 'Bahasa Inggris', true),
('subj010', 'JAWA', 'Bahasa Jawa', NULL, 'B', 'intrakurikuler', 'Bahasa Jawa', true),
('subj011', 'MULOK_AGAMA', 'Mulok Keagamaan', NULL, 'C', 'intrakurikuler', 'Mulok Keagamaan', true),
('subj012', 'DINIYAH', 'Pendidikan Diniyah', NULL, 'C', 'intrakurikuler', 'Pendidikan Diniyah', true),
-- EKSTRAKURIKULER
('subj015', 'PRAMUKA', 'Pramuka', NULL, NULL, 'ekstrakurikuler', 'Kegiatan kepramukaan untuk pembentuk karakter', true),
('subj016', 'TARI', 'Tari', NULL, NULL, 'ekstrakurikuler', 'Kegiatan seni tari tradisional dan modern', true),
('subj017', 'BANJARI', 'Banjari', NULL, NULL, 'ekstrakurikuler', 'Kegiatan seni musik banjari', true),
('subj018', 'VOLLY', 'Volly', NULL, NULL, 'ekstrakurikuler', 'Kegiatan olahraga voli', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. STUDENTS (From students-data.json)
-- ============================================================================
INSERT INTO students (id, nisn, full_name, gender, birth_date, birth_place, religion, address, parent_name, parent_phone, qr_code) VALUES
`;

// Generate student inserts
const studentInserts = studentsData.map((s) => {
  const birthPlace = 'Jombang'; // Default as not in JSON
  const address = null;
  const parentName = null;
  const parentPhone = null;

  return `(${escape(s.id)}, ${escape(s.nis)}, ${escape(s.name)}, ${escape(s.gender)}, ${escapeDate(s.dateOfBirth)}, ${escape(birthPlace)}, ${escape(s.religion)}, ${address}, ${parentName}, ${parentPhone}, ${escape(s.qrCode)})`;
});

sql += studentInserts.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

// ============================================================================
// 6. ROMBEL MEMBERSHIPS
// ============================================================================
sql += `-- ============================================================================
-- 6. ROMBEL MEMBERSHIPS (Active Enrollments for 2026/2027)
-- ============================================================================
INSERT INTO rombel_memberships (id, student_id, rombel_id, status, entry_date) VALUES
`;

// Group students by class and assign to rombels (cohort-based IDs)
const rombelMapping = {
  K1: 'rmb2501', // Grade 1, entered ay2025
  K2: 'rmb2402', // Grade 2, entered ay2024
  K3: 'rmb2303', // Grade 3, entered ay2023
  K4: 'rmb2204', // Grade 4, entered ay2022
  K5: 'rmb2105', // Grade 5, entered ay2021
  K6: 'rmb2006'  // Grade 6, entered ay2020
};

const memberships = [];
let membershipId = 1;

studentsData.forEach((student) => {
  const rombelId = rombelMapping[student.class];
  if (!rombelId) return;

  memberships.push(`('mem${String(membershipId).padStart(4, '0')}', ${escape(student.id)}, ${escape(rombelId)}, 'active', '2026-07-15')`);
  membershipId++;
});

sql += memberships.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';

// ============================================================================
// 7. USERS
// ============================================================================
sql += `-- ============================================================================
-- 7. USERS (Sample Authentication Accounts)
-- ============================================================================
INSERT INTO users (id, username, password_hash, role, teacher_id, is_active) VALUES
('usr001', 'admin', '$2b$10$rKZLvXCH0y0fMjhxKzGqTONfZ5vHQJqX5qHJ9J5qKZLvXCH0y0fMj', 'admin', NULL, true),
('usr002', 'siti.aminah', '$2b$10$rKZLvXCH0y0fMjhxKzGqTONfZ5vHQJqX5qHJ9J5qKZLvXCH0y0fMj', 'principal', 'tch001', true),
('usr003', 'ahmad.yusuf', '$2b$10$rKZLvXCH0y0fMjhxKzGqTONfZ5vHQJqX5qHJ9J5qKZLvXCH0y0fMj', 'teacher', 'tch002', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VALIDATION QUERIES (To verify data integrity)
-- ============================================================================

-- Total students per rombel
SELECT
  r.grade_level,
  r.class_name,
  COUNT(rm.student_id) as total_students
FROM rombels r
LEFT JOIN rombel_memberships rm ON r.id = rm.rombel_id AND rm.status = 'active'
WHERE r.academic_year_id = 'ay2026'
GROUP BY r.grade_level, r.class_name
ORDER BY r.grade_level, r.class_name;

-- Students with their current class
SELECT
  s.nisn,
  s.full_name,
  r.grade_level,
  r.class_name,
  t.full_name as wali_teacher
FROM students s
JOIN rombel_memberships rm ON s.id = rm.student_id
JOIN rombels r ON rm.rombel_id = r.id
JOIN teachers t ON r.wali_teacher_id = t.id
WHERE rm.status = 'active'
ORDER BY r.grade_level, r.class_name, s.full_name;
`;

// Write to file
fs.writeFileSync(join(__dirname, 'seed.sql'), sql);
console.log('✅ seed.sql generated successfully!');
console.log(`   Total students: ${studentsData.length}`);
console.log(`   Academic year: 2026/2027`);
