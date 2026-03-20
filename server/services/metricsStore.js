// server/services/metricsStore.js
// In-memory ring buffer for TelemetryIQ metrics

const MAX_ENTRIES = 50;

/** @type {Array<Object>} ring buffer of processed metric entries */
const buffer = [];

let totalDataPoints = 0;
let lastPingTime = null; // Date object

// ── Helpers ────────────────────────────────────────────────────────────────

function getStatus(metric, value) {
  switch (metric) {
    case 'cpu':           return value > 80   ? 'Critical' : 'Healthy';
    case 'memory':        return value > 75   ? 'Critical' : 'Healthy';
    case 'response_time': return value > 500  ? 'Critical' : 'Healthy';
    case 'error_rate':    return value > 5    ? 'Critical' : 'Healthy';
    case 'uptime':        return value < 99   ? 'Critical' : 'Healthy';
    default:              return 'Healthy';
  }
}

function getTrend(metric, current) {
  if (buffer.length === 0) return 'up';
  const prev = buffer[buffer.length - 1];
  const prevVal = prev[metric]?.value ?? 0;
  return current >= prevVal ? 'up' : 'down';
}

/**
 * Returns the last `n` values for a given metric name from the buffer.
 * @param {string} metric
 * @param {number} n
 * @returns {number[]}
 */
function buildSparkline(metric, n = 5) {
  const source = buffer.slice(-n);
  return source.map((entry) => entry[metric]?.value ?? 0);
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Process raw agent data and store in ring buffer.
 * @param {{ cpu, memory, uptime, response_time, error_rate, agent_version }} rawData
 * @returns {Object} the processed metric entry
 */
export function addMetric(rawData) {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // "HH:MM:SS"

  // Build sparklines first (before push), appending current raw value at end
  const makeSparkline = (key, current) => {
    const history = buildSparkline(key, 4); // last 4 stored values
    return [...history, current];
  };

  const entry = {
    timestamp: now.toISOString(),
    time,
    cpu: {
      value: rawData.cpu,
      unit: '%',
      trend: getTrend('cpu', rawData.cpu),
      status: getStatus('cpu', rawData.cpu),
      sparkline: makeSparkline('cpu', rawData.cpu),
    },
    memory: {
      value: rawData.memory,
      unit: '%',
      trend: getTrend('memory', rawData.memory),
      status: getStatus('memory', rawData.memory),
      sparkline: makeSparkline('memory', rawData.memory),
    },
    uptime: {
      value: rawData.uptime,
      unit: '%',
      trend: getTrend('uptime', rawData.uptime),
      status: getStatus('uptime', rawData.uptime),
      sparkline: makeSparkline('uptime', rawData.uptime),
    },
    response_time: {
      value: rawData.response_time,
      unit: 'ms',
      trend: getTrend('response_time', rawData.response_time),
      status: getStatus('response_time', rawData.response_time),
      sparkline: makeSparkline('response_time', rawData.response_time),
    },
    error_rate: {
      value: rawData.error_rate,
      unit: '%',
      trend: getTrend('error_rate', rawData.error_rate),
      status: getStatus('error_rate', rawData.error_rate),
      sparkline: makeSparkline('error_rate', rawData.error_rate),
    },
    agent_version: rawData.agent_version ?? 'v2.4.1',
  };

  if (buffer.length >= MAX_ENTRIES) buffer.shift();
  buffer.push(entry);

  totalDataPoints++;
  lastPingTime = now;

  return entry;
}

/**
 * Returns the most recent metric entry, or null if buffer is empty.
 */
export function getLatest() {
  return buffer.length > 0 ? buffer[buffer.length - 1] : null;
}

/**
 * Returns array of { time, value } for charting.
 * @param {string} metric
 * @param {number} limit
 */
export function getHistory(metric, limit = 20) {
  return buffer.slice(-limit).map((entry) => ({
    time: entry.time,
    value: entry[metric]?.value ?? 0,
  }));
}

/**
 * Returns the full ring buffer.
 */
export function getAllMetrics() {
  return [...buffer];
}

/**
 * Returns agent runtime statistics.
 */
export function getAgentStats() {
  const lastPingMs = lastPingTime
    ? Date.now() - lastPingTime.getTime()
    : null;

  return {
    dataPointsCollected: totalDataPoints,
    lastPingMs,
    lastPingTime: lastPingTime?.toISOString() ?? null,
  };
}
