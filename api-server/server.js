import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthModule = await import('../api/health.ts');
    const mockReq = { method: 'GET', query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await healthModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auth endpoint
app.all('/auth', async (req, res) => {
  try {
    const authModule = await import('../api/auth.ts');
    const mockReq = { method: req.method, query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await authModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Auth endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint
app.all('/admin', async (req, res) => {
  try {
    const adminModule = await import('../api/admin.ts');
    const mockReq = { method: req.method, query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await adminModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Admin endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Students endpoint
app.all('/students', async (req, res) => {
  try {
    const studentsModule = await import('../api/students.ts');
    const mockReq = { method: req.method, query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await studentsModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Students endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Attendance endpoint
app.all('/attendance', async (req, res) => {
  try {
    const attendanceModule = await import('../api/attendance.ts');
    const mockReq = { method: req.method, query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await attendanceModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Attendance endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Leave requests endpoint
app.all('/leave-requests', async (req, res) => {
  try {
    const leaveModule = await import('../api/leave-requests.ts');
    const mockReq = { method: req.method, query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await leaveModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Leave requests endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database migration endpoint (unified schema)
app.post('/db-migrate', async (req, res) => {
  try {
    const migrateModule = await import('../api/db-migrate.ts');
    const mockReq = { method: 'POST', query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await migrateModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Migration endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Student promotion endpoint (year-end transitions)
app.post('/promote-students', async (req, res) => {
  try {
    const promoteModule = await import('../api/promote-students.ts');
    const mockReq = { method: 'POST', query: req.query, body: req.body, headers: req.headers };
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: (msg) => res.status(code).end(msg)
      }),
      json: (data) => res.json(data),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    await promoteModule.default(mockReq, mockRes);
  } catch (error) {
    console.error('Promotion endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('API Server running on http://localhost:' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('Database: ' + (process.env.DATABASE_URL ? 'PostgreSQL (Docker)' : 'Default connection'));
  console.log('\nAvailable endpoints:');
  console.log('  GET  /health');
  console.log('  ALL  /auth');
  console.log('  ALL  /admin');
  console.log('  ALL  /students');
  console.log('  ALL  /attendance');
  console.log('  ALL  /leave-requests');
  console.log('  POST /db-migrate');
  console.log('  POST /promote-students');
});
