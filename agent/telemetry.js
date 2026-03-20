// agent/telemetry.js
// TelemetryIQ Monitoring Agent — posts realistic metrics every 5 seconds

import 'dotenv/config';
import axios from 'axios';

const SERVER_URL       = process.env.SERVER_URL       || 'http://localhost:4000';
const POST_INTERVAL_MS = parseInt(process.env.POST_INTERVAL_MS || '5000', 10);
const AGENT_VERSION    = process.env.AGENT_VERSION    || 'v2.4.1';
const ENDPOINT         = `${SERVER_URL}/api/metrics`;

let totalDataPoints = 0;
let tick = 0; // increments every interval, drives sine waves

// ── State for gradual / correlated drift ───────────────────────────────────

let uptimeCounter = 99.99; // slowly decays, resets at 99.0

// ── Realistic Simulation Helpers ───────────────────────────────────────────

/** Clamp a value between min and max. */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Gaussian noise approximation via Box-Muller. */
function noise(stddev = 1) {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stddev;
}

/**
 * Generates one set of correlated metrics.
 */
function generateMetrics() {
  tick++;

  // ── CPU: sine wave (period ~120 ticks ≈ 10 min) + noise + occasional spike
  const cpuBase = 60 + 20 * Math.sin((tick / 120) * 2 * Math.PI);
  const cpuSpike = Math.random() < 0.1 ? 20 + Math.random() * 15 : 0; // 10% chance of spike
  const cpu = clamp(cpuBase + noise(4) + cpuSpike, 25, 98);

  // ── Memory: slower sine wave + gradual drift
  const memBase = 65 + 15 * Math.sin((tick / 200) * 2 * Math.PI);
  const memory = clamp(memBase + noise(3), 45, 90);

  // ── Uptime: slow decay, resets at 99.0
  uptimeCounter -= 0.001 + Math.random() * 0.002; // ~0.001–0.003 per tick
  if (uptimeCounter < 99.0) uptimeCounter = 99.99;
  const uptime = parseFloat(uptimeCounter.toFixed(4));

  // ── Response Time: correlated with CPU (higher CPU → slower response)
  const rtBase = 100 + (cpu - 40) * 4; // linear correlation
  const rtSpike = Math.random() < 0.08 ? 300 + Math.random() * 300 : 0; // 8% spike chance
  const response_time = clamp(Math.round(rtBase + noise(30) + rtSpike), 80, 900);

  // ── Error Rate: correlated with response_time spikes
  const erBase = response_time > 500 ? 6 + Math.random() * 6 : 1 + Math.random() * 3;
  const erSpike = Math.random() < 0.05 ? 5 + Math.random() * 7 : 0; // 5% spike chance
  const error_rate = clamp(parseFloat((erBase + noise(1) + erSpike).toFixed(2)), 0, 20);

  return { cpu: parseFloat(cpu.toFixed(2)), memory: parseFloat(memory.toFixed(2)), uptime, response_time, error_rate, agent_version: AGENT_VERSION };
}

// ── POST Logic ─────────────────────────────────────────────────────────────

function formatTime(date) {
  return date.toTimeString().split(' ')[0];
}

async function postMetrics() {
  const metrics = generateMetrics();
  const now = new Date();

  try {
    await axios.post(ENDPOINT, metrics, {
      timeout: 4000,
      headers: { 'Content-Type': 'application/json' },
    });

    totalDataPoints++;
    const { cpu, memory, response_time, error_rate, uptime } = metrics;
    console.log(
      `[${formatTime(now)}] POST /api/metrics → CPU: ${cpu}% | MEM: ${memory}% | RT: ${response_time}ms | ERR: ${error_rate}% | UP: ${uptime}%`
    );
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ERR_NETWORK') {
      console.warn(`[${formatTime(now)}] ⚠  Connection refused — retrying in ${POST_INTERVAL_MS / 1000}s...`);
    } else {
      console.error(`[${formatTime(now)}] ✗ POST failed: ${err.message}`);
    }
  }
}

// ── Start ──────────────────────────────────────────────────────────────────

console.log(`\n🤖 TelemetryIQ Agent started`);
console.log(`   Server : ${SERVER_URL}`);
console.log(`   Version: ${AGENT_VERSION}`);
console.log(`   Interval: ${POST_INTERVAL_MS}ms\n`);

// First POST immediately, then on interval
postMetrics();
setInterval(postMetrics, POST_INTERVAL_MS);
