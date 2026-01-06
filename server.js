import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes - Import dynamically
app.use('/api/ping', async (req, res, next) => {
  try {
    const handler = (await import('./api/ping.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/health', async (req, res, next) => {
  try {
    const handler = (await import('./api/health.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/db-init', async (req, res, next) => {
  try {
    const handler = (await import('./api/db-init.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/students', async (req, res, next) => {
  try {
    const handler = (await import('./api/students.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/attendance', async (req, res, next) => {
  try {
    const handler = (await import('./api/attendance.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/leave-requests', async (req, res, next) => {
  try {
    const handler = (await import('./api/leave-requests.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', async (req, res, next) => {
  try {
    const handler = (await import('./api/auth.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

app.use('/api/admin', async (req, res, next) => {
  try {
    const handler = (await import('./api/admin.js')).default;
    return handler(req, res);
  } catch (error) {
    next(error);
  }
});

// Serve static files from Angular build
const distPath = path.join(__dirname, 'dist/sd-plandi/browser');
app.use(express.static(distPath));

// Handle Angular routes - return index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   SDN Plandi 1 Jombang - Attendance System                ║
║                                                            ║
║   Server running on:  http://localhost:${PORT}            ║
║   Environment:        ${process.env.NODE_ENV || 'development'}                   ║
║   Database:           ${process.env.VERCEL ? 'Neon (Vercel)' : 'Local PostgreSQL'}       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
