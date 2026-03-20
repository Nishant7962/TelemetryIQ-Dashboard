# TelemetryIQ Dashboard — Complete Project Storyline

> **Stack:** React (Vite) + Node.js + Express + Socket.io + In-Memory Store
> **Purpose:** A real-time system monitoring dashboard that ingests live telemetry from an agent, processes it server-side, and streams it to the frontend via REST + WebSocket.

---

## 1. The Big Picture — 30-Second Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TelemetryIQ System                          │
│                                                                     │
│  ┌──────────┐   POST /api/metrics   ┌──────────────────────────┐   │
│  │  Agent   │  ──────────────────▶  │   Express Server :4000   │   │
│  │ (Node.js)│      every 5s         │                          │   │
│  └──────────┘                       │  ┌────────────────────┐  │   │
│                                     │  │   metricsStore.js  │  │   │
│                                     │  │   alertEngine.js   │  │   │
│                                     │  │   healthEngine.js  │  │   │
│                                     │  └────────────────────┘  │   │
│                                     │           │               │   │
│                                     │    Socket.io emit         │   │
│                                     └───────────┼───────────────┘   │
│                                                 │                   │
│                                          7 real-time events         │
│                                                 │                   │
│                                     ┌───────────▼───────────────┐  │
│                                     │  React Dashboard :5173    │  │
│                                     │  (Vite + TypeScript)      │  │
│                                     └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

There are **three independent processes** running concurrently:

| Process | Port | Command | Role |
|---|---|---|---|
| **Frontend** | `:5173` | `npm run dev` (root) | React UI |
| **Server** | `:4000` | `npm run dev` (server/) | API + Socket hub |
| **Agent** | — | `npm run dev` (agent/) | Metric simulator/collector |

---

## 2. Act 1 — The Agent: Where Data Is Born

**File:** `agent/telemetry.js`

The agent is a standalone Node.js script that acts as a **synthetic telemetry producer**. Every **5 seconds**, it generates a realistic snapshot of system metrics and POSTs them to the server.

### How Metrics Are Generated (Realistic Simulation)

Rather than pure random numbers, the agent uses **correlated physics**:

```
CPU       = Sine wave (period ~10 min) + Gaussian noise + 10% chance spike
Memory    = Slower sine wave (period ~17 min) + Gaussian noise
Uptime    = Slowly decays 0.001–0.003% per tick → resets at 99.0%
Response  = Correlated with CPU: rtBase = 100 + (cpu - 40) × 4
Time        + 8% chance of a 300–600ms spike
Error Rate = Correlated with response time:
               if RT > 500ms → base = 6–12%
               else           → base = 1–4%
             + 5% chance of a 5–12% spike
```

This means:
- When CPU spikes → Response Time also climbs
- When Response Time is high → Error Rate follows
- Uptime gently decays like a real system

### The POST Payload

Every 5 seconds, this JSON hits `POST http://localhost:4000/api/metrics`:

```json
{
  "cpu":           87.32,
  "memory":        64.10,
  "uptime":        99.9780,
  "response_time": 342,
  "error_rate":    7.21,
  "agent_version": "v2.4.1"
}
```

### Console Output (per tick)

```
[12:20:15] POST /api/metrics → CPU: 87.3% | MEM: 64.1% | RT: 342ms | ERR: 7.2% | UP: 99.98%
```

### Retry Logic

If the server is down (ECONNREFUSED), the agent logs a warning and retries on the next tick — it never crashes.

---

## 3. Act 2 — The Server: The Brain

**Folder:** `server/`

The server is an **Express + Socket.io** application that receives raw metrics from the agent and does three things:

1. **Stores** them in an in-memory ring buffer
2. **Analyses** them through the alert and health engines
3. **Broadcasts** the results to all connected browser clients in real-time

### 3a. `server/services/metricsStore.js` — Memory & History

This is the **single source of truth** for all metric data.

```
Ring Buffer (max 50 entries)
┌──────────────────────────────────────────────────────┐
│ Entry 1 │ Entry 2 │ ... │ Entry 50 (oldest → newest) │
└──────────────────────────────────────────────────────┘
     ▲ When full, oldest entry is evicted (shift)
```

**For every incoming raw value, it computes:**

| Field | Description |
|---|---|
| `value` | Raw number from agent |
| `unit` | `%` or `ms` |
| `trend` | `"up"` or `"down"` vs previous entry |
| `status` | `"Healthy"` or `"Critical"` per threshold |
| `sparkline` | Last 5 values (for mini sparkline charts) |

**Status thresholds:**

| Metric | Critical if |
|---|---|
| CPU | > 80% |
| Memory | > 75% |
| Response Time | > 500ms |
| Error Rate | > 5% |
| Uptime | < 99% |

**Exported methods:**

```js
addMetric(rawData)           // process + store
getLatest()                  // most recent entry
getHistory(metric, limit)    // [{time, value}] for charts
getAllMetrics()               // full buffer
getAgentStats()              // { dataPointsCollected, lastPingMs }
```

---

### 3b. `server/services/alertEngine.js` — Alert Intelligence

Every time metrics are stored, the alert engine **scans all thresholds**:

```
Incoming metric data
        │
        ▼
  Is any threshold breached? ──No──▶ Done
        │
       Yes
        │
        ▼
  Is there already an active alert for this metric? ──Yes──▶ Skip
        │
       No
        │
        ▼
  Create new alert → add to store → return to caller
```

**Threshold definitions:**

| Metric | Condition | Severity |
|---|---|---|
| CPU | > 80% | `critical` |
| Memory | > 75% and ≤ 90% | `warning` |
| Memory | > 90% | `critical` |
| Response Time | > 500ms and ≤ 800ms | `warning` |
| Response Time | > 800ms | `critical` |
| Error Rate | > 5% and ≤ 10% | `critical` |
| Error Rate | > 10% | `critical` (escalated) |
| Uptime | < 99% | `warning` |

**Each alert object:**

```json
{
  "id": 7,
  "message": "CPU usage exceeded 80% threshold (current: 87.3%)",
  "severity": "critical",
  "timestamp": "2026-03-19T06:41:08.000Z",
  "relative_time": "2 minutes ago",
  "status": "active",
  "metric": "cpu"
}
```

**Auto-resolution:** When a metric returns to safe range (e.g. CPU drops below 75%), the engine auto-resolves the alert and emits `alert:resolved` via Socket.io.

**Duplicate guard:** Only one active alert per metric at a time — prevents alert storms.

---

### 3c. `server/services/healthEngine.js` — Health Score Calculator

Computes a **single health percentage (0–100)** using a penalty system:

```
Start: 100 points

CPU > 90%          → -25 pts, component = "critical"
CPU > 80%          → -15 pts, component = "degraded"
CPU > 70%          → -5 pts,  component = "degraded"
Memory > 90%       → -20 pts, component = "critical"
Memory > 75%       → -10 pts, component = "degraded"
Error Rate > 10%   → -25 pts
Error Rate > 5%    → -15 pts
Response Time > 500ms → -10 pts
Uptime < 99%       → -20 pts
Uptime < 99.5%     → -5 pts
disk / network     → always "healthy" (simulated)
```

**Label mapping:**

| Score | Label |
|---|---|
| ≥ 80 | `Healthy` |
| ≥ 50 | `Degraded` |
| < 50 | `Critical` |

---

### 3d. `server/routes/metrics.js` — The Pipeline Entry Point

The `POST /api/metrics` handler is the **orchestrator** — it coordinates all services:

```
Agent POSTs raw data
          │
          ▼
    metricsStore.addMetric()
          │
          ▼
    healthEngine.calculateHealth()
          │
          ▼
    alertEngine.checkAndGenerate()
          │
          ▼
    alertEngine.resolveAlert() × 5 metrics
          │
          ├──▶ emitter.emitMetricUpdate()   → metrics:update
          │                                 → chart:response_time
          │                                 → chart:error_rate
          │                                 → health:update
          │
          ├──▶ emitter.emitAgentPing()      → agent:ping
          │
          └──▶ emitter.emitNewAlert() × N   → alert:new  (if new alerts)
               emitter.emitResolvedAlert()  → alert:resolved (if resolved)
```

**Response to agent:**
```json
{ "success": true, "alerts": [/* new alerts */], "resolved": [/* resolved */] }
```

---

### 3e. `server/socket/emitter.js` — The Broadcaster

Holds a reference to the Socket.io `io` instance and emits typed events to **all connected browser clients**:

| Event | Payload | Consumed by |
|---|---|---|
| `metrics:update` | Full metric snapshot (5 metrics) | MetricCard × 5 |
| `chart:response_time` | `{ time, value }` | ResponseTimeChart |
| `chart:error_rate` | `{ time, value }` | ErrorRateChart |
| `health:update` | `{ percentage, label }` | SystemHealth |
| `alert:new` | Full alert object | ActiveAlerts, AlertBanner |
| `alert:resolved` | `{ id, status }` | ActiveAlerts |
| `agent:ping` | `{ timestamp, agent_version }` | AgentStatus |

---

## 4. Act 3 — The REST API: On-Demand Data

Beyond the real-time stream, the frontend can also query data at any time via REST:

```
GET  /api/metrics/current          → Latest metric snapshot
GET  /api/metrics/history?metric=X → Time-series for charts
GET  /api/health                   → System health score
GET  /api/alerts?status=active     → Active alert list
PATCH /api/alerts/:id/dismiss      → Dismiss an alert
GET  /api/agent/status             → Agent connection info
```

These are used **on initial page load** before any Socket.io events arrive.

---

## 5. Act 4 — The Frontend: Bringing It to Life

**Folder:** `src/app/`

### Layer Architecture

```
AppContent.tsx  (Shell — composed view)
      │
      ▼  uses
useDashboard.ts (Custom Hook — all state lives here)
      │
      ├── apiService.ts   (REST fetch wrappers)
      └── socketService.ts (Socket.io singleton + typed subscriptions)
```

### 5a. `socketService.ts` — Socket.io Singleton

Creates exactly **one** socket connection, shared across the app:

```ts
const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});
```

Exports typed subscription helpers that return cleanup functions:

```ts
onMetricsUpdate(cb)       → unsubscribe()
onChartResponseTime(cb)   → unsubscribe()
onChartErrorRate(cb)      → unsubscribe()
onAlertNew(cb)            → unsubscribe()
onAlertResolved(cb)       → unsubscribe()
onAgentPing(cb)           → unsubscribe()
onHealthUpdate(cb)        → unsubscribe()
```

These are used inside `useDashboard.ts` within a `useEffect` cleanup pattern.

---

### 5b. `apiService.ts` — REST Layer

Thin typed wrappers around `fetch()`:

```ts
fetchCurrentMetrics()           → MetricsSnapshot
fetchMetricHistory(metric, n)   → ChartPoint[]
fetchHealth()                   → HealthData
fetchAlerts(status, limit)      → AlertData[]
dismissAlert(id)                → { id, status }
fetchAgentStatus()              → AgentStatusData
```

All use a shared `apiFetch<T>()` helper that throws on non-OK responses.

---

### 5c. `useDashboard.ts` — Central Data Hook

This is the **heart of the frontend**. It manages all dashboard state in one place:

#### Phase 1: Initial REST Load (on mount)

```ts
Promise.allSettled([
  fetchCurrentMetrics(),
  fetchMetricHistory('response_time', 20),
  fetchMetricHistory('error_rate', 20),
  fetchHealth(),
  fetchAlerts('active', 10),
  fetchAgentStatus(),
])
```

Uses `Promise.allSettled` so that **partial failures don't break the whole page** — if the agent hasn't posted yet and `/api/metrics/current` returns 404, the rest of the UI still loads.

#### Phase 2: Real-Time Subscriptions (Socket.io)

After the initial load, all 7 Socket.io events are subscribed to:

```
metrics:update      →  setMetrics(data)
chart:response_time →  setResponseTimeData(prev → [...prev.slice(-19), newPoint])
chart:error_rate    →  setErrorRateData(prev → [...prev.slice(-19), newPoint])
health:update       →  setHealth(prev → {...prev, percentage, label})
alert:new           →  setAlerts(prev → [newAlert, ...prev].slice(0, 10))
alert:resolved      →  setAlerts(prev → prev.filter(a => a.id !== resolvedId))
agent:ping          →  setLastPingTimestamp + re-fetch agent status
```

All cleanup functions run on component unmount.

#### Exposed State

```ts
{
  metrics,            // MetricsSnapshot | null
  responseTimeData,   // { id, time, value }[]
  errorRateData,      // { id, time, value }[]
  health,             // HealthData | null
  alerts,             // AlertData[]
  agentStatus,        // AgentStatusData | null
  lastPingTimestamp,  // string | null
  socketConnected,    // boolean (real socket state)
  loading,            // boolean
  error,              // string | null
  dismissAlert,       // (id: number) => Promise<void>
}
```

---

### 5d. Component Map — What Each Shows

```
AppContent.tsx
├── Navbar.tsx
│     socketConnected prop → shows green "LIVE" or amber "CONNECTING"
│
├── AlertBanner.tsx
│     message ← most recent critical active alert from useDashboard
│     onDismiss ← calls PATCH /api/alerts/:id/dismiss
│
├── MetricCard.tsx × 5
│     value, trend, status, sparklineData ← metrics from Socket.io
│     CPU / Memory / Uptime / Response Time / Error Rate
│
├── ResponseTimeChart.tsx
│     data ← REST history on load, appended via chart:response_time event
│
├── ErrorRateChart.tsx
│     data ← REST history on load, appended via chart:error_rate event
│
├── SystemHealth.tsx
│     percentage, label ← health:update Socket.io event
│     Arc color: purple (Healthy) / amber (Degraded) / red (Critical)
│
├── ActiveAlerts.tsx
│     alerts ← REST on load, then alert:new / alert:resolved live
│     onDismiss ← hover to reveal ✕ button → PATCH /api/alerts/:id/dismiss
│
└── AgentStatus.tsx
      status ← GET /api/agent/status (re-fetched on every agent:ping)
      lastPingTimestamp ← agent:ping Socket.io event
```

---

## 6. Complete Data Flow — Tick by Tick

Here is the **exact sequence** of events every 5 seconds:

```
t=0s
  Agent generates metrics
  → CPU: 87.3%, MEM: 64.1%, RT: 342ms, ERR: 7.2%, UP: 99.98%

t=0s + network latency
  POST /api/metrics → Express server receives raw payload

t=0s + 1ms
  metricsStore.addMetric(rawData)
    → Computes trend (up/down vs previous)
    → Computes status (Healthy/Critical per threshold)
    → Builds 5-point sparkline per metric
    → Pushes entry to ring buffer (max 50)
    → Updates lastPingTime, increments totalDataPoints

t=0s + 2ms
  healthEngine.calculateHealth(latestMetric)
    → CPU 87.3% > 80% → -15 pts, cpu = "degraded"
    → ERR 7.2% > 5% → -15 pts
    → Score: 100 - 15 - 15 = 70 → label = "Degraded"

t=0s + 3ms
  alertEngine.checkAndGenerate(metricEntry)
    → CPU > 80% AND no active cpu alert → CREATE alert #7
    → ERR > 5% AND no active error_rate alert → CREATE alert #8
    → Returns [alert7, alert8]

  alertEngine.resolveAlert(metric, value) × 5 metrics
    → All resolved check: memory 64% ≤ 70% → resolve any memory alert
    → RT 342ms ≤ 450ms → resolve any RT alert
    → etc.

t=0s + 4ms  — Socket.io broadcasts to all browser clients:
  emit("metrics:update",      { cpu, memory, uptime, response_time, error_rate })
  emit("chart:response_time", { time: "12:20:15", value: 342 })
  emit("chart:error_rate",    { time: "12:20:15", value: 7.2 })
  emit("health:update",       { percentage: 70, label: "Degraded" })
  emit("agent:ping",          { timestamp: "...", agent_version: "v2.4.1" })
  emit("alert:new",           { id: 7, message: "CPU usage exceeded...", ... })
  emit("alert:new",           { id: 8, message: "Error rate exceeded...", ... })

  ──── simultaneously in every browser tab: ────

  useDashboard:onMetricsUpdate     → setMetrics(snapshot)   → MetricCard re-renders
  useDashboard:onChartResponseTime → append point           → ResponseTimeChart updates
  useDashboard:onChartErrorRate    → append point           → ErrorRateChart updates
  useDashboard:onHealthUpdate      → setHealth(...)         → SystemHealth arc animates
  useDashboard:onAgentPing         → fetch /api/agent/status → AgentStatus updates
  useDashboard:onAlertNew          → prepend to alerts[]    → ActiveAlerts shows new row
                                                            → AlertBanner shows if critical

t=5s — Cycle repeats
```

---

## 7. Edge Cases & Resilience

| Scenario | What Happens |
|---|---|
| Server not running | Frontend shows `WifiOff` error screen with Retry button |
| No data yet | `GET /api/metrics/current` returns 404 → skeleton loaders shown |
| Agent disconnects | `GET /api/agent/status` returns `connection_status: "disconnected"` → AgentStatus shows red dot |
| Same metric breaches threshold repeatedly | Alert engine's _duplicate guard_ prevents duplicate alerts |
| Metric recovers below threshold | `resolveAlert()` removes it — `alert:resolved` Socket.io event removes it from UI |
| Socket.io connection drops | Navbar shows amber `CONNECTING`, auto-reconnects (up to 10 attempts, 2s apart) |
| Browser tab opens after server started | REST initial load populates all existing history + socket subscription starts |

---

## 8. File Reference Map

```
TelemetryIQ Dashboard Design/
│
├── agent/
│   ├── telemetry.js          ← Metric simulator, POST /api/metrics every 5s
│   ├── package.json
│   └── .env                  ← SERVER_URL, POST_INTERVAL_MS, AGENT_VERSION
│
├── server/
│   ├── index.js              ← Express entry, Socket.io setup, route mounting
│   ├── package.json
│   ├── .env                  ← PORT, CLIENT_URL, ALERT_INTERVAL_MS
│   ├── services/
│   │   ├── metricsStore.js   ← Ring buffer, sparkline/trend/status computation
│   │   ├── alertEngine.js    ← Threshold checks, dedup, dismiss, auto-resolve
│   │   └── healthEngine.js   ← 100-point penalty scoring system
│   ├── socket/
│   │   └── emitter.js        ← All 7 Socket.io event emitters
│   └── routes/
│       ├── metrics.js        ← POST + GET /current + GET /history
│       ├── alerts.js         ← GET + PATCH /dismiss
│       ├── health.js         ← GET
│       └── agent.js          ← GET /status
│
└── src/app/
    ├── services/
    │   ├── apiService.ts     ← Typed REST fetch wrappers for all 6 endpoints
    │   └── socketService.ts  ← Socket.io singleton + 7 typed subscriptions
    ├── hooks/
    │   └── useDashboard.ts   ← Central state hook (REST + Socket.io combined)
    └── components/
        ├── AppContent.tsx    ← Dashboard shell, uses useDashboard
        ├── Navbar.tsx        ← Header with real LIVE/CONNECTING indicator
        ├── AlertBanner.tsx   ← Top critical alert banner with live dismiss
        ├── MetricCard.tsx    ← Individual metric card with sparkline
        ├── ResponseTimeChart.tsx ← Line chart, streams via Socket.io
        ├── ErrorRateChart.tsx    ← Bar chart, streams via Socket.io
        ├── SystemHealth.tsx  ← SVG donut gauge with dynamic color & label
        ├── ActiveAlerts.tsx  ← Alert list with hover-dismiss ✕ button
        └── AgentStatus.tsx   ← Real connection status, ping time, data count
```

---

## 9. Running the Project

```bash
# Terminal 1 — Frontend (React + Vite)
cd "TelemetryIQ Dashboard Design"
npm run dev
# → http://localhost:5173

# Terminal 2 — Backend (Express + Socket.io)
cd "TelemetryIQ Dashboard Design/server"
npm run dev
# → http://localhost:4000

# Terminal 3 — Agent (Telemetry Simulator)
cd "TelemetryIQ Dashboard Design/agent"
npm run dev
# → Starts POSTing every 5 seconds
```

### Test the API manually (PowerShell)

```powershell
# Get latest metrics
Invoke-RestMethod http://localhost:4000/api/metrics/current

# Get response time history
Invoke-RestMethod "http://localhost:4000/api/metrics/history?metric=response_time&limit=10"

# Get system health
Invoke-RestMethod http://localhost:4000/api/health

# Get active alerts
Invoke-RestMethod "http://localhost:4000/api/alerts?status=active"

# Dismiss alert id=1
Invoke-RestMethod -Method Patch http://localhost:4000/api/alerts/1/dismiss

# Get agent status
Invoke-RestMethod http://localhost:4000/api/agent/status
```

---

*TelemetryIQ — React + Node.js + Socket.io | Architecture Documentation v1.0*
*Generated: 2026-03-19*
