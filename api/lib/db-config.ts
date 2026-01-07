import { sql as vercelSql } from '@vercel/postgres';
import postgres from 'postgres';

// Environment detection
const isVercel = process.env['VERCEL'] === '1' || process.env['VERCEL_ENV'] !== undefined;
const isDevelopment = process.env['NODE_ENV'] === 'development';

// Database configuration
let sql: any;

if (isVercel) {
  // Use Vercel Postgres (Neon) in Vercel environment
  console.log('Using Vercel Postgres (Neon DB)');
  sql = vercelSql;
} else {
  // Use local PostgreSQL in Docker/dedicated server
  const connectionString = process.env['DATABASE_URL'] || process.env['POSTGRES_URL'] ||
    'postgresql://sd_plandi_user:change_this_password@localhost:5432/sd_plandi';

  console.log('Using local PostgreSQL:', connectionString.replace(/:[^:@]+@/, ':***@'));

  const postgresClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Wrap postgres client to return arrays directly (matching postgres library behavior)
  sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    return await postgresClient(strings, ...values);
  };

  // Expose raw client for migrations
  (sql as any).raw = postgresClient;
}

export { sql, isVercel };
