import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      POSTGRES_URL_EXISTS: !!process.env['POSTGRES_URL'],
      NODE_ENV: process.env['NODE_ENV'] || 'development'
    }
  };

  try {
    // Test database connection
    const result = await sql`SELECT NOW() as current_time`;
    health.database = {
      connected: true,
      serverTime: result.rows[0].current_time
    };

    // Check if tables exist
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    health.database.tables = tablesResult.rows.map(row => row.table_name);

    return res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.database = {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };

    return res.status(500).json(health);
  }
}
