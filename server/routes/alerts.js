// server/routes/alerts.js
import { Router } from 'express';
import * as alertEngine from '../services/alertEngine.js';

const router = Router();

// ── GET /api/alerts ────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const { status = 'active', limit = '10' } = req.query;

  const validStatuses = ['active', 'resolved', 'dismissed', 'all'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `"status" must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ error: '"limit" must be a positive integer' });
  }

  const alerts = alertEngine.getAlerts(status, parsedLimit);
  return res.json(alerts);
});

// ── PATCH /api/alerts/:id/dismiss ─────────────────────────────────────────

router.patch('/:id/dismiss', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid alert id' });
  }

  const result = alertEngine.dismissAlert(id);
  if (!result) {
    return res.status(404).json({ error: `Alert with id ${id} not found` });
  }

  return res.json(result);
});

export default router;
