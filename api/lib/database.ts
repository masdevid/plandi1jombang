import Database from 'better-sqlite3';
import { join } from 'path';
import { Student, AttendanceRecord, LeaveRequest } from './types';

const DB_PATH = join(process.cwd(), 'data', 'attendance.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database tables
export function initializeDatabase() {
  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      nis TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      photo TEXT,
      qrCode TEXT UNIQUE NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Attendance records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      studentNis TEXT NOT NULL,
      studentClass TEXT NOT NULL,
      checkInTime TEXT NOT NULL,
      checkOutTime TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('hadir', 'terlambat', 'izin', 'sakit', 'alpha')),
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id)
    )
  `);

  // Leave requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      studentNis TEXT NOT NULL,
      studentClass TEXT NOT NULL,
      leaveType TEXT NOT NULL CHECK(leaveType IN ('izin', 'sakit')),
      reason TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      submittedAt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      parentName TEXT,
      parentContact TEXT,
      attachmentUrl TEXT,
      FOREIGN KEY (studentId) REFERENCES students(id)
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(studentId);
    CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(studentClass);
    CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(studentId);
    CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
    CREATE INDEX IF NOT EXISTS idx_students_qrcode ON students(qrCode);
  `);

  console.log('Database initialized successfully');
}

// Seed database with initial data if empty
export function seedDatabase() {
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };

  if (studentCount.count === 0) {
    console.log('Seeding database with initial data...');

    const students = [
      {
        id: 'std001',
        nis: '2024001',
        name: 'Ahmad Rizki Pratama',
        class: '1A',
        qrCode: 'STD001-2024001',
        active: 1,
        createdAt: '2024-01-15T08:00:00.000Z'
      },
      {
        id: 'std002',
        nis: '2024002',
        name: 'Siti Nurhaliza',
        class: '1A',
        qrCode: 'STD002-2024002',
        active: 1,
        createdAt: '2024-01-15T08:00:00.000Z'
      },
      {
        id: 'std003',
        nis: '2024003',
        name: 'Budi Santoso',
        class: '2A',
        qrCode: 'STD003-2024003',
        active: 1,
        createdAt: '2024-01-15T08:00:00.000Z'
      },
      {
        id: 'std004',
        nis: '2024004',
        name: 'Dewi Lestari',
        class: '2A',
        qrCode: 'STD004-2024004',
        active: 1,
        createdAt: '2024-01-15T08:00:00.000Z'
      },
      {
        id: 'std005',
        nis: '2024005',
        name: 'Eko Prasetyo',
        class: '3A',
        qrCode: 'STD005-2024005',
        active: 1,
        createdAt: '2024-01-15T08:00:00.000Z'
      }
    ];

    const insertStudent = db.prepare(`
      INSERT INTO students (id, nis, name, class, qrCode, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((students: any[]) => {
      for (const student of students) {
        insertStudent.run(
          student.id,
          student.nis,
          student.name,
          student.class,
          student.qrCode,
          student.active,
          student.createdAt
        );
      }
    });

    insertMany(students);
    console.log('Database seeded with', students.length, 'students');
  }
}

// Export database instance
export default db;
