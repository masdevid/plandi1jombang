import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './lib/db-config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Endpoint
 * Applies the unified Dapodik-style schema and seeds data from students-data.json
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting database migration...');

    // Read schema and seed files
    const schemaPath = path.join(__dirname, 'lib', 'schema.sql');
    const seedPath = path.join(__dirname, 'lib', 'seed.sql');

    if (!fs.existsSync(schemaPath)) {
      return res.status(500).json({ error: 'Schema file not found' });
    }

    if (!fs.existsSync(seedPath)) {
      return res.status(500).json({ error: 'Seed file not found' });
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    console.log('📖 Schema and seed files loaded');

    // Execute schema
    console.log('🔨 Creating database schema...');
    if ((sql as any).raw) {
      // Use postgres client directly for local development
      await (sql as any).raw.unsafe(schemaSQL);
    } else {
      // Use Vercel postgres unsafe method
      await (sql as any).unsafe(schemaSQL);
    }
    console.log('✅ Schema created successfully');

    // Execute seed
    console.log('🌱 Seeding database...');
    if ((sql as any).raw) {
      // Use postgres client directly for local development
      await (sql as any).raw.unsafe(seedSQL);
    } else {
      // Use Vercel postgres unsafe method
      await (sql as any).unsafe(seedSQL);
    }
    console.log('✅ Database seeded successfully');

    // Verify the migration
    const studentCount = await sql`SELECT COUNT(*) as count FROM students`;
    const rombelCount = await sql`SELECT COUNT(*) as count FROM rombels`;
    const membershipCount = await sql`SELECT COUNT(*) as count FROM rombel_memberships`;

    const result = {
      success: true,
      message: 'Database migration completed successfully',
      schema: 'Dapodik-style unified schema',
      academicYear: '2026/2027',
      stats: {
        students: parseInt((studentCount as any).rows ? (studentCount as any).rows[0].count : studentCount[0].count),
        rombels: parseInt((rombelCount as any).rows ? (rombelCount as any).rows[0].count : rombelCount[0].count),
        memberships: parseInt((membershipCount as any).rows ? (membershipCount as any).rows[0].count : membershipCount[0].count)
      },
      timestamp: new Date().toISOString()
    };

    console.log('📊 Migration stats:', result.stats);

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
