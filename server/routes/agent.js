// server/routes/agent.js
import { Router } from 'express';
import * as metricsStore from '../services/metricsStore.js';

const router = Router();

const POST_FREQUENCY_SECONDS = 5;
const CONNECTION_TIMEOUT_MS = 10000; // 10 seconds

// ── GET /api/agent/status ──────────────────────────────────────────────────

router.get('/status', (req, res) => {
  const stats = metricsStore.getAgentStats();

  const isConnected =
    stats.lastPingMs !== null && stats.lastPingMs <= CONNECTION_TIMEOUT_MS;

  return res.json({
    connection_status: isConnected ? 'connected' : 'disconnected',
    last_ping_ms: stats.lastPingMs ?? null,
    post_frequency_seconds: POST_FREQUENCY_SECONDS,
    agent_version: 'v2.4.1',
    data_points_collected: stats.dataPointsCollected,
  });
});

export default router;
