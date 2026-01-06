import type { VercelRequest, VercelResponse } from '@vercel/node';
import db, { initializeDatabase, seedDatabase } from './lib/database';
import { Student } from './lib/types';

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
    const { id, nis, qrCode } = req.query;

    switch (method) {
      case 'GET':
        if (id) {
          // Get student by ID
          const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as Student | undefined;
          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }
          return res.status(200).json(student);
        } else if (nis) {
          // Get student by NIS
          const student = db.prepare('SELECT * FROM students WHERE nis = ?').get(nis) as Student | undefined;
          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }
          return res.status(200).json(student);
        } else if (qrCode) {
          // Get student by QR code
          const student = db.prepare('SELECT * FROM students WHERE qrCode = ?').get(qrCode) as Student | undefined;
          if (!student) {
            return res.status(404).json({ error: 'Student not found' });
          }
          return res.status(200).json(student);
        } else {
          // Get all students
          const students = db.prepare('SELECT * FROM students ORDER BY class, name').all() as Student[];
          return res.status(200).json(students);
        }

      case 'POST':
        // Create new student
        const { nis: newNis, name, class: className, qrCode: newQrCode, photo, active = true } = req.body;

        if (!newNis || !name || !className || !newQrCode) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if NIS or QR code already exists
        const existing = db.prepare('SELECT * FROM students WHERE nis = ? OR qrCode = ?').get(newNis, newQrCode);
        if (existing) {
          return res.status(409).json({ error: 'Student with this NIS or QR code already exists' });
        }

        // Generate ID
        const count = (db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number }).count;
        const newId = `std${String(count + 1).padStart(3, '0')}`;

        const insertStmt = db.prepare(`
          INSERT INTO students (id, nis, name, class, qrCode, photo, active, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const createdAt = new Date().toISOString();
        insertStmt.run(newId, newNis, name, className, newQrCode, photo || null, active ? 1 : 0, createdAt);

        const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(newId) as Student;
        return res.status(201).json(newStudent);

      case 'PUT':
        // Update student
        if (!id) {
          return res.status(400).json({ error: 'Student ID is required' });
        }

        const existingStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
        if (!existingStudent) {
          return res.status(404).json({ error: 'Student not found' });
        }

        const { name: updatedName, class: updatedClass, photo: updatedPhoto, active: updatedActive } = req.body;

        const updateStmt = db.prepare(`
          UPDATE students
          SET name = COALESCE(?, name),
              class = COALESCE(?, class),
              photo = COALESCE(?, photo),
              active = COALESCE(?, active),
              updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        updateStmt.run(
          updatedName || null,
          updatedClass || null,
          updatedPhoto || null,
          updatedActive !== undefined ? (updatedActive ? 1 : 0) : null,
          id
        );

        const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as Student;
        return res.status(200).json(updatedStudent);

      case 'DELETE':
        // Delete student (soft delete - set active to false)
        if (!id) {
          return res.status(400).json({ error: 'Student ID is required' });
        }

        const studentToDelete = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
        if (!studentToDelete) {
          return res.status(404).json({ error: 'Student not found' });
        }

        db.prepare('UPDATE students SET active = 0 WHERE id = ?').run(id);
        return res.status(200).json({ message: 'Student deactivated successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
