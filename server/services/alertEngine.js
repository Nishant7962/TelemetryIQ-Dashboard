// server/services/alertEngine.js
// Alert threshold engine for TelemetryIQ

import { formatDistanceToNow } from 'date-fns';

const MAX_ALERTS = 50;

/** @type {Array<Object>} in-memory alert store */
const alerts = [];
let nextId = 1;

// ── Threshold Definitions ──────────────────────────────────────────────────

const THRESHOLDS = [
  {
    metric: 'cpu',
    check: (v) => v > 80,
    severity: 'critical',
    message: (v) => `CPU usage exceeded 80% threshold (current: ${v.toFixed(1)}%)`,
  },
  {
    metric: 'memory',
    check: (v) => v > 90,
    severity: 'critical',
    message: (v) => `Memory usage critically high (current: ${v.toFixed(1)}%)`,
  },
  {
    metric: 'memory',
    check: (v) => v > 75 && v <= 90,
    severity: 'warning',
    message: (v) => `Memory usage at ${v.toFixed(1)}% — approaching limit`,
  },
  {
    metric: 'error_rate',
    check: (v) => v > 10,
    severity: 'critical',
    message: (v) => `Error rate critically high at ${v.toFixed(1)}%`,
  },
  {
    metric: 'error_rate',
    check: (v) => v > 5 && v <= 10,
    severity: 'critical',
    message: (v) => `Error rate exceeded 5% threshold (current: ${v.toFixed(1)}%)`,
  },
  {
    metric: 'response_time',
    check: (v) => v > 800,
    severity: 'critical',
    message: (v) => `Response time critically slow at ${v.toFixed(0)}ms`,
  },
  {
    metric: 'response_time',
    check: (v) => v > 500 && v <= 800,
    severity: 'warning',
    message: (v) => `Response time exceeded 500ms threshold (current: ${v.toFixed(0)}ms)`,
  },
  {
    metric: 'uptime',
    check: (v) => v < 99,
    severity: 'warning',
    message: (v) => `Uptime dropped below 99% (current: ${v.toFixed(2)}%)`,
  },
];

// ── Resolution thresholds: metric is back to "safe" ────────────────────────

const RESOLUTION_SAFE = {
  cpu: (v) => v <= 75,
  memory: (v) => v <= 70,
  error_rate: (v) => v <= 4,
  response_time: (v) => v <= 450,
  uptime: (v) => v >= 99.5,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function hasActiveAlertForMetric(metricName) {
  return alerts.some(
    (a) => a.metric === metricName && a.status === 'active'
  );
}

function relativeTime(isoString) {
  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true });
  } catch {
    return 'just now';
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Checks all thresholds against incoming metric data.
 * Creates new alerts only if no active alert already exists for that metric.
 * @param {Object} metricEntry - processed entry from metricsStore
 * @returns {Array} newly created alerts
 */
export function checkAndGenerate(metricEntry) {
  const newAlerts = [];

  for (const threshold of THRESHOLDS) {
    const metricObj = metricEntry[threshold.metric];
    if (!metricObj) continue;

    const value = metricObj.value;

    if (threshold.check(value) && !hasActiveAlertForMetric(threshold.metric)) {
      const now = new Date().toISOString();
      const alert = {
        id: nextId++,
        message: threshold.message(value),
        severity: threshold.severity,
        timestamp: now,
        relative_time: 'just now',
        status: 'active',
        metric: threshold.metric,
      };

      if (alerts.length >= MAX_ALERTS) alerts.shift();
      alerts.push(alert);
      newAlerts.push(alert);
    }
  }

  return newAlerts;
}

/**
 * Returns filtered alerts.
 * @param {'active'|'resolved'|'dismissed'|'all'} status
 * @param {number} limit
 */
export function getAlerts(status = 'active', limit = 10) {
  updateRelativeTimes();
  const filtered =
    status === 'all'
      ? alerts
      : alerts.filter((a) => a.status === status);

  return filtered.slice(-limit).reverse();
}

/**
 * Dismisses an alert by id.
 * @param {number} id
 * @returns {{ id, status }|null}
 */
export function dismissAlert(id) {
  const alert = alerts.find((a) => a.id === id);
  if (!alert) return null;
  alert.status = 'dismissed';
  return { id: alert.id, status: 'dismissed' };
}

/**
 * Auto-resolves the active alert for a given metric when values return to safe range.
 * @param {string} metricName
 * @param {number} currentValue
 * @returns {{ id, status }|null} resolved alert or null
 */
export function resolveAlert(metricName, currentValue) {
  const safeFn = RESOLUTION_SAFE[metricName];
  if (!safeFn || !safeFn(currentValue)) return null;

  const alert = alerts.find(
    (a) => a.metric === metricName && a.status === 'active'
  );
  if (!alert) return null;

  alert.status = 'resolved';
  return { id: alert.id, status: 'resolved' };
}

/**
 * Refreshes relative_time for all alerts (call every 60 seconds).
 */
export function updateRelativeTimes() {
  for (const alert of alerts) {
    alert.relative_time = relativeTime(alert.timestamp);
  }
}
