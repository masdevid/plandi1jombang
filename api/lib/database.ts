import { sql } from './db-config.js';
import { Student, AttendanceRecord, LeaveRequest, IntrakurikulerSubject, IntrakurikulerAssignment, ExtrakurikulerActivity, ExtrakurikulerAssignment } from './types.js';
import crypto from 'node:crypto';

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Students table
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        nis TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        class TEXT NOT NULL,
        gender TEXT,
        date_of_birth TEXT,
        religion TEXT,
        photo TEXT,
        qr_code TEXT UNIQUE NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Teachers and Staff table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nip TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'staff')),
        is_wali_kelas INTEGER NOT NULL DEFAULT 0,
        assigned_class TEXT,
        phone TEXT,
        photo TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Sessions table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Attendance records table
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_nis TEXT NOT NULL,
        student_class TEXT NOT NULL,
        check_in_time TIMESTAMPTZ NOT NULL,
        check_out_time TIMESTAMPTZ,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('hadir', 'terlambat', 'izin', 'sakit', 'alpha')),
        scanned_by TEXT,
        scanner_name TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (scanned_by) REFERENCES users(id)
      )
    `;

    // Leave requests table
    await sql`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_nis TEXT NOT NULL,
        student_class TEXT NOT NULL,
        leave_type TEXT NOT NULL CHECK(leave_type IN ('izin', 'sakit')),
        reason TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        submitted_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
        parent_name TEXT,
        parent_contact TEXT,
        attachment_url TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `;

    // Intrakurikuler subjects table
    await sql`
      CREATE TABLE IF NOT EXISTS intrakurikuler_subjects (
        id TEXT PRIMARY KEY,
        kode_mapel TEXT UNIQUE NOT NULL,
        nama_mapel TEXT NOT NULL,
        kelompok TEXT,
        deskripsi TEXT,
        aktif INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Intrakurikuler class assignments table
    await sql`
      CREATE TABLE IF NOT EXISTS intrakurikuler_class_assignments (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        class_name TEXT NOT NULL,
        teacher_id TEXT,
        teacher_name TEXT,
        jam_mulai TEXT,
        jam_selesai TEXT,
        hari TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (subject_id) REFERENCES intrakurikuler_subjects(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `;

    // Extrakurikuler activities table
    await sql`
      CREATE TABLE IF NOT EXISTS extrakurikuler_activities (
        id TEXT PRIMARY KEY,
        kode_ekskul TEXT UNIQUE NOT NULL,
        nama_ekskul TEXT NOT NULL,
        deskripsi TEXT,
        pembina TEXT,
        aktif INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Extrakurikuler members table
    await sql`
      CREATE TABLE IF NOT EXISTS extrakurikuler_members (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_nis TEXT NOT NULL,
        student_class TEXT NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('aktif', 'non-aktif', 'keluar')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (activity_id) REFERENCES extrakurikuler_activities(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `;

    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(student_class)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_qrcode ON students(qr_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_class ON students(class)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_nip ON users(nip)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_intrakurikuler_subjects_kode ON intrakurikuler_subjects(kode_mapel)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_intrakurikuler_assignments_class ON intrakurikuler_class_assignments(class_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_intrakurikuler_assignments_subject ON intrakurikuler_class_assignments(subject_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_intrakurikuler_assignments_teacher ON intrakurikuler_class_assignments(teacher_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_extrakurikuler_activities_kode ON extrakurikuler_activities(kode_ekskul)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_extrakurikuler_members_activity ON extrakurikuler_members(activity_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_extrakurikuler_members_student ON extrakurikuler_members(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_extrakurikuler_members_class ON extrakurikuler_members(student_class)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Hash password using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Seed database with initial data if empty
export async function seedDatabase() {
  try {
    const studentResult = await sql`SELECT COUNT(*) as count FROM students`;
    const studentCount = studentResult.rows[0].count;

    if (Number(studentCount) === 0) {
      console.log('Seeding database with students from Excel file...');

      // Import students data from parsed Excel file
      const studentsModule = await import('./students-data.json', { with: { type: 'json' } });
      const studentsData = studentsModule.default;

      for (const student of studentsData) {
        await sql`
          INSERT INTO students (id, nis, name, class, gender, date_of_birth, religion, qr_code, active, created_at)
          VALUES (${student.id}, ${student.nis}, ${student.name}, ${student.class}, ${student.gender || null}, ${student.dateOfBirth || null}, ${student.religion || null}, ${student.qrCode}, ${student.active}, ${student.createdAt})
        `;
      }

      console.log('Database seeded with', studentsData.length, 'students from Excel file');
    }

    // Seed users (teachers, staff, admin)
    const userResult = await sql`SELECT COUNT(*) as count FROM users`;
    const userCount = userResult.rows[0].count;

    if (Number(userCount) === 0) {
      console.log('Seeding database with users...');

      const users = [
        {
          id: 'usr001',
          nip: '197001011995121001',
          name: 'Budi Hartono, S.Pd',
          email: 'admin@sdnplandi1jombang.sch.id',
          password: 'admin123', // Will be hashed
          role: 'admin',
          isWaliKelas: 0,
          assignedClass: null,
          phone: '081234567890'
        },
        {
          id: 'usr002',
          nip: '197505152000122001',
          name: 'Siti Aminah, S.Pd',
          email: 'siti.aminah@sdnplandi1jombang.sch.id',
          password: 'wali123',
          role: 'teacher',
          isWaliKelas: 1,
          assignedClass: 'K1',
          phone: '081234567891'
        },
        {
          id: 'usr003',
          nip: '198003202005011002',
          name: 'Ahmad Fauzi, S.Pd',
          email: 'ahmad.fauzi@sdnplandi1jombang.sch.id',
          password: 'wali123',
          role: 'teacher',
          isWaliKelas: 1,
          assignedClass: 'K2',
          phone: '081234567892'
        },
        {
          id: 'usr004',
          nip: '198209122006042001',
          name: 'Nur Hidayah, S.Pd',
          email: 'nur.hidayah@sdnplandi1jombang.sch.id',
          password: 'wali123',
          role: 'teacher',
          isWaliKelas: 1,
          assignedClass: 'K3',
          phone: '081234567893'
        },
        {
          id: 'usr005',
          nip: '198512302009121003',
          name: 'Eko Prasetyo, S.Pd',
          email: 'eko.prasetyo@sdnplandi1jombang.sch.id',
          password: 'wali123',
          role: 'teacher',
          isWaliKelas: 1,
          assignedClass: 'K4',
          phone: '081234567894'
        },
        {
          id: 'usr006',
          nip: '199001152014022001',
          name: 'Rina Kartika, S.Pd',
          email: 'rina.kartika@sdnplandi1jombang.sch.id',
          password: 'wali123',
          role: 'teacher',
          isWaliKelas: 1,
          assignedClass: 'K5',
          phone: '081234567895'
        },
        {
          id: 'usr007',
          nip: '199205102015031004',
          name: 'Doni Prasetya, S.Pd',
          email: 'doni.prasetya@sdnplandi1jombang.sch.id',
          password: 'wali123',
          role: 'teacher',
          isWaliKelas: 1,
          assignedClass: 'K6',
          phone: '081234567896'
        },
        {
          id: 'usr008',
          nip: '198707152010122002',
          name: 'Dewi Lestari, S.Pd',
          email: 'dewi.lestari@sdnplandi1jombang.sch.id',
          password: 'teacher123',
          role: 'teacher',
          isWaliKelas: 0,
          assignedClass: null,
          phone: '081234567897'
        },
        {
          id: 'usr009',
          nip: '199103252016011001',
          name: 'Agus Santoso',
          email: 'agus.santoso@sdnplandi1jombang.sch.id',
          password: 'staff123',
          role: 'staff',
          isWaliKelas: 0,
          assignedClass: null,
          phone: '081234567898'
        }
      ];

      for (const user of users) {
        const passwordHash = hashPassword(user.password);
        await sql`
          INSERT INTO users (id, nip, name, email, password_hash, role, is_wali_kelas, assigned_class, phone, active, created_at)
          VALUES (${user.id}, ${user.nip}, ${user.name}, ${user.email}, ${passwordHash}, ${user.role}, ${user.isWaliKelas}, ${user.assignedClass}, ${user.phone}, 1, NOW())
        `;
      }

      console.log('Database seeded with', users.length, 'users');
    }

    // Seed intrakurikuler subjects
    const subjectResult = await sql`SELECT COUNT(*) as count FROM intrakurikuler_subjects`;
    const subjectCount = subjectResult.rows[0].count;

    if (Number(subjectCount) === 0) {
      console.log('Seeding database with intrakurikuler subjects...');

      const subjects = [
        { id: 'map001', kodeMapel: 'PAI', namaMapel: 'Pendidikan Agama dan Budi Pekerti', kelompok: 'A', deskripsi: 'Mata pelajaran agama dan budi pekerti' },
        { id: 'map002', kodeMapel: 'PPKN', namaMapel: 'Pendidikan Pancasila', kelompok: 'A', deskripsi: 'Mata pelajaran pendidikan Pancasila dan kewarganegaraan' },
        { id: 'map003', kodeMapel: 'BIND', namaMapel: 'Bahasa Indonesia', kelompok: 'A', deskripsi: 'Mata pelajaran Bahasa Indonesia' },
        { id: 'map004', kodeMapel: 'MTK', namaMapel: 'Matematika', kelompok: 'A', deskripsi: 'Mata pelajaran Matematika' },
        { id: 'map005', kodeMapel: 'IPA', namaMapel: 'Ilmu Pengetahuan Alam', kelompok: 'A', deskripsi: 'Mata pelajaran Ilmu Pengetahuan Alam' },
        { id: 'map006', kodeMapel: 'IPS', namaMapel: 'Ilmu Pengetahuan Sosial', kelompok: 'A', deskripsi: 'Mata pelajaran Ilmu Pengetahuan Sosial' },
        { id: 'map007', kodeMapel: 'PJOK', namaMapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kelompok: 'B', deskripsi: 'Mata pelajaran pendidikan jasmani dan olahraga' },
        { id: 'map008', kodeMapel: 'SRP', namaMapel: 'Seni Rupa', kelompok: 'B', deskripsi: 'Mata pelajaran seni rupa dan budaya' },
        { id: 'map009', kodeMapel: 'BING', namaMapel: 'Bahasa Inggris', kelompok: 'A', deskripsi: 'Mata pelajaran Bahasa Inggris' },
        { id: 'map010', kodeMapel: 'JAWA', namaMapel: 'Bahasa Jawa', kelompok: 'B', deskripsi: 'Mata pelajaran Bahasa Jawa' },
        { id: 'map011', kodeMapel: 'MULOK_AGAMA', namaMapel: 'Mulok Keagamaan', kelompok: 'C', deskripsi: 'Mata pelajaran muatan lokal keagamaan' },
        { id: 'map012', kodeMapel: 'DINIYAH', namaMapel: 'Pendidikan Diniyah', kelompok: 'C', deskripsi: 'Mata pelajaran Pendidikan Diniyah' }
      ];

      for (const subject of subjects) {
        await sql`
          INSERT INTO intrakurikuler_subjects (id, kode_mapel, nama_mapel, kelompok, deskripsi, aktif, created_at)
          VALUES (${subject.id}, ${subject.kodeMapel}, ${subject.namaMapel}, ${subject.kelompok}, ${subject.deskripsi}, 1, NOW())
        `;
      }

      console.log('Database seeded with', subjects.length, 'intrakurikuler subjects');
    }

    // Seed extrakurikuler activities
    const ekskulResult = await sql`SELECT COUNT(*) as count FROM extrakurikuler_activities`;
    const ekskulCount = ekskulResult.rows[0].count;

    if (Number(ekskulCount) === 0) {
      console.log('Seeding database with extrakurikuler activities...');

      const activities = [
        { id: 'eks001', kodeEkskul: 'PRAMUKA', namaEkskul: 'Pramuka', deskripsi: 'Kegiatan kepramukaan untuk pembentuk karakter', pembina: 'Pembina Pramuka' },
        { id: 'eks002', kodeEkskul: 'TARI', namaEkskul: 'Tari', deskripsi: 'Kegiatan seni tari tradisional dan modern', pembina: 'Pembina Tari' },
        { id: 'eks003', kodeEkskul: 'BANJARI', namaEkskul: 'Banjari', deskripsi: 'Kegiatan seni musik banjari', pembina: 'Pembina Banjari' },
        { id: 'eks004', kodeEkskul: 'VOLLY', namaEkskul: 'Volly', deskripsi: 'Kegiatan olahraga voli', pembina: 'Pembina Volly' }
      ];

      for (const activity of activities) {
        await sql`
          INSERT INTO extrakurikuler_activities (id, kode_ekskul, nama_ekskul, deskripsi, pembina, aktif, created_at)
          VALUES (${activity.id}, ${activity.kodeEkskul}, ${activity.namaEkskul}, ${activity.deskripsi}, ${activity.pembina}, 1, NOW())
        `;
      }

      console.log('Database seeded with', activities.length, 'extrakurikuler activities');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Helper function to map database row to Student object
function mapRowToStudent(row: any): Student {
  return {
    id: row.id,
    nis: row.nis,
    name: row.name,
    class: row.class,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    religion: row.religion,
    photo: row.photo,
    qrCode: row.qr_code,
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

// Helper function to map database row to AttendanceRecord object
function mapRowToAttendance(row: any): AttendanceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentNis: row.student_nis,
    studentClass: row.student_class,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    date: row.date,
    status: row.status,
    scannedBy: row.scanned_by,
    scannerName: row.scanner_name,
    notes: row.notes
  };
}

// Helper function to map database row to LeaveRequest object
function mapRowToLeaveRequest(row: any): LeaveRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentNis: row.student_nis,
    studentClass: row.student_class,
    leaveType: row.leave_type,
    reason: row.reason,
    startDate: row.start_date,
    endDate: row.end_date,
    submittedAt: row.submitted_at,
    status: row.status,
    parentName: row.parent_name,
    parentContact: row.parent_contact,
    attachmentUrl: row.attachment_url
  };
}

// Helper function to map database row to User object
function mapRowToUser(row: any): any {
  return {
    id: row.id,
    nip: row.nip || null,
    full_name: row.full_name || row.name || null,  // Support both old and new schema
    email: row.email || row.username,  // Support both old and new schema
    role: row.role,
    isWaliKelas: row.assigned_class ? true : false,  // Determined by having assigned_class
    assigned_class: row.assigned_class || null,
    phone: row.phone || null,
    photo: row.photo || null,
    active: Boolean(row.is_active ?? row.active),  // Support both field names
    createdAt: row.created_at
  };
}

// Helper function to map database row to IntrakurikulerSubject object
function mapRowToIntrakurikulerSubject(row: any): IntrakurikulerSubject {
  return {
    id: row.id,
    kodeMapel: row.kode_mapel,
    namaMapel: row.nama_mapel,
    kelompok: row.kelompok,
    deskripsi: row.deskripsi,
    aktif: Boolean(row.aktif),
    createdAt: row.created_at
  };
}

// Helper function to map database row to IntrakurikulerAssignment object
function mapRowToIntrakurikulerAssignment(row: any): IntrakurikulerAssignment {
  return {
    id: row.id,
    subject: {
      id: row.subject_id,
      kodeMapel: row.kode_mapel,
      namaMapel: row.nama_mapel,
      kelompok: row.kelompok,
      deskripsi: row.deskripsi,
      aktif: Boolean(row.aktif),
      createdAt: row.created_at
    },
    className: row.class_name,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    jamMulai: row.jam_mulai,
    jamSelesai: row.jam_selesai,
    hari: row.hari
  };
}

// Helper function to map database row to ExtrakurikulerActivity object
function mapRowToExtrakurikulerActivity(row: any): ExtrakurikulerActivity {
  return {
    id: row.id,
    kodeEkskul: row.kode_ekskul,
    namaEkskul: row.nama_ekskul,
    deskripsi: row.deskripsi,
    pembina: row.pembina,
    aktif: Boolean(row.aktif),
    createdAt: row.created_at
  };
}

// Helper function to map database row to ExtrakurikulerAssignment object
function mapRowToExtrakurikulerAssignment(row: any): ExtrakurikulerAssignment {
  return {
    id: row.id,
    activity: {
      id: row.id,
      kodeEkskul: row.kode_ekskul,
      namaEkskul: row.nama_ekskul,
      deskripsi: row.deskripsi,
      pembina: row.pembina,
      aktif: Boolean(row.activity_aktif || row.aktif),
      createdAt: row.activity_created_at || row.created_at
    },
    studentId: row.student_id,
    studentName: row.student_name,
    studentNis: row.student_nis,
    studentClass: row.student_class,
    joinedAt: row.joined_at,
    status: row.status
  };
}

// Export sql client, hashPassword function, and helper functions for use in API endpoints
export { sql, hashPassword };
export { mapRowToStudent, mapRowToAttendance, mapRowToLeaveRequest, mapRowToUser, mapRowToIntrakurikulerSubject, mapRowToIntrakurikulerAssignment, mapRowToExtrakurikulerActivity, mapRowToExtrakurikulerAssignment };
