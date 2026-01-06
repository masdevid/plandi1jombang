import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, hashPassword, mapRowToUser } from './lib/database';
import * as crypto from 'crypto';

// Initialize database
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    const { initializeDatabase } = await import('./lib/database');
    await initializeDatabase();
    initialized = true;
  }
}

// Generate session token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    await ensureInitialized();

    switch (method) {
      case 'POST': {
        const { action } = req.body;

        if (action === 'login') {
          // Login
          const { email, password } = req.body;

          if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
          }

          // Find user by email
          const userResult = await sql`
            SELECT * FROM users 
            WHERE email = ${email} AND active = 1
          `;

          if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          const user = userResult.rows[0];
          const passwordHash = hashPassword(password);

          // Verify password
          if (user.password_hash !== passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Create session
          const sessionId = 'sess' + Date.now();
          const token = generateToken();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          await sql`
            INSERT INTO sessions (id, user_id, token, expires_at, created_at)
            VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt}, NOW())
          `;

          // Return user data and token (excluding password_hash)
          const userData = mapRowToUser(user);
          return res.status(200).json({
            user: userData,
            token,
            expiresAt
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
