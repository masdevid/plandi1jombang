import type { VercelRequest, VercelResponse } from '@vercel/node';
import db, { initializeDatabase, seedDatabase } from './lib/database';
import { LeaveRequest } from './lib/types';

// Initialize database on cold start
initializeDatabase();
seedDatabase();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;
    const { studentId, nis, status } = req.query;

    switch (method) {
      case 'GET':
        if (studentId) {
          // Get leave requests by student ID
          const requests = db.prepare(`
            SELECT * FROM leave_requests
            WHERE studentId = ?
            ORDER BY submittedAt DESC
          `).all(studentId) as LeaveRequest[];
          return res.status(200).json(requests);
        }

        if (nis) {
          // Get leave requests by NIS
          const requests = db.prepare(`
            SELECT * FROM leave_requests
            WHERE studentNis = ?
            ORDER BY submittedAt DESC
          `).all(nis) as LeaveRequest[];
          return res.status(200).json(requests);
        }

        if (status) {
          // Get leave requests by status
          const requests = db.prepare(`
            SELECT * FROM leave_requests
            WHERE status = ?
            ORDER BY submittedAt DESC
          `).all(status) as LeaveRequest[];
          return res.status(200).json(requests);
        }

        // Get all leave requests
        const allRequests = db.prepare(`
          SELECT * FROM leave_requests
          ORDER BY submittedAt DESC
          LIMIT 100
        `).all() as LeaveRequest[];
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
        const count = (db.prepare('SELECT COUNT(*) as count FROM leave_requests').get() as { count: number }).count;
        const newId = `lr${String(count + 1).padStart(6, '0')}`;

        const insertStmt = db.prepare(`
          INSERT INTO leave_requests (
            id, studentId, studentName, studentNis, studentClass,
            leaveType, reason, startDate, endDate, submittedAt,
            status, parentName, parentContact
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const submittedAt = new Date().toISOString();
        insertStmt.run(
          newId,
          reqStudentId,
          studentName,
          studentNis,
          studentClass,
          leaveType,
          reason,
          startDate,
          endDate,
          submittedAt,
          'pending',
          parentName || null,
          parentContact || null
        );

        // Auto-create attendance records for the leave period
        createLeaveAttendanceRecords({
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

        const newRequest = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(newId) as LeaveRequest;
        return res.status(201).json(newRequest);

      case 'PUT':
        // Update leave request status
        const { id, status: newStatus } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'Leave request ID is required' });
        }

        if (!newStatus || !['approved', 'rejected'].includes(newStatus)) {
          return res.status(400).json({ error: 'Valid status is required (approved or rejected)' });
        }

        const requestToUpdate = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id);
        if (!requestToUpdate) {
          return res.status(404).json({ error: 'Leave request not found' });
        }

        const updateStmt = db.prepare('UPDATE leave_requests SET status = ? WHERE id = ?');
        updateStmt.run(newStatus, id);

        const updatedRequest = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id) as LeaveRequest;
        return res.status(200).json(updatedRequest);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function createLeaveAttendanceRecords(leaveRequest: LeaveRequest) {
  const { studentId, studentName, studentNis, studentClass, leaveType, reason, startDate, endDate } = leaveRequest;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if attendance record already exists
    const existing = db.prepare('SELECT * FROM attendance WHERE studentId = ? AND date = ?').get(studentId, dateStr);

    if (!existing) {
      // Get count for ID generation
      const count = (db.prepare('SELECT COUNT(*) as count FROM attendance').get() as { count: number }).count;
      const newId = `att${String(count + 1).padStart(6, '0')}`;

      const insertStmt = db.prepare(`
        INSERT INTO attendance (id, studentId, studentName, studentNis, studentClass, checkInTime, date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        newId,
        studentId,
        studentName,
        studentNis,
        studentClass,
        new Date(dateStr).toISOString(),
        dateStr,
        leaveType,
        reason
      );
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
}
