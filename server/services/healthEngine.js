// server/services/healthEngine.js
// Calculates overall system health score for TelemetryIQ

/** @type {Object|null} cached last health result */
let lastHealth = null;

// ── Scoring Logic ──────────────────────────────────────────────────────────

/**
 * Calculates system health from the latest metric entry.
 * @param {Object} latestMetric - from metricsStore.getLatest()
 * @returns {{ percentage: number, label: string, components: Object }}
 */
export function calculateHealth(latestMetric) {
  let score = 100;

  const components = {
    cpu: 'healthy',
    memory: 'healthy',
    disk: 'healthy',    // simulated — always healthy
    network: 'healthy', // simulated — always healthy
  };

  // CPU
  const cpu = latestMetric?.cpu?.value ?? 0;
  if (cpu > 90) {
    score -= 25;
    components.cpu = 'critical';
  } else if (cpu > 80) {
    score -= 15;
    components.cpu = 'degraded';
  } else if (cpu > 70) {
    score -= 5;
    components.cpu = 'degraded';
  }

  // Memory
  const memory = latestMetric?.memory?.value ?? 0;
  if (memory > 90) {
    score -= 20;
    components.memory = 'critical';
  } else if (memory > 75) {
    score -= 10;
    components.memory = 'degraded';
  }

  // Error Rate
  const errorRate = latestMetric?.error_rate?.value ?? 0;
  if (errorRate > 10) {
    score -= 25;
  } else if (errorRate > 5) {
    score -= 15;
  }

  // Response Time
  const responseTime = latestMetric?.response_time?.value ?? 0;
  if (responseTime > 500) {
    score -= 10;
  }

  // Uptime
  const uptime = latestMetric?.uptime?.value ?? 100;
  if (uptime < 99) {
    score -= 20;
  } else if (uptime < 99.5) {
    score -= 5;
  }

  // Clamp between 0 and 100
  score = Math.max(0, Math.min(100, score));

  const label =
    score >= 80 ? 'Healthy' : score >= 50 ? 'Degraded' : 'Critical';

  const health = {
    percentage: Math.round(score),
    label,
    components,
  };

  lastHealth = health;
  return health;
}

/**
 * Returns the cached health result from the last calculation.
 * @returns {Object|null}
 */
export function getLastHealth() {
  return lastHealth;
}
