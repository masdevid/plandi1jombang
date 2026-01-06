import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, mapRowToAttendance, mapRowToLeaveRequest, mapRowToStudent } from './lib/database.js';

// Note: Database should be initialized via pnpm db:migrate before deploying
// Removing auto-initialization to prevent timeout issues on Vercel

// Verify admin or wali kelas authorization
async function verifyAuth(req: VercelRequest): Promise<{ user: any; authorized: boolean }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, authorized: false };
  }

  const token = authHeader.substring(7);

  // Find valid session
  const sessionResult = await sql`
    SELECT s.*, u.*
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > NOW() AND u.active = 1
  `;

  if (sessionResult.rows.length === 0) {
    return { user: null, authorized: false };
  }

  const user = sessionResult.rows[0];
  
  // Check if user is admin or wali kelas
  const authorized = user.role === 'admin' || (user.role === 'teacher' && user.is_wali_kelas === 1);

  return { user, authorized };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { resource, action } = req.query;

  try {
    // Verify authentication
    const { user, authorized } = await verifyAuth(req);
    if (!authorized) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    switch (resource) {
      case 'dashboard': {
        if (method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        // Get dashboard statistics
        const today = new Date().toISOString().split('T')[0];
        const isAdmin = user.role === 'admin';
        const classFilter = isAdmin ? '' : user.assigned_class;

        // Get attendance stats
        let attendanceQuery;
        if (isAdmin) {
          attendanceQuery = sql`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
              SUM(CASE WHEN status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
              SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
              SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
              SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
            FROM attendance
            WHERE date = ${today}
          `;
        } else {
          attendanceQuery = sql`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) as hadir,
              SUM(CASE WHEN status = 'terlambat' THEN 1 ELSE 0 END) as terlambat,
              SUM(CASE WHEN status = 'izin' THEN 1 ELSE 0 END) as izin,
              SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) as sakit,
              SUM(CASE WHEN status = 'alpha' THEN 1 ELSE 0 END) as alpha
            FROM attendance
            WHERE date = ${today} AND student_class = ${classFilter}
          `;
        }

        const attendanceStats = await attendanceQuery;

        // Get total students
        let studentQuery;
        if (isAdmin) {
          studentQuery = sql`SELECT COUNT(*) as count FROM students WHERE active = 1`;
        } else {
          studentQuery = sql`SELECT COUNT(*) as count FROM students WHERE active = 1 AND class = ${classFilter}`;
        }

        const studentCount = await studentQuery;

        // Get pending leave requests
        let leaveQuery;
        if (isAdmin) {
          leaveQuery = sql`SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`;
        } else {
          leaveQuery = sql`SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending' AND student_class = ${classFilter}`;
        }

        const pendingLeave = await leaveQuery;

        return res.status(200).json({
          attendance: attendanceStats.rows[0],
          totalStudents: Number(studentCount.rows[0].count),
          pendingLeaveRequests: Number(pendingLeave.rows[0].count),
          userRole: user.role,
          assignedClass: user.assigned_class
        });
      }

      case 'attendance': {
        if (method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { date, class: className } = req.query;
        const isAdmin = user.role === 'admin';
        const filterClass = isAdmin ? (className || null) : user.assigned_class;

        let query;
        if (date && filterClass) {
          query = sql`
            SELECT * FROM attendance
            WHERE date = ${date as string} AND student_class = ${filterClass as string}
            ORDER BY check_in_time DESC
          `;
        } else if (date) {
          query = sql`
            SELECT * FROM attendance
            WHERE date = ${date as string}
            ORDER BY check_in_time DESC
          `;
        } else if (filterClass) {
          query = sql`
            SELECT * FROM attendance
            WHERE student_class = ${filterClass as string}
            ORDER BY date DESC, check_in_time DESC
            LIMIT 100
          `;
        } else {
          query = sql`
            SELECT * FROM attendance
            ORDER BY date DESC, check_in_time DESC
            LIMIT 100
          `;
        }

        const result = await query;
        const records = result.rows.map(mapRowToAttendance);
        return res.status(200).json(records);
      }

      case 'leave-requests': {
        const isAdmin = user.role === 'admin';

        if (method === 'GET') {
          const { status } = req.query;
          const filterClass = isAdmin ? null : user.assigned_class;

          let query;
          if (status && filterClass) {
            query = sql`
              SELECT * FROM leave_requests
              WHERE status = ${status as string} AND student_class = ${filterClass}
              ORDER BY submitted_at DESC
            `;
          } else if (status) {
            query = sql`
              SELECT * FROM leave_requests
              WHERE status = ${status as string}
              ORDER BY submitted_at DESC
            `;
          } else if (filterClass) {
            query = sql`
              SELECT * FROM leave_requests
              WHERE student_class = ${filterClass}
              ORDER BY submitted_at DESC
            `;
          } else {
            query = sql`
              SELECT * FROM leave_requests
              ORDER BY submitted_at DESC
            `;
          }

          const result = await query;
          const requests = result.rows.map(mapRowToLeaveRequest);
          return res.status(200).json(requests);
        }

        if (method === 'PUT') {
          const { id, status: newStatus } = req.body;

          if (!id || !newStatus || !['approved', 'rejected'].includes(newStatus)) {
            return res.status(400).json({ error: 'Invalid request' });
          }

          // Check if wali kelas can review this request
          if (!isAdmin) {
            const checkResult = await sql`
              SELECT student_class FROM leave_requests WHERE id = ${id}
            `;
            if (checkResult.rows.length === 0 || checkResult.rows[0].student_class !== user.assigned_class) {
              return res.status(403).json({ error: 'Cannot review leave request from other class' });
            }
          }

          await sql`
            UPDATE leave_requests
            SET status = ${newStatus}, reviewed_by = ${user.id}, reviewed_at = NOW()
            WHERE id = ${id}
          `;

          return res.status(200).json({ message: 'Leave request updated' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
      }

      case 'students': {
        if (method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const isAdmin = user.role === 'admin';
        const filterClass = isAdmin ? null : user.assigned_class;

        let query;
        if (filterClass) {
          query = sql`
            SELECT * FROM students
            WHERE class = ${filterClass} AND active = 1
            ORDER BY name ASC
          `;
        } else {
          query = sql`
            SELECT * FROM students
            WHERE active = 1
            ORDER BY class, name ASC
          `;
        }

        const result = await query;
        const students = result.rows.map(mapRowToStudent);
        return res.status(200).json(students);
      }

      default:
        return res.status(404).json({ error: 'Resource not found' });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
