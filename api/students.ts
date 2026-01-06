import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, mapRowToStudent } from './lib/database';
import { Student } from './lib/types';

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
    const { id, nis, qrCode } = req.query;

    switch (method) {
      case 'GET':
        if (id) {
          // Get student by ID
          const result = await sql`SELECT * FROM students WHERE id = ${id as string}`;
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
          }
          return res.status(200).json(mapRowToStudent(result.rows[0]));
        } else if (nis) {
          // Get student by NIS
          const result = await sql`SELECT * FROM students WHERE nis = ${nis as string}`;
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
          }
          return res.status(200).json(mapRowToStudent(result.rows[0]));
        } else if (qrCode) {
          // Get student by QR code
          const result = await sql`SELECT * FROM students WHERE qr_code = ${qrCode as string}`;
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
          }
          return res.status(200).json(mapRowToStudent(result.rows[0]));
        } else {
          // Get all students
          const result = await sql`SELECT * FROM students ORDER BY class, name`;
          const students = result.rows.map(mapRowToStudent);
          return res.status(200).json(students);
        }

      case 'POST':
        // Create new student
        const { nis: newNis, name, class: className, qrCode: newQrCode, photo, active = true } = req.body;

        if (!newNis || !name || !className || !newQrCode) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if NIS or QR code already exists
        const existing = await sql`
          SELECT * FROM students
          WHERE nis = ${newNis} OR qr_code = ${newQrCode}
        `;
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: 'Student with this NIS or QR code already exists' });
        }

        // Generate ID
        const countResult = await sql`SELECT COUNT(*) as count FROM students`;
        const count = Number(countResult.rows[0].count);
        const newId = `std${String(count + 1).padStart(3, '0')}`;

        const createdAt = new Date().toISOString();
        await sql`
          INSERT INTO students (id, nis, name, class, qr_code, photo, active, created_at)
          VALUES (${newId}, ${newNis}, ${name}, ${className}, ${newQrCode}, ${photo || null}, ${active ? 1 : 0}, ${createdAt})
        `;

        const newStudentResult = await sql`SELECT * FROM students WHERE id = ${newId}`;
        return res.status(201).json(mapRowToStudent(newStudentResult.rows[0]));

      case 'PUT':
        // Update student
        if (!id) {
          return res.status(400).json({ error: 'Student ID is required' });
        }

        const existingStudentResult = await sql`SELECT * FROM students WHERE id = ${id as string}`;
        if (existingStudentResult.rows.length === 0) {
          return res.status(404).json({ error: 'Student not found' });
        }

        const { name: updatedName, class: updatedClass, photo: updatedPhoto, active: updatedActive } = req.body;

        await sql`
          UPDATE students
          SET
            name = COALESCE(${updatedName || null}, name),
            class = COALESCE(${updatedClass || null}, class),
            photo = COALESCE(${updatedPhoto || null}, photo),
            active = COALESCE(${updatedActive !== undefined ? (updatedActive ? 1 : 0) : null}, active),
            updated_at = NOW()
          WHERE id = ${id as string}
        `;

        const updatedStudentResult = await sql`SELECT * FROM students WHERE id = ${id as string}`;
        return res.status(200).json(mapRowToStudent(updatedStudentResult.rows[0]));

      case 'DELETE':
        // Delete student (soft delete - set active to false)
        if (!id) {
          return res.status(400).json({ error: 'Student ID is required' });
        }

        const studentToDeleteResult = await sql`SELECT * FROM students WHERE id = ${id as string}`;
        if (studentToDeleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Student not found' });
        }

        await sql`UPDATE students SET active = 0 WHERE id = ${id as string}`;
        return res.status(200).json({ message: 'Student deactivated successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Students API Error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
