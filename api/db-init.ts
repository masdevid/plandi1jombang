import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase, seedDatabase } from './lib/database';

// This endpoint can be called once to initialize the database
// Call it via: curl -X POST https://your-domain.vercel.app/api/db-init
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting database initialization...');

    // Initialize database schema
    await initializeDatabase();
    console.log('✓ Database schema initialized');

    // Seed initial data
    await seedDatabase();
    console.log('✓ Database seeded with initial data');

    return res.status(200).json({
      success: true,
      message: 'Database initialized and seeded successfully',
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
