import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, mapRowToExtrakurikulerActivity, mapRowToExtrakurikulerAssignment } from './lib/database.js';
import { ExtrakurikulerActivity, ExtrakurikulerAssignment } from './lib/types.js';

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
        if (action === 'activities') {
          // Get all kegiatan extrakurikuler
          const result = await sql`
            SELECT * FROM extrakurikuler_activities
            ORDER BY kode_ekskul ASC
          `;

          const activities = result.rows.map(mapRowToExtrakurikulerActivity);

          return res.status(200).json(activities);
        }

        if (action === 'members') {
          // Get all members with their extrakurikuler assignments
          const { activityId, className } = req.query;

          let query;
          if (activityId && className) {
            query = sql`
              SELECT
                ea.id,
                ea.kode_ekskul,
                ea.nama_ekskul,
                ea.deskripsi,
                ea.pembina,
                ea.aktif,
                ea.created_at,
                em.student_id,
                em.student_name,
                em.student_nis,
                em.student_class,
                em.joined_at,
                em.status
              FROM extrakurikuler_members em
              JOIN extrakurikuler_activities ea ON em.activity_id = ea.id
              WHERE em.activity_id = ${activityId as string} AND em.student_class = ${className as string}
              ORDER BY em.student_name ASC
            `;
          } else if (activityId) {
            query = sql`
              SELECT
                ea.id,
                ea.kode_ekskul,
                ea.nama_ekskul,
                ea.deskripsi,
                ea.pembina,
                ea.aktif,
                ea.created_at,
                em.student_id,
                em.student_name,
                em.student_nis,
                em.student_class,
                em.joined_at,
                em.status
              FROM extrakurikuler_members em
              JOIN extrakurikuler_activities ea ON em.activity_id = ea.id
              WHERE em.activity_id = ${activityId as string}
              ORDER BY em.student_class, em.student_name ASC
            `;
          } else if (className) {
            query = sql`
              SELECT
                ea.id,
                ea.kode_ekskul,
                ea.nama_ekskul,
                ea.deskripsi,
                ea.pembina,
                ea.aktif,
                ea.created_at,
                em.student_id,
                em.student_name,
                em.student_nis,
                em.student_class,
                em.joined_at,
                em.status
              FROM extrakurikuler_members em
              JOIN extrakurikuler_activities ea ON em.activity_id = ea.id
              WHERE em.student_class = ${className as string}
              ORDER BY ea.nama_ekskul, em.student_name ASC
            `;
          } else {
            query = sql`
              SELECT
                ea.id,
                ea.kode_ekskul,
                ea.nama_ekskul,
                ea.deskripsi,
                ea.pembina,
                ea.aktif,
                ea.created_at,
                em.student_id,
                em.student_name,
                em.student_nis,
                em.student_class,
                em.joined_at,
                em.status
              FROM extrakurikuler_members em
              JOIN extrakurikuler_activities ea ON em.activity_id = ea.id
              ORDER BY ea.nama_ekskul, em.student_class, em.student_name ASC
            `;
          }

          const assignments = query.rows.map(mapRowToExtrakurikulerAssignment);

          return res.status(200).json(assignments);
        }

        // Default: get all activities
        const defaultResult = await sql`
          SELECT * FROM extrakurikuler_activities
          ORDER BY kode_ekskul ASC
        `;

        const defaultActivities = defaultResult.rows.map(mapRowToExtrakurikulerActivity);

        return res.status(200).json(defaultActivities);

      case 'POST':
        const { activityData, memberData } = req.body;

        if (activityData) {
          // Create new kegiatan extrakurikuler
          const { kodeEkskul, namaEkskul, deskripsi, pembina } = activityData;

          if (!kodeEkskul || !namaEkskul) {
            return res.status(400).json({ error: 'Kode ekskul dan nama ekskul harus diisi' });
          }

          // Check if kode_ekskul already exists
          const existingResult = await sql`
            SELECT id FROM extrakurikuler_activities WHERE kode_ekskul = ${kodeEkskul}
          `;

          if (existingResult.rows.length > 0) {
            return res.status(409).json({ error: 'Kode kegiatan extrakurikuler sudah ada' });
          }

          // Generate ID
          const countResult = await sql`SELECT COUNT(*) as count FROM extrakurikuler_activities`;
          const count = Number(countResult.rows[0].count);
          const newId = `eks${String(count + 1).padStart(3, '0')}`;

          await sql`
            INSERT INTO extrakurikuler_activities (id, kode_ekskul, nama_ekskul, deskripsi, pembina, aktif, created_at)
            VALUES (${newId}, ${kodeEkskul}, ${namaEkskul}, ${deskripsi || null}, ${pembina || null}, 1, NOW())
          `;

          const newActivityResult = await sql`SELECT * FROM extrakurikuler_activities WHERE id = ${newId}`;
          return res.status(201).json(mapRowToExtrakurikulerActivity(newActivityResult.rows[0]));
        }

        if (memberData) {
          // Create new member assignment
          const { activityId, studentId, studentName, studentNis, studentClass, status } = memberData;

          if (!activityId || !studentId || !studentName || !studentNis || !studentClass) {
            return res.status(400).json({ error: 'Activity ID, student ID, name, NIS, and class are required' });
          }

          // Check if student is already a member of this activity
          const existingMemberResult = await sql`
            SELECT id FROM extrakurikuler_members
            WHERE activity_id = ${activityId} AND student_id = ${studentId}
          `;

          if (existingMemberResult.rows.length > 0) {
            return res.status(409).json({ error: 'Siswa sudah terdaftar dalam kegiatan ini' });
          }

          // Generate ID
          const countResult = await sql`SELECT COUNT(*) as count FROM extrakurikuler_members`;
          const count = Number(countResult.rows[0].count);
          const newId = `mem${String(count + 1).padStart(3, '0')}`;

          await sql`
            INSERT INTO extrakurikuler_members (id, activity_id, student_id, student_name, student_nis, student_class, joined_at, status, created_at)
            VALUES (${newId}, ${activityId}, ${studentId}, ${studentName}, ${studentNis}, ${studentClass}, NOW(), ${status || 'aktif'}, NOW())
          `;

          const newMemberResult = await sql`
            SELECT
              em.*,
              ea.kode_ekskul,
              ea.nama_ekskul,
              ea.deskripsi,
              ea.pembina,
              ea.aktif as activity_aktif,
              ea.created_at as activity_created_at
            FROM extrakurikuler_members em
            JOIN extrakurikuler_activities ea ON em.activity_id = ea.id
            WHERE em.id = ${newId}
          `;

          return res.status(201).json(mapRowToExtrakurikulerAssignment(newMemberResult.rows[0]));
        }

        return res.status(400).json({ error: 'Invalid request data' });

      case 'PUT':
        const { id, updateData } = req.body;

        if (!id) {
          return res.status(400).json({ error: 'ID is required' });
        }

        // Check if updating activity or member
        const activityCheck = await sql`SELECT id FROM extrakurikuler_activities WHERE id = ${id}`;

        if (activityCheck.rows.length > 0) {
          // Update activity
          const { kodeEkskul, namaEkskul, deskripsi, pembina, aktif } = updateData;

          await sql`
            UPDATE extrakurikuler_activities
            SET
              kode_ekskul = COALESCE(${kodeEkskul || null}, kode_ekskul),
              nama_ekskul = COALESCE(${namaEkskul || null}, nama_ekskul),
              deskripsi = COALESCE(${deskripsi || null}, deskripsi),
              pembina = COALESCE(${pembina || null}, pembina),
              aktif = COALESCE(${aktif !== undefined ? aktif : null}, aktif)
            WHERE id = ${id}
          `;

          const updatedResult = await sql`SELECT * FROM extrakurikuler_activities WHERE id = ${id}`;
          return res.status(200).json(mapRowToExtrakurikulerActivity(updatedResult.rows[0]));
        } else {
          // Update member
          const { status } = updateData;

          await sql`
            UPDATE extrakurikuler_members
            SET
              status = COALESCE(${status || null}, status)
            WHERE id = ${id}
          `;

          const updatedMemberResult = await sql`
            SELECT
              em.*,
              ea.kode_ekskul,
              ea.nama_ekskul,
              ea.deskripsi,
              ea.pembina,
              ea.aktif as activity_aktif,
              ea.created_at as activity_created_at
            FROM extrakurikuler_members em
            JOIN extrakurikuler_activities ea ON em.activity_id = ea.id
            WHERE em.id = ${id}
          `;

          return res.status(200).json(mapRowToExtrakurikulerAssignment(updatedMemberResult.rows[0]));
        }

      case 'DELETE':
        const { id: deleteId } = req.query;

        if (!deleteId) {
          return res.status(400).json({ error: 'ID is required for deletion' });
        }

        // Check if deleting activity or member
        const deleteActivityCheck = await sql`SELECT id FROM extrakurikuler_activities WHERE id = ${deleteId as string}`;

        if (deleteActivityCheck.rows.length > 0) {
          // Delete activity and all its members
          await sql`DELETE FROM extrakurikuler_members WHERE activity_id = ${deleteId as string}`;
          await sql`DELETE FROM extrakurikuler_activities WHERE id = ${deleteId as string}`;

          return res.status(200).json({ message: 'Kegiatan dan semua anggota berhasil dihapus' });
        } else {
          // Delete member
          await sql`DELETE FROM extrakurikuler_members WHERE id = ${deleteId as string}`;

          return res.status(200).json({ message: 'Anggota berhasil dihapus dari kegiatan' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Extrakurikuler API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
