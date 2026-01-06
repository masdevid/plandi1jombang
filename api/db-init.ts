import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase, seedDatabase, sql } from './lib/database.js';

// This endpoint can be called once to initialize the database
// Call it via: curl -X POST https://your-domain.vercel.app/api/db-init
// Force reseed: curl -X POST https://your-domain.vercel.app/api/db-init?force=true
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { force } = req.query;
    console.log('Starting database initialization...', force === 'true' ? '(FORCE MODE)' : '');

    // Initialize database schema
    await initializeDatabase();
    console.log('✓ Database schema initialized');

    // If force=true, delete existing students and reseed
    if (force === 'true') {
      console.log('Force mode: Deleting existing students...');
      await sql`DELETE FROM attendance`;
      await sql`DELETE FROM leave_requests`;
      await sql`DELETE FROM students WHERE id LIKE 'std%'`; // Only delete seeded students
      console.log('✓ Existing data cleared');
    }

    // Seed initial data
    await seedDatabase();
    console.log('✓ Database seeded with initial data');

    return res.status(200).json({
      success: true,
      message: force === 'true'
        ? 'Database force re-seeded successfully'
        : 'Database initialized and seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
