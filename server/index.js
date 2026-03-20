// server/index.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import metricsRouter from './routes/metrics.js';
import alertsRouter  from './routes/alerts.js';
import healthRouter  from './routes/health.js';
import agentRouter   from './routes/agent.js';
import * as emitter  from './socket/emitter.js';
import * as alertEngine from './services/alertEngine.js';

const PORT = process.env.PORT || 4000;
const ALERT_INTERVAL_MS = parseInt(process.env.ALERT_INTERVAL_MS || '60000', 10);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

// ── Express Setup ──────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// ── Mount Routes ───────────────────────────────────────────────────────────

app.use('/api/metrics', metricsRouter);
app.use('/api/alerts',  alertsRouter);
app.use('/api/health',  healthRouter);
app.use('/api/agent',   agentRouter);

// Health-check ping
app.get('/ping', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Global Error Handler ───────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── HTTP + Socket.io Server ────────────────────────────────────────────────

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach emitter
emitter.init(io);

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] 🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] 🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Background Jobs ────────────────────────────────────────────────────────

// Refresh relative times on all alerts periodically
setInterval(() => {
  alertEngine.updateRelativeTimes();
}, ALERT_INTERVAL_MS);

// ── Start ──────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n🚀 TelemetryIQ Server running on port ${PORT}`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`⚡ Socket.io ready\n`);
});
