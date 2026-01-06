/**
 * Standalone Express server for Docker deployment
 * Serves both the Angular SPA and API endpoints
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - Import from Vercel serverless functions
// Note: We need to adapt Vercel functions to Express middleware

// For now, create simple proxies
import authHandler from './auth.js';
import adminHandler from './admin.js';
import studentsHandler from './students.js';
import attendanceHandler from './attendance.js';
import leaveRequestsHandler from './leave-requests.js';

// Convert Vercel handler to Express middleware
const adaptVercelHandler = (handler) => {
  return async (req, res) => {
    try {
      // Create Vercel-like request/response objects
      const vercelReq = {
        ...req,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query
      };

      const vercelRes = {
        status: (code) => {
          res.status(code);
          return vercelRes;
        },
        json: (data) => res.json(data),
        send: (data) => res.send(data),
        end: (data) => res.end(data),
        setHeader: (key, value) => res.setHeader(key, value)
      };

      await handler(vercelReq, vercelRes);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Mount API routes
app.all('/api/auth', adaptVercelHandler(authHandler));
app.all('/api/admin', adaptVercelHandler(adminHandler));
app.all('/api/students', adaptVercelHandler(studentsHandler));
app.all('/api/attendance', adaptVercelHandler(attendanceHandler));
app.all('/api/leave-requests', adaptVercelHandler(leaveRequestsHandler));

// Serve static files (Angular build)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   SDN Plandi 1 Jombang - Server Running                  ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   Port: ${PORT}                                              ║
║   URL: http://localhost:${PORT}                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
