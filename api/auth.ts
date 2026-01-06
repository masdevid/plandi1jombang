import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, hashPassword, mapRowToUser } from './lib/database';
import * as crypto from 'crypto';

// Note: Database should be initialized via pnpm db:migrate before deploying
// Removing auto-initialization to prevent timeout issues on Vercel

// Generate session token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    switch (method) {
      case 'POST': {
        const { action } = req.body;

        if (action === 'login') {
          // Login - validate input
          const { email, password } = req.body;

          if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
          }

          // Basic input sanitization
          const sanitizedEmail = email.trim().toLowerCase();

          // Find user by email (never select password_hash unless needed for verification)
          const userResult = await sql`
            SELECT id, nip, name, email, password_hash, role, is_wali_kelas, assigned_class, phone, photo, active, created_at
            FROM users
            WHERE LOWER(email) = ${sanitizedEmail} AND active = 1
          `;

          if (userResult.rows.length === 0) {
            // Generic error message to prevent user enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          const user = userResult.rows[0];
          const passwordHash = hashPassword(password);

          // Constant-time comparison would be better, but for SHA-256 this is acceptable
          if (user.password_hash !== passwordHash) {
            // Same generic error message
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Create session with unique ID
          const sessionId = 'sess-' + crypto.randomBytes(16).toString('hex');
          const token = generateToken();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          const expiresAtISO = expiresAt.toISOString();

          await sql`
            INSERT INTO sessions (id, user_id, token, expires_at, created_at)
            VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAtISO}, NOW())
          `;

          // CRITICAL: Use mapRowToUser to ensure password_hash is NEVER sent to client
          const userData = mapRowToUser(user);
          return res.status(200).json({
            user: userData,
            token,
            expiresAt: expiresAtISO
          });
        }

        if (action === 'logout') {
          // Logout
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
          }

          const token = authHeader.substring(7);

          // Delete session
          await sql`DELETE FROM sessions WHERE token = ${token}`;

          return res.status(200).json({ message: 'Logged out successfully' });
        }

        return res.status(400).json({ error: 'Invalid action' });
      }

      case 'GET': {
        // Verify token and get current user
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);

        // Find valid session
        const sessionResult = await sql`
          SELECT s.*, u.*
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ${token} AND s.expires_at > NOW() AND u.active = 1
        `;

        if (sessionResult.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const user = mapRowToUser(sessionResult.rows[0]);
        return res.status(200).json({ user });
      }

      case 'DELETE': {
        // Clean up expired sessions
        await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
        return res.status(200).json({ message: 'Expired sessions cleaned up' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      POSTGRES_URL_EXISTS: !!process.env['POSTGRES_URL']
    });
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
