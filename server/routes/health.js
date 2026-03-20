// server/routes/health.js
import { Router } from 'express';
import * as metricsStore from '../services/metricsStore.js';
import * as healthEngine from '../services/healthEngine.js';

const router = Router();

const DEFAULT_HEALTH = {
  percentage: 100,
  label: 'Healthy',
  components: {
    cpu: 'healthy',
    memory: 'healthy',
    disk: 'healthy',
    network: 'healthy',
  },
};

// ── GET /api/health ────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const latest = metricsStore.getLatest();

  if (!latest) {
    return res.json(DEFAULT_HEALTH);
  }

  const health = healthEngine.calculateHealth(latest);
  return res.json(health);
});

export default router;
