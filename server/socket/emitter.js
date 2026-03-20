// server/socket/emitter.js
// Socket.io event emitter for TelemetryIQ

/** @type {import('socket.io').Server|null} */
let io = null;

function timestamp() {
  return new Date().toISOString();
}

function log(event, payload) {
  const preview = JSON.stringify(payload).slice(0, 120);
  console.log(`[${timestamp()}] ⚡ emit ${event} → ${preview}`);
}

// ── Init ───────────────────────────────────────────────────────────────────

/**
 * Stores the Socket.io server instance for later use.
 * @param {import('socket.io').Server} ioInstance
 */
export function init(ioInstance) {
  io = ioInstance;
  console.log(`[${timestamp()}] Socket.io emitter initialized`);
}

// ── Emitters ───────────────────────────────────────────────────────────────

/**
 * Emits all real-time metric events at once:
 *   - metrics:update
 *   - chart:response_time
 *   - chart:error_rate
 *   - health:update
 *
 * @param {Object} metricEntry  - processed entry from metricsStore
 * @param {Object} healthResult - from healthEngine.calculateHealth()
 */
export function emitMetricUpdate(metricEntry, healthResult) {
  if (!io) return;

  // Full snapshot — same shape as GET /api/metrics/current
  const snapshot = {
    cpu:           metricEntry.cpu,
    memory:        metricEntry.memory,
    uptime:        metricEntry.uptime,
    response_time: metricEntry.response_time,
    error_rate:    metricEntry.error_rate,
  };

  io.emit('metrics:update', snapshot);
  log('metrics:update', snapshot);

  // Chart points
  const rtPoint = { time: metricEntry.time, value: metricEntry.response_time.value };
  io.emit('chart:response_time', rtPoint);
  log('chart:response_time', rtPoint);

  const erPoint = { time: metricEntry.time, value: metricEntry.error_rate.value };
  io.emit('chart:error_rate', erPoint);
  log('chart:error_rate', erPoint);

  // Health
  if (healthResult) {
    const healthPayload = { percentage: healthResult.percentage, label: healthResult.label };
    io.emit('health:update', healthPayload);
    log('health:update', healthPayload);
  }
}

/**
 * Emits a new alert event.
 * @param {Object} alert
 */
export function emitNewAlert(alert) {
  if (!io) return;
  io.emit('alert:new', alert);
  log('alert:new', alert);
}

/**
 * Emits an alert resolved event.
 * @param {number} id
 */
export function emitResolvedAlert(id) {
  if (!io) return;
  const payload = { id, status: 'resolved' };
  io.emit('alert:resolved', payload);
  log('alert:resolved', payload);
}

/**
 * Emits an agent ping event.
 * @param {{ agent_version: string }} pingData
 */
export function emitAgentPing(pingData) {
  if (!io) return;
  const payload = {
    timestamp: timestamp(),
    agent_version: pingData.agent_version ?? 'v2.4.1',
  };
  io.emit('agent:ping', payload);
  log('agent:ping', payload);
}
