import { sql } from '@vercel/postgres';
import { Student, AttendanceRecord, LeaveRequest } from './types';

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
        FOREIGN KEY (student_id) REFERENCES students(id)
      )
    `;

    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(student_class)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_qrcode ON students(qr_code)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Seed database with initial data if empty
export async function seedDatabase() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM students`;
    const studentCount = result.rows[0].count;

    if (Number(studentCount) === 0) {
      console.log('Seeding database with initial data...');

      const students = [
        {
          id: 'std001',
          nis: '2024001',
          name: 'Ahmad Rizki Pratama',
          class: 'K1',
          qrCode: 'STD001-2024001',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        {
          id: 'std002',
          nis: '2024002',
          name: 'Siti Nurhaliza',
          class: 'K1',
          qrCode: 'STD002-2024002',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        {
          id: 'std003',
          nis: '2024003',
          name: 'Budi Santoso',
          class: 'K2',
          qrCode: 'STD003-2024003',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        {
          id: 'std004',
          nis: '2024004',
          name: 'Dewi Lestari',
          class: 'K3',
          qrCode: 'STD004-2024004',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        {
          id: 'std005',
          nis: '2024005',
          name: 'Eko Prasetyo',
          class: 'K4',
          qrCode: 'STD005-2024005',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        {
          id: 'std006',
          nis: '2024006',
          name: 'Rina Kartika',
          class: 'K5',
          qrCode: 'STD006-2024006',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        },
        {
          id: 'std007',
          nis: '2024007',
          name: 'Doni Prasetya',
          class: 'K6',
          qrCode: 'STD007-2024007',
          active: 1,
          createdAt: '2024-01-15T08:00:00.000Z'
        }
      ];

      for (const student of students) {
        await sql`
          INSERT INTO students (id, nis, name, class, qr_code, active, created_at)
          VALUES (${student.id}, ${student.nis}, ${student.name}, ${student.class}, ${student.qrCode}, ${student.active}, ${student.createdAt})
        `;
      }

      console.log('Database seeded with', students.length, 'students');
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

// Export sql client for direct queries
export { sql };
