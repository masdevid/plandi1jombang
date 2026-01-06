import type { VercelRequest, VercelResponse } from '@vercel/node';
import db, { initializeDatabase, seedDatabase } from './lib/database';
import { AttendanceRecord, AttendanceStats } from './lib/types';

// Initialize database on cold start
initializeDatabase();
seedDatabase();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;
    const { date, studentId, className, action } = req.query;

    switch (method) {
      case 'GET':
        if (action === 'stats' && date) {
          // Get attendance statistics for a specific date
          const stats = getAttendanceStats(date as string);
          return res.status(200).json(stats);
        }

        if (date && className) {
          // Get attendance by class and date
          const records = db.prepare(`
            SELECT * FROM attendance
            WHERE date = ? AND studentClass = ?
            ORDER BY checkInTime DESC
          `).all(date, className) as AttendanceRecord[];
          return res.status(200).json(records);
        }

        if (date) {
          // Get attendance by date
          const records = db.prepare(`
            SELECT * FROM attendance
            WHERE date = ?
            ORDER BY checkInTime DESC
          `).all(date) as AttendanceRecord[];
          return res.status(200).json(records);
        }

        if (studentId) {
          // Get attendance by student
          const records = db.prepare(`
            SELECT * FROM attendance
            WHERE studentId = ?
            ORDER BY date DESC
          `).all(studentId) as AttendanceRecord[];
          return res.status(200).json(records);
        }

        // Get all attendance records
        const allRecords = db.prepare(`
          SELECT * FROM attendance
          ORDER BY date DESC, checkInTime DESC
          LIMIT 100
        `).all() as AttendanceRecord[];
        return res.status(200).json(allRecords);

      case 'POST':
        const { qrCode, notes, status } = req.body;

        if (!qrCode && !studentId) {
          return res.status(400).json({ error: 'QR code or student ID is required' });
        }

        // Get student
        const student = qrCode
          ? db.prepare('SELECT * FROM students WHERE qrCode = ?').get(qrCode)
          : db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

        if (!student || !student.active) {
          return res.status(404).json({ error: 'Student not found or inactive' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in today
        const existingRecord = db.prepare(`
          SELECT * FROM attendance
          WHERE studentId = ? AND date = ?
        `).get(student.id, today);

        if (existingRecord && !status) {
          return res.status(409).json({
            error: 'Already checked in today',
            record: existingRecord
          });
        }

        const now = new Date();
        const checkInTime = now.toISOString();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Determine status (late if after 7:15 AM)
        const isLate = hours > 7 || (hours === 7 && minutes > 15);
        const recordStatus = status || (isLate ? 'terlambat' : 'hadir');

        // Generate ID
        const count = (db.prepare('SELECT COUNT(*) as count FROM attendance').get() as { count: number }).count;
        const newId = `att${String(count + 1).padStart(6, '0')}`;

        const insertStmt = db.prepare(`
          INSERT INTO attendance (id, studentId, studentName, studentNis, studentClass, checkInTime, date, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          newId,
          student.id,
          student.name,
          student.nis,
          student.class,
          checkInTime,
          today,
          recordStatus,
          notes || null
        );

        const newRecord = db.prepare('SELECT * FROM attendance WHERE id = ?').get(newId) as AttendanceRecord;
        return res.status(201).json(newRecord);

      case 'PUT':
        // Update attendance record (e.g., checkout)
        const { id, checkOutTime: newCheckOutTime, status: newStatus, notes: newNotes } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Attendance ID is required' });
        }

        const recordToUpdate = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
        if (!recordToUpdate) {
          return res.status(404).json({ error: 'Attendance record not found' });
        }

        const updateStmt = db.prepare(`
          UPDATE attendance
          SET checkOutTime = COALESCE(?, checkOutTime),
              status = COALESCE(?, status),
              notes = COALESCE(?, notes)
          WHERE id = ?
        `);

        updateStmt.run(newCheckOutTime || null, newStatus || null, newNotes || null, id);

        const updatedRecord = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id) as AttendanceRecord;
        return res.status(200).json(updatedRecord);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getAttendanceStats(date: string): AttendanceStats {
  const totalStudents = (db.prepare('SELECT COUNT(*) as count FROM students WHERE active = 1').get() as { count: number }).count;

  const attendance = db.prepare('SELECT * FROM attendance WHERE date = ?').all(date) as AttendanceRecord[];

  const stats: AttendanceStats = {
    totalStudents,
    hadir: attendance.filter(a => a.status === 'hadir').length,
    terlambat: attendance.filter(a => a.status === 'terlambat').length,
    izin: attendance.filter(a => a.status === 'izin').length,
    sakit: attendance.filter(a => a.status === 'sakit').length,
    alpha: attendance.filter(a => a.status === 'alpha').length,
    belumAbsen: totalStudents - attendance.length
  };

  return stats;
}
