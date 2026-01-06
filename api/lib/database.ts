import { sql } from '@vercel/postgres';
import { Student, AttendanceRecord, LeaveRequest } from './types.js';
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
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (student_id) REFERENCES students(id)
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
      console.log('Seeding database with students...');

      const students = [
        { id: 'std001', nis: '2024001', name: 'Ahmad Rizki Pratama', class: 'K1', qrCode: 'STD001-2024001', active: 1, createdAt: '2024-01-15T08:00:00.000Z' },
        { id: 'std002', nis: '2024002', name: 'Siti Nurhaliza', class: 'K1', qrCode: 'STD002-2024002', active: 1, createdAt: '2024-01-15T08:00:00.000Z' },
        { id: 'std003', nis: '2024003', name: 'Budi Santoso', class: 'K2', qrCode: 'STD003-2024003', active: 1, createdAt: '2024-01-15T08:00:00.000Z' },
        { id: 'std004', nis: '2024004', name: 'Dewi Lestari', class: 'K3', qrCode: 'STD004-2024004', active: 1, createdAt: '2024-01-15T08:00:00.000Z' },
        { id: 'std005', nis: '2024005', name: 'Eko Prasetyo', class: 'K4', qrCode: 'STD005-2024005', active: 1, createdAt: '2024-01-15T08:00:00.000Z' },
        { id: 'std006', nis: '2024006', name: 'Rina Kartika', class: 'K5', qrCode: 'STD006-2024006', active: 1, createdAt: '2024-01-15T08:00:00.000Z' },
        { id: 'std007', nis: '2024007', name: 'Doni Prasetya', class: 'K6', qrCode: 'STD007-2024007', active: 1, createdAt: '2024-01-15T08:00:00.000Z' }
      ];

      for (const student of students) {
        await sql`
          INSERT INTO students (id, nis, name, class, qr_code, active, created_at)
          VALUES (${student.id}, ${student.nis}, ${student.name}, ${student.class}, ${student.qrCode}, ${student.active}, ${student.createdAt})
        `;
      }

      console.log('Database seeded with', students.length, 'students');
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
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Helper function to map database row to Student object
export function mapRowToStudent(row: any): Student {
  return {
    id: row.id,
    nis: row.nis,
    name: row.name,
    class: row.class,
    photo: row.photo,
    qrCode: row.qr_code,
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

// Helper function to map database row to AttendanceRecord object
export function mapRowToAttendance(row: any): AttendanceRecord {
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
    notes: row.notes
  };
}

// Helper function to map database row to LeaveRequest object
export function mapRowToLeaveRequest(row: any): LeaveRequest {
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
export function mapRowToUser(row: any): any {
  return {
    id: row.id,
    nip: row.nip,
    name: row.name,
    email: row.email,
    role: row.role,
    isWaliKelas: Boolean(row.is_wali_kelas),
    assignedClass: row.assigned_class,
    phone: row.phone,
    photo: row.photo,
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

// Export sql client and hashPassword function for use in API endpoints
export { sql, hashPassword };
