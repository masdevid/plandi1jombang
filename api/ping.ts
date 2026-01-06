import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple ping endpoint with no database dependencies
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env['NODE_ENV'],
      POSTGRES_URL_EXISTS: !!process.env['POSTGRES_URL']
    }
  });
}
