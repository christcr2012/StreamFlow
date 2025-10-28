/**
 * Worker server entry point
 * Starts BullMQ workers and optional health/metrics endpoint
 */

import http from 'http';
import { validateEnv, env } from './env.js';
import { registerQueues, closeQueues } from './processors.js';

// Validate environment
validateEnv();

// Register all queues and workers
registerQueues();

// Health check endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ts: Date.now() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(env.PORT, () => {
  console.log(`[server] Worker listening on port ${env.PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[server] SIGTERM received, shutting down gracefully...');
  server.close();
  await closeQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[server] SIGINT received, shutting down gracefully...');
  server.close();
  await closeQueues();
  process.exit(0);
});

