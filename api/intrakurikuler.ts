import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, mapRowToIntrakurikulerSubject, mapRowToIntrakurikulerAssignment } from './lib/database.js';
import { IntrakurikulerSubject, IntrakurikulerAssignment } from './lib/types.js';

// Note: Database should be initialized via pnpm db:migrate before deploying
// Removing auto-initialization to prevent timeout issues on Vercel

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

  try {
    const { method } = req;
    const { action } = req.query;

    switch (method) {
      case 'GET':
        if (action === 'subjects') {
          // Get all mata pelajaran intrakurikuler
          const result = await sql`
            SELECT * FROM intrakurikuler_subjects
            ORDER BY kode_mapel ASC
          `;

          const subjects = result.rows.map(mapRowToIntrakurikulerSubject);

          return res.status(200).json(subjects);
        }

        if (action === 'classes') {
          // Get all classes with their intrakurikuler assignments
          const { className } = req.query;

          let query;
          if (className) {
            query = sql`
              SELECT
                ics.id,
                ics.kode_mapel,
                ics.nama_mapel,
                ics.kelompok,
                ics.deskripsi,
                ics.aktif,
                ics.created_at,
                ic.class_name,
                ic.teacher_id,
                ic.teacher_name,
                ic.jam_mulai,
                ic.jam_selesai,
                ic.hari
              FROM intrakurikuler_class_assignments ic
              JOIN intrakurikuler_subjects ics ON ic.subject_id = ics.id
              WHERE ic.class_name = ${className as string}
              ORDER BY ic.hari, ic.jam_mulai
            `;
          } else {
            query = sql`
              SELECT
                ics.id,
                ics.kode_mapel,
                ics.nama_mapel,
                ics.kelompok,
                ics.deskripsi,
                ics.aktif,
                ics.created_at,
                ic.class_name,
                ic.teacher_id,
                ic.teacher_name,
                ic.jam_mulai,
                ic.jam_selesai,
                ic.hari
              FROM intrakurikuler_class_assignments ic
              JOIN intrakurikuler_subjects ics ON ic.subject_id = ics.id
              ORDER BY ic.class_name, ic.hari, ic.jam_mulai
            `;
          }

          const assignments = query.rows.map(mapRowToIntrakurikulerAssignment);

          return res.status(200).json(assignments);
        }

        // Default: get all subjects
        const defaultResult = await sql`
          SELECT * FROM intrakurikuler_subjects
          ORDER BY kode_mapel ASC
        `;

        const defaultSubjects = defaultResult.rows.map(mapRowToIntrakurikulerSubject);

        return res.status(200).json(defaultSubjects);

      case 'POST':
        const { subjectData, assignmentData } = req.body;

        if (subjectData) {
          // Create new mata pelajaran
          const { kodeMapel, namaMapel, kelompok, deskripsi } = subjectData;

          if (!kodeMapel || !namaMapel) {
            return res.status(400).json({ error: 'Kode mapel dan nama mapel harus diisi' });
          }

          // Check if kode_mapel already exists
          const existingResult = await sql`
            SELECT id FROM intrakurikuler_subjects WHERE kode_mapel = ${kodeMapel}
          `;

          if (existingResult.rows.length > 0) {
            return res.status(409).json({ error: 'Kode mata pelajaran sudah ada' });
          }

          // Generate ID
          const countResult = await sql`SELECT COUNT(*) as count FROM intrakurikuler_subjects`;
          const count = Number(countResult.rows[0].count);
          const newId = `map${String(count + 1).padStart(3, '0')}`;

          await sql`
            INSERT INTO intrakurikuler_subjects (id, kode_mapel, nama_mapel, kelompok, deskripsi, aktif, created_at)
            VALUES (${newId}, ${kodeMapel}, ${namaMapel}, ${kelompok || null}, ${deskripsi || null}, 1, NOW())
          `;

          const newSubjectResult = await sql`SELECT * FROM intrakurikuler_subjects WHERE id = ${newId}`;
          return res.status(201).json(mapRowToIntrakurikulerSubject(newSubjectResult.rows[0]));
        }

        if (assignmentData) {
          // Create new class assignment
          const { subjectId, className, teacherId, teacherName, jamMulai, jamSelesai, hari } = assignmentData;

          if (!subjectId || !className || !hari) {
            return res.status(400).json({ error: 'Subject ID, class name, and hari are required' });
          }

          // Generate ID
          const countResult = await sql`SELECT COUNT(*) as count FROM intrakurikuler_class_assignments`;
          const count = Number(countResult.rows[0].count);
          const newId = `assign${String(count + 1).padStart(3, '0')}`;

          await sql`
            INSERT INTO intrakurikuler_class_assignments (id, subject_id, class_name, teacher_id, teacher_name, jam_mulai, jam_selesai, hari, created_at)
            VALUES (${newId}, ${subjectId}, ${className}, ${teacherId || null}, ${teacherName || null}, ${jamMulai || null}, ${jamSelesai || null}, ${hari}, NOW())
          `;

          const newAssignmentResult = await sql`
            SELECT
              ica.*,
              is.kode_mapel,
              is.nama_mapel,
              is.kelompok,
              is.deskripsi,
              is.aktif,
              is.created_at
            FROM intrakurikuler_class_assignments ica
            JOIN intrakurikuler_subjects is ON ica.subject_id = is.id
            WHERE ica.id = ${newId}
          `;

          return res.status(201).json(mapRowToIntrakurikulerAssignment(newAssignmentResult.rows[0]));
        }

        return res.status(400).json({ error: 'Invalid request data' });

      case 'PUT':
        const { id, updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        // Check if updating subject or assignment
        const subjectCheck = await sql`SELECT id FROM intrakurikuler_subjects WHERE id = ${id}`;

        if (subjectCheck.rows.length > 0) {
          // Update subject
          const { kodeMapel, namaMapel, kelompok, deskripsi, aktif } = updateData;

          await sql`
            UPDATE intrakurikuler_subjects
            SET
              kode_mapel = COALESCE(${kodeMapel || null}, kode_mapel),
              nama_mapel = COALESCE(${namaMapel || null}, nama_mapel),
              kelompok = COALESCE(${kelompok || null}, kelompok),
              deskripsi = COALESCE(${deskripsi || null}, deskripsi),
              aktif = COALESCE(${aktif !== undefined ? aktif : null}, aktif)
            WHERE id = ${id}
          `;

          const updatedResult = await sql`SELECT * FROM intrakurikuler_subjects WHERE id = ${id}`;
          return res.status(200).json(mapRowToIntrakurikulerSubject(updatedResult.rows[0]));
        } else {
          // Update assignment
          const { className, teacherId, teacherName, jamMulai, jamSelesai, hari } = updateData;

          await sql`
            UPDATE intrakurikuler_class_assignments
            SET
              class_name = COALESCE(${className || null}, class_name),
              teacher_id = COALESCE(${teacherId || null}, teacher_id),
              teacher_name = COALESCE(${teacherName || null}, teacher_name),
              jam_mulai = COALESCE(${jamMulai || null}, jam_mulai),
              jam_selesai = COALESCE(${jamSelesai || null}, jam_selesai),
              hari = COALESCE(${hari || null}, hari)
            WHERE id = ${id}
          `;

          const updatedAssignmentResult = await sql`
            SELECT
              ica.*,
              is.kode_mapel,
              is.nama_mapel,
              is.kelompok,
              is.deskripsi,
              is.aktif,
              is.created_at
            FROM intrakurikuler_class_assignments ica
            JOIN intrakurikuler_subjects is ON ica.subject_id = is.id
            WHERE ica.id = ${id}
          `;

          return res.status(200).json(mapRowToIntrakurikulerAssignment(updatedAssignmentResult.rows[0]));
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Intrakurikuler API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
