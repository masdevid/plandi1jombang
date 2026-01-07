import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './lib/db-config.js';

/**
 * Student Promotion API - Year-End Transitions
 *
 * Handles:
 * - Promoting students to next grade
 * - Creating new rombels for next academic year
 * - Graduating Grade 6 students
 * - Maintaining historical records
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { newAcademicYearId, promotionDate } = req.body;

    if (!newAcademicYearId) {
      return res.status(400).json({
        error: 'Missing required field: newAcademicYearId (e.g., "ay2027")'
      });
    }

    const exitDate = promotionDate || new Date().toISOString().split('T')[0];

    // Verify new academic year exists
    const academicYearCheck = await sql`
      SELECT id, name, start_date FROM academic_years WHERE id = ${newAcademicYearId}
    `;

    if (academicYearCheck.length === 0) {
      return res.status(404).json({
        error: `Academic year ${newAcademicYearId} not found. Create it first.`
      });
    }

    const newAcademicYear = academicYearCheck[0];
    const entryDate = newAcademicYear.start_date.toISOString().split('T')[0];

    // Check if promotion already happened for this academic year
    const existingPromotions = await sql`
      SELECT COUNT(*) as count
      FROM rombel_memberships rm
      JOIN rombels r ON rm.rombel_id = r.id
      WHERE r.academic_year_id = ${newAcademicYearId} AND rm.status = 'active'
    `;

    if (Number(existingPromotions[0].count) > 0) {
      return res.status(400).json({
        error: `Students already promoted to ${newAcademicYear.name}. Promotion can only be done once per academic year.`
      });
    }

    // Get all currently active students grouped by grade
    const activeStudents = await sql`
      SELECT
        s.id,
        s.nisn,
        s.full_name,
        rm.id as membership_id,
        rm.rombel_id,
        r.grade_level,
        r.class_name,
        r.academic_year_id
      FROM students s
      JOIN rombel_memberships rm ON s.id = rm.student_id
      JOIN rombels r ON rm.rombel_id = r.id
      WHERE rm.status = 'active'
      ORDER BY r.grade_level, s.full_name
    `;

    if (activeStudents.length === 0) {
      return res.status(400).json({
        error: 'No active students found to promote'
      });
    }

    // Group students by grade
    const studentsByGrade: { [key: number]: any[] } = {};
    activeStudents.forEach(student => {
      const grade = student.grade_level;
      if (!studentsByGrade[grade]) {
        studentsByGrade[grade] = [];
      }
      studentsByGrade[grade].push(student);
    });

    const promotionResults = {
      promoted: [] as any[],
      graduated: [] as any[],
      newRombels: [] as any[],
      errors: [] as any[]
    };

    // Start transaction
    console.log('🎓 Starting student promotion process...');

    // 1. Close all current active memberships
    console.log('📝 Closing current academic year memberships...');
    await sql`
      UPDATE rombel_memberships
      SET status = 'completed', exit_date = ${exitDate}
      WHERE status = 'active'
    `;

    // 2. Process each grade
    for (const gradeStr of Object.keys(studentsByGrade).sort()) {
      const currentGrade = parseInt(gradeStr);
      const students = studentsByGrade[currentGrade];

      console.log(`📚 Processing Grade ${currentGrade}: ${students.length} students`);

      if (currentGrade === 6) {
        // Graduate Grade 6 students
        for (const student of students) {
          promotionResults.graduated.push({
            student_id: student.id,
            nisn: student.nisn,
            full_name: student.full_name,
            from_grade: 6,
            status: 'graduated'
          });
        }
        console.log(`   ✅ ${students.length} students graduated`);
      } else {
        // Promote to next grade
        const nextGrade = currentGrade + 1;

        // Check if rombel exists for next grade in new academic year
        let nextRombel = await sql`
          SELECT id, grade_level, class_name
          FROM rombels
          WHERE academic_year_id = ${newAcademicYearId} AND grade_level = ${nextGrade}
          LIMIT 1
        `;

        // Create new rombel if doesn't exist
        if (nextRombel.length === 0) {
          // Get a teacher for this rombel (reuse existing teacher assignment pattern)
          const teacherAssignment = await sql`
            SELECT wali_teacher_id
            FROM rombels
            WHERE grade_level = ${currentGrade}
            ORDER BY created_at DESC
            LIMIT 1
          `;
          const teacherId = teacherAssignment[0]?.wali_teacher_id || 'tch002';

          const newRombelId = `rmb${newAcademicYearId.replace('ay', '')}0${nextGrade}`;

          await sql`
            INSERT INTO rombels (id, academic_year_id, grade_level, class_name, wali_teacher_id)
            VALUES (
              ${newRombelId},
              ${newAcademicYearId},
              ${nextGrade},
              ${'Kelas ' + nextGrade},
              ${teacherId}
            )
          `;

          nextRombel = await sql`
            SELECT id, grade_level, class_name
            FROM rombels
            WHERE id = ${newRombelId}
          `;

          promotionResults.newRombels.push({
            id: newRombelId,
            grade_level: nextGrade,
            class_name: 'Kelas ' + nextGrade,
            academic_year: newAcademicYear.name
          });

          console.log(`   ➕ Created new rombel: ${newRombelId} (Grade ${nextGrade})`);
        }

        const targetRombel = nextRombel[0];

        // Create new memberships for promoted students
        for (const student of students) {
          // Get the next available membership ID
          const maxIdResult = await sql`
            SELECT id FROM rombel_memberships
            ORDER BY id DESC
            LIMIT 1
          `;

          let nextId = 1;
          if (maxIdResult.length > 0) {
            const lastId = maxIdResult[0].id;
            const lastNum = parseInt(lastId.replace('mem', ''));
            nextId = lastNum + 1;
          }

          const newMembershipId = `mem${String(nextId).padStart(4, '0')}`;

          await sql`
            INSERT INTO rombel_memberships (
              id,
              student_id,
              rombel_id,
              status,
              entry_date
            )
            VALUES (
              ${newMembershipId},
              ${student.id},
              ${targetRombel.id},
              'active',
              ${entryDate}
            )
          `;

          promotionResults.promoted.push({
            student_id: student.id,
            nisn: student.nisn,
            full_name: student.full_name,
            from_grade: currentGrade,
            to_grade: nextGrade,
            new_rombel_id: targetRombel.id,
            new_membership_id: newMembershipId
          });
        }

        console.log(`   ✅ Promoted ${students.length} students from Grade ${currentGrade} to Grade ${nextGrade}`);
      }
    }

    // 3. Create new Grade 1 rombel for incoming students
    const newGrade1RombelId = `rmb${newAcademicYearId.replace('ay', '')}01`;
    const existingGrade1 = await sql`
      SELECT id FROM rombels
      WHERE academic_year_id = ${newAcademicYearId} AND grade_level = 1
    `;

    if (existingGrade1.length === 0) {
      await sql`
        INSERT INTO rombels (id, academic_year_id, grade_level, class_name, wali_teacher_id)
        VALUES (
          ${newGrade1RombelId},
          ${newAcademicYearId},
          1,
          'Kelas 1',
          'tch002'
        )
      `;

      promotionResults.newRombels.push({
        id: newGrade1RombelId,
        grade_level: 1,
        class_name: 'Kelas 1',
        academic_year: newAcademicYear.name,
        note: 'Ready for new student enrollment'
      });

      console.log(`   ➕ Created Grade 1 rombel for new students: ${newGrade1RombelId}`);
    }

    console.log('✅ Promotion process completed successfully!');

    return res.status(200).json({
      success: true,
      message: `Students promoted to academic year ${newAcademicYear.name}`,
      academicYear: {
        id: newAcademicYearId,
        name: newAcademicYear.name,
        start_date: newAcademicYear.start_date
      },
      summary: {
        totalPromoted: promotionResults.promoted.length,
        totalGraduated: promotionResults.graduated.length,
        newRombelsCreated: promotionResults.newRombels.length
      },
      details: {
        promoted: promotionResults.promoted,
        graduated: promotionResults.graduated,
        newRombels: promotionResults.newRombels
      }
    });

  } catch (error) {
    console.error('❌ Promotion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Promotion failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
