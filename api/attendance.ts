import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, mapRowToAttendance, mapRowToStudent } from './lib/database.js';
import { AttendanceStats, AttendanceRecord } from './lib/types.js';

// Note: Database should be initialized via pnpm db:migrate before deploying
// Removing auto-initialization to prevent timeout issues on Vercel

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
          const stats = await getAttendanceStats(date as string);
          return res.status(200).json(stats);
        }

        if (date && className) {
          // Get attendance by class and date
          const result = await sql`
            SELECT * FROM attendance
            WHERE date = ${date as string} AND student_class = ${className as string}
            ORDER BY check_in_time DESC
          `;
          const records = result.rows.map(mapRowToAttendance);
          return res.status(200).json(records);
        }

        if (date) {
          // Get attendance by date
          const result = await sql`
            SELECT * FROM attendance
            WHERE date = ${date as string}
            ORDER BY check_in_time DESC
          `;
          const records = result.rows.map(mapRowToAttendance);
          return res.status(200).json(records);
        }

        if (studentId) {
          // Get attendance by student
          const result = await sql`
            SELECT * FROM attendance
            WHERE student_id = ${studentId as string}
            ORDER BY date DESC
          `;
          const records = result.rows.map(mapRowToAttendance);
          return res.status(200).json(records);
        }

        // Get all attendance records
        const allResult = await sql`
          SELECT * FROM attendance
          ORDER BY date DESC, check_in_time DESC
          LIMIT 100
        `;
        const allRecords = allResult.rows.map(mapRowToAttendance);
        return res.status(200).json(allRecords);

      case 'POST':
        const { qrCode, notes, status } = req.body;

        if (!qrCode && !studentId) {
          return res.status(400).json({ error: 'QR code or student ID is required' });
        }

        // Get student
        const studentResult = qrCode
          ? await sql`SELECT * FROM students WHERE qr_code = ${qrCode}`
          : await sql`SELECT * FROM students WHERE id = ${studentId as string}`;

        if (studentResult.rows.length === 0) {
          return res.status(404).json({ error: 'Student not found or inactive' });
        }

        const student = mapRowToStudent(studentResult.rows[0]);
        if (!student.active) {
          return res.status(404).json({ error: 'Student not found or inactive' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in today
        const existingResult = await sql`
          SELECT * FROM attendance
          WHERE student_id = ${student.id} AND date = ${today}
        `;

        if (existingResult.rows.length > 0 && !status) {
          return res.status(409).json({
            error: 'Already checked in today',
            record: mapRowToAttendance(existingResult.rows[0])
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
        const countResult = await sql`SELECT COUNT(*) as count FROM attendance`;
        const count = Number(countResult.rows[0].count);
        const newId = `att${String(count + 1).padStart(6, '0')}`;

        await sql`
          INSERT INTO attendance (id, student_id, student_name, student_nis, student_class, check_in_time, date, status, notes)
          VALUES (${newId}, ${student.id}, ${student.name}, ${student.nis}, ${student.class}, ${checkInTime}, ${today}, ${recordStatus}, ${notes || null})
        `;

        const newRecordResult = await sql`SELECT * FROM attendance WHERE id = ${newId}`;
        return res.status(201).json(mapRowToAttendance(newRecordResult.rows[0]));

      case 'PUT':
        // Update attendance record (e.g., checkout)
        const { id, checkOutTime: newCheckOutTime, status: newStatus, notes: newNotes } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Attendance ID is required' });
        }

        const recordToUpdateResult = await sql`SELECT * FROM attendance WHERE id = ${id}`;
        if (recordToUpdateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Attendance record not found' });
        }

        await sql`
          UPDATE attendance
          SET
            check_out_time = COALESCE(${newCheckOutTime || null}, check_out_time),
            status = COALESCE(${newStatus || null}, status),
            notes = COALESCE(${newNotes || null}, notes)
          WHERE id = ${id}
        `;

        const updatedRecordResult = await sql`SELECT * FROM attendance WHERE id = ${id}`;
        return res.status(200).json(mapRowToAttendance(updatedRecordResult.rows[0]));

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAttendanceStats(date: string): Promise<AttendanceStats> {
  const totalStudentsResult = await sql`SELECT COUNT(*) as count FROM students WHERE active = 1`;
  const totalStudents = Number(totalStudentsResult.rows[0].count);

  const attendanceResult = await sql`SELECT * FROM attendance WHERE date = ${date}`;
  const attendance = attendanceResult.rows.map(mapRowToAttendance);

  const stats: AttendanceStats = {
    totalStudents,
    hadir: attendance.filter((a: AttendanceRecord) => a.status === 'hadir').length,
    terlambat: attendance.filter((a: AttendanceRecord) => a.status === 'terlambat').length,
    izin: attendance.filter((a: AttendanceRecord) => a.status === 'izin').length,
    sakit: attendance.filter((a: AttendanceRecord) => a.status === 'sakit').length,
    alpha: attendance.filter((a: AttendanceRecord) => a.status === 'alpha').length,
    belumAbsen: totalStudents - attendance.length
  };

  return stats;
}
