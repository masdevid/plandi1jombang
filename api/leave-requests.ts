import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initializeDatabase, seedDatabase, mapRowToLeaveRequest } from './lib/database';
import { LeaveRequest } from './lib/types';

// Initialize database on cold start
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initializeDatabase();
    await seedDatabase();
    initialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureInitialized();

    const { method } = req;
    const { studentId, nis, status } = req.query;

    switch (method) {
      case 'GET':
        if (studentId) {
          // Get leave requests by student ID
          const result = await sql`
            SELECT * FROM leave_requests
            WHERE student_id = ${studentId as string}
            ORDER BY submitted_at DESC
          `;
          const requests = result.rows.map(mapRowToLeaveRequest);
          return res.status(200).json(requests);
        }

        if (nis) {
          // Get leave requests by NIS
          const result = await sql`
            SELECT * FROM leave_requests
            WHERE student_nis = ${nis as string}
            ORDER BY submitted_at DESC
          `;
          const requests = result.rows.map(mapRowToLeaveRequest);
          return res.status(200).json(requests);
        }

        if (status) {
          // Get leave requests by status
          const result = await sql`
            SELECT * FROM leave_requests
            WHERE status = ${status as string}
            ORDER BY submitted_at DESC
          `;
          const requests = result.rows.map(mapRowToLeaveRequest);
          return res.status(200).json(requests);
        }

        // Get all leave requests
        const allResult = await sql`
          SELECT * FROM leave_requests
          ORDER BY submitted_at DESC
          LIMIT 100
        `;
        const allRequests = allResult.rows.map(mapRowToLeaveRequest);
        return res.status(200).json(allRequests);

      case 'POST':
        // Submit new leave request
        const {
          studentId: reqStudentId,
          studentName,
          studentNis,
          studentClass,
          leaveType,
          reason,
          startDate,
          endDate,
          parentName,
          parentContact
        } = req.body;

        if (!reqStudentId || !studentName || !studentNis || !studentClass || !leaveType || !reason || !startDate || !endDate) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate dates
        if (new Date(endDate) < new Date(startDate)) {
          return res.status(400).json({ error: 'End date must be after start date' });
        }

        // Generate ID
        const countResult = await sql`SELECT COUNT(*) as count FROM leave_requests`;
        const count = Number(countResult.rows[0].count);
        const newId = `lr${String(count + 1).padStart(6, '0')}`;

        const submittedAt = new Date().toISOString();
        await sql`
          INSERT INTO leave_requests (
            id, student_id, student_name, student_nis, student_class,
            leave_type, reason, start_date, end_date, submitted_at,
            status, parent_name, parent_contact
          ) VALUES (
            ${newId}, ${reqStudentId}, ${studentName}, ${studentNis}, ${studentClass},
            ${leaveType}, ${reason}, ${startDate}, ${endDate}, ${submittedAt},
            ${'pending'}, ${parentName || null}, ${parentContact || null}
          )
        `;

        // Auto-create attendance records for the leave period
        await createLeaveAttendanceRecords({
          id: newId,
          studentId: reqStudentId,
          studentName,
          studentNis,
          studentClass,
          leaveType,
          reason,
          startDate,
          endDate,
          submittedAt,
          status: 'pending',
          parentName,
          parentContact
        });

        const newRequestResult = await sql`SELECT * FROM leave_requests WHERE id = ${newId}`;
        return res.status(201).json(mapRowToLeaveRequest(newRequestResult.rows[0]));

      case 'PUT':
        // Update leave request status
        const { id, status: newStatus } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Leave request ID is required' });
        }

        if (!newStatus || !['approved', 'rejected'].includes(newStatus)) {
          return res.status(400).json({ error: 'Valid status is required (approved or rejected)' });
        }

        const requestToUpdateResult = await sql`SELECT * FROM leave_requests WHERE id = ${id}`;
        if (requestToUpdateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Leave request not found' });
        }

        await sql`UPDATE leave_requests SET status = ${newStatus} WHERE id = ${id}`;

        const updatedRequestResult = await sql`SELECT * FROM leave_requests WHERE id = ${id}`;
        return res.status(200).json(mapRowToLeaveRequest(updatedRequestResult.rows[0]));

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createLeaveAttendanceRecords(leaveRequest: LeaveRequest) {
  const { studentId, studentName, studentNis, studentClass, leaveType, reason, startDate, endDate } = leaveRequest;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if attendance record already exists
    const existingResult = await sql`
      SELECT * FROM attendance WHERE student_id = ${studentId} AND date = ${dateStr}
    `;

    if (existingResult.rows.length === 0) {
      // Get count for ID generation
      const countResult = await sql`SELECT COUNT(*) as count FROM attendance`;
      const count = Number(countResult.rows[0].count);
      const newId = `att${String(count + 1).padStart(6, '0')}`;

      await sql`
        INSERT INTO attendance (id, student_id, student_name, student_nis, student_class, check_in_time, date, status, notes)
        VALUES (${newId}, ${studentId}, ${studentName}, ${studentNis}, ${studentClass}, ${new Date(dateStr).toISOString()}, ${dateStr}, ${leaveType}, ${reason})
      `;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
}
