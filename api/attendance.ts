import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './lib/db-config.js';

/**
 * Attendance API - Works with new Dapodik-style schema
 * Uses: students, rombels, rombel_memberships, attendance tables
 */

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
    const { date, studentId, rombelId, gradeLevel, action } = req.query;

    switch (method) {
      case 'GET':
        if (action === 'stats' && date) {
          // Get attendance statistics for a specific date
          return await getAttendanceStats(req, res, date as string);
        }

        if (action === 'by-rombel' && rombelId && date) {
          // Get attendance by rombel and date
          return await getAttendanceByRombel(req, res, rombelId as string, date as string);
        }

        if (action === 'by-grade' && gradeLevel && date) {
          // Get attendance by grade level and date
          return await getAttendanceByGrade(req, res, parseInt(gradeLevel as string), date as string);
        }

        if (action === 'by-student' && studentId) {
          // Get attendance history for a student
          return await getStudentAttendance(req, res, studentId as string);
        }

        if (date) {
          // Get all attendance for a specific date
          const result = await sql`
            SELECT
              a.id,
              a.student_id,
              s.nisn,
              s.full_name,
              a.rombel_id,
              r.grade_level,
              r.class_name,
              a.attendance_date,
              a.status,
              a.notes,
              a.created_at
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN rombels r ON a.rombel_id = r.id
            WHERE a.attendance_date = ${date as string}
            ORDER BY r.grade_level, s.full_name
          `;
          return res.status(200).json(result);
        }

        // Get recent attendance (last 100 records)
        const recentResult = await sql`
          SELECT
            a.id,
            a.student_id,
            s.nisn,
            s.full_name,
            a.rombel_id,
            r.grade_level,
            r.class_name,
            a.attendance_date,
            a.status,
            a.notes,
            a.created_at
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          JOIN rombels r ON a.rombel_id = r.id
          ORDER BY a.attendance_date DESC, a.created_at DESC
          LIMIT 100
        `;
        return res.status(200).json(recentResult);

      case 'POST':
        const { qrCode, status, notes } = req.body;

        if (!qrCode && !studentId) {
          return res.status(400).json({ error: 'QR code or student ID is required' });
        }

        // Find student and their active rombel
        const studentQuery = qrCode
          ? sql`
              SELECT
                s.id,
                s.nisn,
                s.full_name,
                s.qr_code,
                rm.rombel_id,
                r.grade_level,
                r.class_name,
                r.academic_year_id
              FROM students s
              JOIN rombel_memberships rm ON s.id = rm.student_id
              JOIN rombels r ON rm.rombel_id = r.id
              WHERE s.qr_code = ${qrCode} AND rm.status = 'active'
            `
          : sql`
              SELECT
                s.id,
                s.nisn,
                s.full_name,
                s.qr_code,
                rm.rombel_id,
                r.grade_level,
                r.class_name,
                r.academic_year_id
              FROM students s
              JOIN rombel_memberships rm ON s.id = rm.student_id
              JOIN rombels r ON rm.rombel_id = r.id
              WHERE s.id = ${studentId as string} AND rm.status = 'active'
            `;

        const studentResult = await studentQuery;

        if (studentResult.length === 0) {
          return res.status(404).json({
            error: 'Student not found or not actively enrolled'
          });
        }

        const student = studentResult[0];
        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in today for this rombel
        const existingResult = await sql`
          SELECT * FROM attendance
          WHERE student_id = ${student.id}
            AND rombel_id = ${student.rombel_id}
            AND attendance_date = ${today}
        `;

        if (existingResult.length > 0) {
          return res.status(409).json({
            error: 'Already checked in today',
            record: existingResult[0]
          });
        }

        // Determine status if not provided
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const isLate = hours > 7 || (hours === 7 && minutes > 15);

        const attendanceStatus = status || (isLate ? 'sick' : 'present');

        // Generate ID
        const countResult = await sql`SELECT COUNT(*) as count FROM attendance`;
        const count = Number(countResult[0].count);
        const newId = `att${String(count + 1).padStart(6, '0')}`;

        // Insert attendance record
        await sql`
          INSERT INTO attendance (
            id,
            student_id,
            rombel_id,
            attendance_date,
            status,
            notes
          )
          VALUES (
            ${newId},
            ${student.id},
            ${student.rombel_id},
            ${today},
            ${attendanceStatus},
            ${notes || null}
          )
        `;

        const newRecord = await sql`
          SELECT
            a.id,
            a.student_id,
            s.nisn,
            s.full_name,
            a.rombel_id,
            r.grade_level,
            r.class_name,
            a.attendance_date,
            a.status,
            a.notes,
            a.created_at
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          JOIN rombels r ON a.rombel_id = r.id
          WHERE a.id = ${newId}
        `;

        return res.status(201).json({
          success: true,
          message: 'Attendance recorded successfully',
          record: newRecord[0]
        });

      case 'PUT':
        const { id, status: updateStatus, notes: updateNotes } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Attendance ID is required' });
        }

        const recordToUpdate = await sql`
          SELECT * FROM attendance WHERE id = ${id}
        `;

        if (recordToUpdate.length === 0) {
          return res.status(404).json({ error: 'Attendance record not found' });
        }

        await sql`
          UPDATE attendance
          SET
            status = COALESCE(${updateStatus || null}, status),
            notes = COALESCE(${updateNotes || null}, notes)
          WHERE id = ${id}
        `;

        const updatedRecord = await sql`
          SELECT
            a.id,
            a.student_id,
            s.nisn,
            s.full_name,
            a.rombel_id,
            r.grade_level,
            r.class_name,
            a.attendance_date,
            a.status,
            a.notes,
            a.created_at
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          JOIN rombels r ON a.rombel_id = r.id
          WHERE a.id = ${id}
        `;

        return res.status(200).json({
          success: true,
          message: 'Attendance updated successfully',
          record: updatedRecord[0]
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Attendance API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper functions

async function getAttendanceStats(req: VercelRequest, res: VercelResponse, date: string) {
  try {
    // Get active students count
    const activeStudentsResult = await sql`
      SELECT COUNT(DISTINCT rm.student_id) as count
      FROM rombel_memberships rm
      WHERE rm.status = 'active'
    `;
    const totalStudents = Number(activeStudentsResult[0].count);

    // Get attendance counts by status
    const attendanceResult = await sql`
      SELECT status, COUNT(*) as count
      FROM attendance
      WHERE attendance_date = ${date}
      GROUP BY status
    `;

    const stats = {
      date,
      totalStudents,
      present: 0,
      sick: 0,
      excused: 0,
      absent: 0
    };

    attendanceResult.forEach((row: any) => {
      stats[row.status as keyof typeof stats] = Number(row.count);
    });

    const totalAttendance = stats.present + stats.sick + stats.excused + stats.absent;
    const notRecorded = totalStudents - totalAttendance;

    return res.status(200).json({
      ...stats,
      notRecorded,
      attendanceRate: totalStudents > 0 ? ((stats.present / totalStudents) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return res.status(500).json({ error: 'Failed to get attendance statistics' });
  }
}

async function getAttendanceByRombel(req: VercelRequest, res: VercelResponse, rombelId: string, date: string) {
  try {
    const result = await sql`
      SELECT
        a.id,
        a.student_id,
        s.nisn,
        s.full_name,
        s.gender,
        a.attendance_date,
        a.status,
        a.notes,
        a.created_at
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.rombel_id = ${rombelId} AND a.attendance_date = ${date}
      ORDER BY s.full_name
    `;
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get by rombel Error:', error);
    return res.status(500).json({ error: 'Failed to get attendance by rombel' });
  }
}

async function getAttendanceByGrade(req: VercelRequest, res: VercelResponse, gradeLevel: number, date: string) {
  try {
    const result = await sql`
      SELECT
        a.id,
        a.student_id,
        s.nisn,
        s.full_name,
        s.gender,
        r.class_name,
        a.attendance_date,
        a.status,
        a.notes,
        a.created_at
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN rombels r ON a.rombel_id = r.id
      WHERE r.grade_level = ${gradeLevel} AND a.attendance_date = ${date}
      ORDER BY r.class_name, s.full_name
    `;
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get by grade Error:', error);
    return res.status(500).json({ error: 'Failed to get attendance by grade' });
  }
}

async function getStudentAttendance(req: VercelRequest, res: VercelResponse, studentId: string) {
  try {
    const result = await sql`
      SELECT
        a.id,
        a.attendance_date,
        a.status,
        a.notes,
        r.grade_level,
        r.class_name,
        ay.name as academic_year,
        a.created_at
      FROM attendance a
      JOIN rombels r ON a.rombel_id = r.id
      JOIN academic_years ay ON r.academic_year_id = ay.id
      WHERE a.student_id = ${studentId}
      ORDER BY a.attendance_date DESC
      LIMIT 100
    `;
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get student attendance Error:', error);
    return res.status(500).json({ error: 'Failed to get student attendance' });
  }
}
