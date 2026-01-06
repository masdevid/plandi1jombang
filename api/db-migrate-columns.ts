import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './lib/db-config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting database migration to add new columns...');

    // Add gender, date_of_birth, and religion columns if they don't exist
    await sql`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS gender TEXT,
      ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
      ADD COLUMN IF NOT EXISTS religion TEXT
    `;

    console.log('✓ Added gender, date_of_birth, religion columns to students table');

    // Add scanned_by and scanner_name columns to attendance if they don't exist
    await sql`
      ALTER TABLE attendance
      ADD COLUMN IF NOT EXISTS scanned_by TEXT,
      ADD COLUMN IF NOT EXISTS scanner_name TEXT
    `;

    // Add foreign key constraint for scanned_by if it doesn't exist
    try {
      await sql`
        ALTER TABLE attendance
        ADD CONSTRAINT fk_attendance_scanned_by
        FOREIGN KEY (scanned_by) REFERENCES users(id)
      `;
    } catch (error: any) {
      // Constraint might already exist, ignore error
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    console.log('✓ Added scanned_by and scanner_name columns to attendance table');

    return res.status(200).json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database migration failed',
      details: error.message,
      stack: error.stack
    });
  }
}
