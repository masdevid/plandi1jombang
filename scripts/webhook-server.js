#!/usr/bin/env node

/**
 * Simple webhook server for GitHub push events
 * Listens for GitHub webhooks and triggers deployment script
 *
 * Usage:
 *   node webhook-server.js
 *
 * Environment variables:
 *   WEBHOOK_PORT - Port to listen on (default: 9000)
 *   WEBHOOK_SECRET - GitHub webhook secret for validation
 *   DEPLOY_SCRIPT - Path to deployment script (default: ./deploy.sh)
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/opt/sd-plandi/scripts/deploy.sh';

// Validate GitHub webhook signature
function validateSignature(payload, signature) {
  if (!SECRET) {
    console.warn('⚠️  WEBHOOK_SECRET not set - skipping signature validation');
    return true;
  }

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Execute deployment script
async function deploy() {
  console.log('🚀 Starting deployment...');

  try {
    const { stdout, stderr } = await execAsync(`sudo bash ${DEPLOY_SCRIPT}`);

    if (stdout) console.log('📋 Deployment output:\n', stdout);
    if (stderr) console.error('⚠️  Deployment warnings:\n', stderr);

    console.log('✅ Deployment completed successfully');
    return { success: true, output: stdout };
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'webhook-server' }));
    return;
  }

  // Webhook endpoint
  if (req.url === '/webhook' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Validate signature
        const signature = req.headers['x-hub-signature-256'] || '';
        if (!validateSignature(body, signature)) {
          console.error('❌ Invalid webhook signature');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid signature' }));
          return;
        }

        // Parse payload
        const payload = JSON.parse(body);
        const event = req.headers['x-github-event'];

        console.log(`📨 Received ${event} event from GitHub`);

        // Handle push events to main branch
        if (event === 'push') {
          const ref = payload.ref;
          const repo = payload.repository?.full_name;
          const pusher = payload.pusher?.name;
          const commits = payload.commits?.length || 0;

          console.log(`📦 Push to ${ref} in ${repo} by ${pusher} (${commits} commits)`);

          if (ref === 'refs/heads/main' || ref === 'refs/heads/master') {
            console.log('✓ Push to main branch detected, triggering deployment...');

            // Trigger deployment
            const result = await deploy();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: 'Deployment triggered',
              success: result.success,
              timestamp: new Date().toISOString()
            }));
          } else {
            console.log(`ℹ️  Push to ${ref} - no deployment needed`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No deployment needed for this branch' }));
          }
        } else {
          console.log(`ℹ️  Ignoring ${event} event`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Event ${event} ignored` }));
        }
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });

    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, () => {
  console.log('🎣 Webhook server started');
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔒 Secret validation: ${SECRET ? 'enabled' : 'disabled'}`);
  console.log(`📜 Deploy script: ${DEPLOY_SCRIPT}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  POST http://localhost:${PORT}/webhook - GitHub webhook`);
  console.log(`  GET  http://localhost:${PORT}/health  - Health check`);
  console.log('');
  console.log('✓ Ready to receive webhooks');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Shutting down webhook server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📴 Shutting down webhook server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
