import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './lib/db-config.js';

/**
 * Leave Requests API - Works with new Dapodik-style schema
 * Uses: students, rombels, rombel_memberships, leave_requests, attendance tables
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;
    const { studentId, status, rombelId, action } = req.query;

    switch (method) {
      case 'GET':
        if (action === 'pending') {
          // Get all pending leave requests
          return await getPendingLeaveRequests(req, res);
        }

        if (studentId) {
          // Get leave requests by student ID
          const result = await sql`
            SELECT
              lr.id,
              lr.student_id,
              s.nisn,
              s.full_name,
              lr.rombel_id,
              r.grade_level,
              r.class_name,
              lr.leave_type,
              lr.reason,
              lr.start_date,
              lr.end_date,
              lr.parent_name,
              lr.parent_contact,
              lr.status,
              lr.submitted_at,
              lr.reviewed_at,
              lr.reviewed_by,
              t.full_name as reviewed_by_name
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN rombels r ON lr.rombel_id = r.id
            LEFT JOIN teachers t ON lr.reviewed_by = t.id
            WHERE lr.student_id = ${studentId as string}
            ORDER BY lr.submitted_at DESC
          `;
          return res.status(200).json(result);
        }

        if (status) {
          // Get leave requests by status
          const result = await sql`
            SELECT
              lr.id,
              lr.student_id,
              s.nisn,
              s.full_name,
              lr.rombel_id,
              r.grade_level,
              r.class_name,
              lr.leave_type,
              lr.reason,
              lr.start_date,
              lr.end_date,
              lr.parent_name,
              lr.parent_contact,
              lr.status,
              lr.submitted_at,
              lr.reviewed_at,
              lr.reviewed_by,
              t.full_name as reviewed_by_name
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN rombels r ON lr.rombel_id = r.id
            LEFT JOIN teachers t ON lr.reviewed_by = t.id
            WHERE lr.status = ${status as string}
            ORDER BY lr.submitted_at DESC
          `;
          return res.status(200).json(result);
        }

        if (rombelId) {
          // Get leave requests by rombel
          const result = await sql`
            SELECT
              lr.id,
              lr.student_id,
              s.nisn,
              s.full_name,
              lr.rombel_id,
              r.grade_level,
              r.class_name,
              lr.leave_type,
              lr.reason,
              lr.start_date,
              lr.end_date,
              lr.parent_name,
              lr.parent_contact,
              lr.status,
              lr.submitted_at,
              lr.reviewed_at,
              lr.reviewed_by,
              t.full_name as reviewed_by_name
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN rombels r ON lr.rombel_id = r.id
            LEFT JOIN teachers t ON lr.reviewed_by = t.id
            WHERE lr.rombel_id = ${rombelId as string}
            ORDER BY lr.submitted_at DESC
          `;
          return res.status(200).json(result);
        }

        // Get all leave requests (last 100)
        const allResult = await sql`
          SELECT
            lr.id,
            lr.student_id,
            s.nisn,
            s.full_name,
            lr.rombel_id,
            r.grade_level,
            r.class_name,
            lr.leave_type,
            lr.reason,
            lr.start_date,
            lr.end_date,
            lr.parent_name,
            lr.parent_contact,
            lr.status,
            lr.submitted_at,
            lr.reviewed_at,
            lr.reviewed_by,
            t.full_name as reviewed_by_name
          FROM leave_requests lr
          JOIN students s ON lr.student_id = s.id
          JOIN rombels r ON lr.rombel_id = r.id
          LEFT JOIN teachers t ON lr.reviewed_by = t.id
          ORDER BY lr.submitted_at DESC
          LIMIT 100
        `;
        return res.status(200).json(allResult);

      case 'POST':
        // Submit new leave request
        const {
          studentId: reqStudentId,
          leaveType,
          reason,
          startDate,
          endDate,
          parentName,
          parentContact
        } = req.body;

        if (!reqStudentId || !leaveType || !reason || !startDate || !endDate) {
          return res.status(400).json({
            error: 'Missing required fields: studentId, leaveType, reason, startDate, endDate'
          });
        }

        // Validate leave type
        if (!['sick', 'excused', 'other'].includes(leaveType)) {
          return res.status(400).json({
            error: 'Invalid leave type. Must be: sick, excused, or other'
          });
        }

        // Validate dates
        if (new Date(endDate) < new Date(startDate)) {
          return res.status(400).json({ error: 'End date must be after or equal to start date' });
        }

        // Get student and their active rombel
        const studentResult = await sql`
          SELECT
            s.id,
            s.nisn,
            s.full_name,
            rm.rombel_id,
            r.grade_level,
            r.class_name,
            r.academic_year_id
          FROM students s
          JOIN rombel_memberships rm ON s.id = rm.student_id
          JOIN rombels r ON rm.rombel_id = r.id
          WHERE s.id = ${reqStudentId} AND rm.status = 'active'
        `;

        if (studentResult.length === 0) {
          return res.status(404).json({
            error: 'Student not found or not actively enrolled'
          });
        }

        const student = studentResult[0];

        // Generate ID
        const countResult = await sql`SELECT COUNT(*) as count FROM leave_requests`;
        const count = Number(countResult[0].count);
        const newId = `lr${String(count + 1).padStart(6, '0')}`;

        // Insert leave request
        await sql`
          INSERT INTO leave_requests (
            id,
            student_id,
            rombel_id,
            leave_type,
            reason,
            start_date,
            end_date,
            parent_name,
            parent_contact,
            status
          )
          VALUES (
            ${newId},
            ${student.id},
            ${student.rombel_id},
            ${leaveType},
            ${reason},
            ${startDate},
            ${endDate},
            ${parentName || null},
            ${parentContact || null},
            'pending'
          )
        `;

        // Get the created leave request
        const newRequest = await sql`
          SELECT
            lr.id,
            lr.student_id,
            s.nisn,
            s.full_name,
            lr.rombel_id,
            r.grade_level,
            r.class_name,
            lr.leave_type,
            lr.reason,
            lr.start_date,
            lr.end_date,
            lr.parent_name,
            lr.parent_contact,
            lr.status,
            lr.submitted_at,
            lr.reviewed_at,
            lr.reviewed_by
          FROM leave_requests lr
          JOIN students s ON lr.student_id = s.id
          JOIN rombels r ON lr.rombel_id = r.id
          WHERE lr.id = ${newId}
        `;

        return res.status(201).json({
          success: true,
          message: 'Leave request submitted successfully',
          request: newRequest[0]
        });

      case 'PUT':
        // Update leave request status (approve/reject)
        const { id, status: newStatus, reviewedBy } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Leave request ID is required' });
        }

        if (!newStatus || !['approved', 'rejected'].includes(newStatus)) {
          return res.status(400).json({
            error: 'Valid status is required (approved or rejected)'
          });
        }

        const requestToUpdate = await sql`
          SELECT * FROM leave_requests WHERE id = ${id}
        `;

        if (requestToUpdate.length === 0) {
          return res.status(404).json({ error: 'Leave request not found' });
        }

        const leaveRequest = requestToUpdate[0];

        // Update leave request status
        await sql`
          UPDATE leave_requests
          SET
            status = ${newStatus},
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = ${reviewedBy || null}
          WHERE id = ${id}
        `;

        // If approved, create attendance records
        if (newStatus === 'approved') {
          await createLeaveAttendanceRecords(leaveRequest);
        }

        const updatedRequest = await sql`
          SELECT
            lr.id,
            lr.student_id,
            s.nisn,
            s.full_name,
            lr.rombel_id,
            r.grade_level,
            r.class_name,
            lr.leave_type,
            lr.reason,
            lr.start_date,
            lr.end_date,
            lr.parent_name,
            lr.parent_contact,
            lr.status,
            lr.submitted_at,
            lr.reviewed_at,
            lr.reviewed_by,
            t.full_name as reviewed_by_name
          FROM leave_requests lr
          JOIN students s ON lr.student_id = s.id
          JOIN rombels r ON lr.rombel_id = r.id
          LEFT JOIN teachers t ON lr.reviewed_by = t.id
          WHERE lr.id = ${id}
        `;

        return res.status(200).json({
          success: true,
          message: `Leave request ${newStatus}`,
          request: updatedRequest[0]
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Leave Requests API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper functions

async function getPendingLeaveRequests(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await sql`
      SELECT
        lr.id,
        lr.student_id,
        s.nisn,
        s.full_name,
        lr.rombel_id,
        r.grade_level,
        r.class_name,
        lr.leave_type,
        lr.reason,
        lr.start_date,
        lr.end_date,
        lr.parent_name,
        lr.parent_contact,
        lr.status,
        lr.submitted_at
      FROM leave_requests lr
      JOIN students s ON lr.student_id = s.id
      JOIN rombels r ON lr.rombel_id = r.id
      WHERE lr.status = 'pending'
      ORDER BY lr.submitted_at ASC
    `;
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get pending Error:', error);
    return res.status(500).json({ error: 'Failed to get pending leave requests' });
  }
}

async function createLeaveAttendanceRecords(leaveRequest: any) {
  const { student_id, rombel_id, leave_type, reason, start_date, end_date } = leaveRequest;

  const start = new Date(start_date);
  const end = new Date(end_date);
  const currentDate = new Date(start);

  // Map leave_type to attendance status
  const statusMapping: { [key: string]: string } = {
    sick: 'sick',
    excused: 'excused',
    other: 'excused'
  };

  const attendanceStatus = statusMapping[leave_type] || 'excused';

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if attendance record already exists
    const existingResult = await sql`
      SELECT * FROM attendance
      WHERE student_id = ${student_id}
        AND rombel_id = ${rombel_id}
        AND attendance_date = ${dateStr}
    `;

    if (existingResult.length === 0) {
      // Get count for ID generation
      const countResult = await sql`SELECT COUNT(*) as count FROM attendance`;
      const count = Number(countResult[0].count);
      const newId = `att${String(count + 1).padStart(6, '0')}`;

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
          ${student_id},
          ${rombel_id},
          ${dateStr},
          ${attendanceStatus},
          ${reason}
        )
      `;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
}
