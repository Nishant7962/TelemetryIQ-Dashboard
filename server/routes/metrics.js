// server/routes/metrics.js
import { Router } from 'express';
import * as metricsStore from '../services/metricsStore.js';
import * as alertEngine from '../services/alertEngine.js';
import * as healthEngine from '../services/healthEngine.js';
import * as emitter from '../socket/emitter.js';

const router = Router();

const VALID_METRICS = ['cpu', 'memory', 'uptime', 'response_time', 'error_rate'];

// ── POST /api/metrics ──────────────────────────────────────────────────────
// Called by the telemetry agent every 5 seconds.

router.post('/', async (req, res) => {
  try {
    const { cpu, memory, uptime, response_time, error_rate, agent_version } = req.body;

    // Validation: all numeric fields must be present and valid numbers
    const numericFields = { cpu, memory, uptime, response_time, error_rate };
    for (const [key, val] of Object.entries(numericFields)) {
      if (val === undefined || val === null || typeof val !== 'number' || isNaN(val)) {
        return res.status(400).json({
          error: `Validation failed: "${key}" must be a valid number`,
        });
      }
    }

    // Store metric
    const metricEntry = metricsStore.addMetric(req.body);

    // Calculate health
    const healthResult = healthEngine.calculateHealth(metricEntry);

    // Check and generate alerts
    const newAlerts = alertEngine.checkAndGenerate(metricEntry);

    // Auto-resolve alerts for metrics that returned to safe range
    const resolvedAlerts = [];
    for (const metric of VALID_METRICS) {
      const val = metricEntry[metric]?.value;
      if (val !== undefined) {
        const resolved = alertEngine.resolveAlert(metric, val);
        if (resolved) {
          resolvedAlerts.push(resolved);
          emitter.emitResolvedAlert(resolved.id);
        }
      }
    }

    // Emit Socket.io events
    emitter.emitMetricUpdate(metricEntry, healthResult);
    emitter.emitAgentPing({ agent_version });

    for (const alert of newAlerts) {
      emitter.emitNewAlert(alert);
    }

    return res.status(201).json({
      success: true,
      alerts: newAlerts,
      resolved: resolvedAlerts,
    });
  } catch (err) {
    console.error('[POST /api/metrics] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/metrics/current ───────────────────────────────────────────────

router.get('/current', (req, res) => {
  const latest = metricsStore.getLatest();
  if (!latest) {
    return res.status(404).json({ error: 'No metric data available yet' });
  }

  const { cpu, memory, uptime, response_time, error_rate } = latest;
  return res.json({ cpu, memory, uptime, response_time, error_rate });
});

// ── GET /api/metrics/history ───────────────────────────────────────────────

router.get('/history', (req, res) => {
  const { metric, limit = '20', interval = '10' } = req.query;

  if (!metric || !VALID_METRICS.includes(metric)) {
    return res.status(400).json({
      error: `"metric" query param is required. Valid values: ${VALID_METRICS.join(', ')}`,
    });
  }

  const parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ error: '"limit" must be a positive integer' });
  }

  const history = metricsStore.getHistory(metric, parsedLimit);
  return res.json(history);
});

export default router;
