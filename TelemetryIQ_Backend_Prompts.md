# TelemetryIQ Dashboard — Complete Backend Generation Prompts

> **Purpose:** Copy-paste ready prompts to generate the complete Node.js + Express + Socket.io backend for TelemetryIQ Dashboard.  
> **Stack:** Node.js + Express + Socket.io + ES Modules  
> **Frontend:** React (Next.js/Vite) — already built with hardcoded mock data  
> **Goal:** Replace all mock data with real API + Socket.io real-time events

---

## Generation Order

```
1.  server/index.js
2.  server/services/metricsStore.js
3.  server/services/alertEngine.js
4.  server/services/healthEngine.js
5.  server/socket/emitter.js
6.  server/routes/metrics.js
7.  server/routes/alerts.js
8.  server/routes/health.js
9.  server/routes/agent.js
10. agent/telemetry.js
11. package.json + .env files
```

---

## Folder Structure

```
telemetry-dashboard/
├── server/
│   ├── routes/
│   │   ├── metrics.js
│   │   ├── alerts.js
│   │   ├── health.js
│   │   └── agent.js
│   ├── services/
│   │   ├── metricsStore.js
│   │   ├── alertEngine.js
│   │   └── healthEngine.js
│   ├── socket/
│   │   └── emitter.js
│   ├── index.js
│   └── .env
│
└── agent/
    ├── telemetry.js
    └── .env
```

---

## Quick Reference — Exact Event & Endpoint Names

| What Frontend Expects | Type | File to Generate |
|---|---|---|
| `metrics:update` | Socket.io emit | `emitter.js` |
| `chart:response_time` | Socket.io emit | `emitter.js` |
| `chart:error_rate` | Socket.io emit | `emitter.js` |
| `alert:new` | Socket.io emit | `emitter.js` |
| `alert:resolved` | Socket.io emit | `emitter.js` |
| `agent:ping` | Socket.io emit | `emitter.js` |
| `health:update` | Socket.io emit | `emitter.js` |
| `GET /api/metrics/current` | REST | `routes/metrics.js` |
| `GET /api/metrics/history` | REST | `routes/metrics.js` |
| `POST /api/metrics` | REST | `routes/metrics.js` |
| `GET /api/health` | REST | `routes/health.js` |
| `GET /api/alerts` | REST | `routes/alerts.js` |
| `PATCH /api/alerts/:id/dismiss` | REST | `routes/alerts.js` |
| `GET /api/agent/status` | REST | `routes/agent.js` |

---

## PROMPT 1 — `server/index.js`

```
Generate server/index.js for TelemetryIQ dashboard backend.

Requirements:
- Express server on PORT from .env (default 4000)
- CORS enabled for http://localhost:3000 and
  http://localhost:5173 (Next.js + Vite both)
- Socket.io attached to HTTP server with CORS matching above
- Mount these routes:
    app.use('/api/metrics', metricsRouter)
    app.use('/api/alerts',  alertsRouter)
    app.use('/api/health',  healthRouter)
    app.use('/api/agent',   agentRouter)
- Import and initialize socket emitter with io instance
- dotenv config at top
- Global error handler middleware
- Console log on startup:
    "TelemetryIQ Server running on port 4000"
    "Socket.io ready"
- Use ES Modules (import/export) syntax
```

---

## PROMPT 2 — `server/services/metricsStore.js`

```
Generate server/services/metricsStore.js for TelemetryIQ.

Requirements:
- In-memory ring buffer, max 50 entries
- Each metric entry shape (must match exactly):
  {
    timestamp: ISO string,
    time: "HH:MM:SS" string,
    cpu:           { value, unit: "%", trend, status, sparkline: [] },
    memory:        { value, unit: "%", trend, status, sparkline: [] },
    uptime:        { value, unit: "%", trend, status, sparkline: [] },
    response_time: { value, unit: "ms", trend, status, sparkline: [] },
    error_rate:    { value, unit: "%", trend, status, sparkline: [] }
  }

- Thresholds for status and trend:
    CPU: Critical if > 80, else Healthy
    Memory: Critical if > 75, else Healthy
    Response Time: Critical if > 500, else Healthy
    Error Rate: Critical if > 5, else Healthy
    Uptime: Critical if < 99, else Healthy

- trend is "up" or "down" compared to previous entry

- sparkline = last 5 values for that metric

- Methods to export:
    addMetric(rawData)        → processes and stores
    getLatest()               → returns most recent entry
    getHistory(metric, limit) → returns array of { time, value }
    getAllMetrics()            → returns full ring buffer
    getAgentStats()           → returns { dataPointsCollected, lastPingMs }

- Use ES Modules
```

---

## PROMPT 3 — `server/services/alertEngine.js`

```
Generate server/services/alertEngine.js for TelemetryIQ.

Requirements:
- Thresholds:
    cpu > 80           → severity: "critical"
    memory > 75        → severity: "warning"
    response_time > 500 → severity: "warning"
    error_rate > 5     → severity: "critical"
    error_rate > 10    → severity: "critical" (escalate)
    uptime < 99        → severity: "warning"

- In-memory alerts store (array, max 50)
- Each alert shape (must match frontend exactly):
  {
    id: number (auto-increment),
    message: "CPU usage exceeded 80% threshold",
    severity: "critical" | "warning" | "info",
    timestamp: ISO string,
    relative_time: "2 minutes ago",
    status: "active" | "dismissed" | "resolved",
    metric: "cpu" | "memory" | etc
  }

- Methods to export:
    checkAndGenerate(metricData)
      → checks all thresholds, creates new alerts
        only if not already active for same metric,
        returns newly created alerts[]

    getAlerts(status, limit)
      → filters by status, returns limited list

    dismissAlert(id)
      → sets status to "dismissed",
        returns { id, status: "dismissed" } or null

    resolveAlert(metricName)
      → auto-resolves alert when metric goes below threshold

    updateRelativeTimes()
      → updates all relative_time fields
        (call every 60 seconds)

- relative_time helper using date-fns or manual calculation
- Use ES Modules
```

---

## PROMPT 4 — `server/services/healthEngine.js`

```
Generate server/services/healthEngine.js for TelemetryIQ.

Requirements:
- Calculates overall system health percentage
- Response shape (must match frontend exactly):
  {
    percentage: 76,
    label: "Healthy" | "Degraded" | "Critical",
    components: {
      cpu: "healthy" | "degraded" | "critical",
      memory: "healthy" | "degraded" | "critical",
      disk: "healthy",
      network: "healthy"
    }
  }

- Scoring logic:
    Start at 100
    CPU > 80:           -15 points, component = "degraded"
    CPU > 90:           -25 points, component = "critical"
    Memory > 75:        -10 points, component = "degraded"
    Memory > 90:        -20 points, component = "critical"
    ErrorRate > 5:      -15 points
    ErrorRate > 10:     -25 points
    ResponseTime > 500: -10 points
    Uptime < 99:        -20 points
    disk and network always "healthy" (simulated)

- label logic:
    >= 80 → "Healthy"
    >= 50 → "Degraded"
    <  50 → "Critical"

- Methods to export:
    calculateHealth(latestMetric) → returns health object
    getLastHealth()               → returns cached result

- Use ES Modules
```

---

## PROMPT 5 — `server/socket/emitter.js`

```
Generate server/socket/emitter.js for TelemetryIQ.

Requirements:
- Accepts io instance via init(io)
- Emit these exact Socket.io events (names must match
  frontend exactly):

  metrics:update      → payload: full metric snapshot
                        (same as GET /api/metrics/current)
  chart:response_time → payload: { time, value }
  chart:error_rate    → payload: { time, value }
  alert:new           → payload: full alert object
  alert:resolved      → payload: { id, status: "resolved" }
  agent:ping          → payload: { timestamp, agent_version }
  health:update       → payload: { percentage, label }

- Functions to export:
    init(io)
    emitMetricUpdate(metricData)
      → emits metrics:update, chart:response_time,
        chart:error_rate, health:update all at once
    emitNewAlert(alert)      → emits alert:new
    emitResolvedAlert(id)    → emits alert:resolved
    emitAgentPing(pingData)  → emits agent:ping

- Log each emit to console with timestamp
- Use ES Modules
```

---

## PROMPT 6 — `server/routes/metrics.js`

```
Generate server/routes/metrics.js for TelemetryIQ.

Endpoints:

1. POST /api/metrics
   - Body: { cpu, memory, uptime, response_time,
             error_rate, agent_version }
   - Validate all fields present and are numbers
   - Call metricsStore.addMetric(body)
   - Call alertEngine.checkAndGenerate(metric)
   - Auto-resolve alerts for metrics now below threshold
   - Call emitter.emitMetricUpdate(metric)
   - Emit emitter.emitNewAlert() for each new alert
   - Emit emitter.emitAgentPing()
   - Return 201: { success: true, alerts: newAlerts[] }
   - Return 400 on validation fail
   - Return 500 on server error

2. GET /api/metrics/current
   - Call metricsStore.getLatest()
   - Return exact shape:
     {
       cpu:           { value, unit, trend, status, sparkline },
       memory:        { value, unit, trend, status, sparkline },
       uptime:        { value, unit, trend, status, sparkline },
       response_time: { value, unit, trend, status, sparkline },
       error_rate:    { value, unit, trend, status, sparkline }
     }
   - Return 404 if no data yet

3. GET /api/metrics/history
   - Query params: metric, limit (default 20),
                   interval (default 10)
   - Validate metric is one of: response_time, error_rate,
     cpu, memory, uptime
   - Call metricsStore.getHistory(metric, limit)
   - Return array of { time, value }

- Use Express Router
- Use ES Modules
```

---

## PROMPT 7 — `server/routes/alerts.js`

```
Generate server/routes/alerts.js for TelemetryIQ.

Endpoints:

1. GET /api/alerts
   - Query params:
       status → "active" | "resolved" | "all"
                (default: "active")
       limit  → number (default: 10)
   - Call alertEngine.getAlerts(status, limit)
   - Return alerts array matching shape:
     [{ id, message, severity, timestamp,
        relative_time, status, metric }]

2. PATCH /api/alerts/:id/dismiss
   - Parse id as integer
   - Call alertEngine.dismissAlert(id)
   - Return { id, status: "dismissed" } on success
   - Return 404 if alert not found
   - Return 400 if id invalid

- Use Express Router
- Use ES Modules
```

---

## PROMPT 8 — `server/routes/health.js`

```
Generate server/routes/health.js for TelemetryIQ.

Endpoints:

1. GET /api/health
   - Get latest metric from metricsStore.getLatest()
   - If no data, return default:
     {
       percentage: 100,
       label: "Healthy",
       components: {
         cpu: "healthy", memory: "healthy",
         disk: "healthy", network: "healthy"
       }
     }
   - Else call healthEngine.calculateHealth(latestMetric)
   - Return exact shape:
     {
       percentage: 76,
       label: "Healthy",
       components: {
         cpu: "degraded",
         memory: "healthy",
         disk: "healthy",
         network: "healthy"
       }
     }

- Use Express Router
- Use ES Modules
```

---

## PROMPT 9 — `server/routes/agent.js`

```
Generate server/routes/agent.js for TelemetryIQ.

Endpoints:

1. GET /api/agent/status
   - Get stats from metricsStore.getAgentStats()
   - Return exact shape (must match AgentStatus component):
     {
       connection_status: "connected" | "disconnected",
       last_ping_ms: 2000,
       post_frequency_seconds: 5,
       agent_version: "v2.4.1",
       data_points_collected: 24847
     }
   - connection_status is "connected" if last ping
     was within 10 seconds, else "disconnected"

- Use Express Router
- Use ES Modules
```

---

## PROMPT 10 — `agent/telemetry.js`

```
Generate agent/telemetry.js for TelemetryIQ.

Requirements:
- Simulates realistic metrics with these ranges:
    cpu:           40–95 (spikes occasionally above 80)
    memory:        50–85 (gradual drift)
    uptime:        99.1–99.99 (slow decay then reset)
    response_time: 100–800ms (spikes occasionally > 500)
    error_rate:    0–15% (spikes occasionally > 5)
    agent_version: "v2.4.1" (static)

- Realistic simulation (not pure random):
    Use sine wave + noise for cpu and memory
    response_time increases when cpu is high
    error_rate spikes when response_time is high
    uptime slowly decreases, resets when it hits 99.0

- POSTs to http://localhost:4000/api/metrics every 5 seconds
- Uses axios
- Console logs every POST:
    "[HH:MM:SS] POST /api/metrics →
     CPU: 87% | MEM: 64% | RT: 342ms | ERR: 7.2% | UP: 99.8%"
- On server error (connection refused):
    Wait 5 seconds, retry, log "Retrying connection..."
- Tracks total data points sent (increments each POST)
- Use ES Modules
```

---

## PROMPT 11 — `package.json` + `.env` Files

```
Generate the following config files for TelemetryIQ:

1. server/package.json:
   - name: "telemetryiq-server"
   - type: "module"
   - scripts:
       "dev":   "nodemon index.js"
       "start": "node index.js"
   - dependencies:
       express, cors, socket.io, dotenv, date-fns
   - devDependencies: nodemon

2. agent/package.json:
   - name: "telemetryiq-agent"
   - type: "module"
   - scripts:
       "start": "node telemetry.js"
       "dev":   "nodemon telemetry.js"
   - dependencies: axios, dotenv

3. root package.json:
   - scripts:
       "dev": "concurrently
               \"npm run dev --prefix server\"
               \"npm run dev --prefix agent\""
       "install:all": "npm i --prefix server &&
                       npm i --prefix agent"
   - devDependencies: concurrently

4. server/.env:
   PORT=4000
   CLIENT_URL=http://localhost:3000
   ALERT_INTERVAL_MS=60000

5. agent/.env:
   SERVER_URL=http://localhost:4000
   POST_INTERVAL_MS=5000
   AGENT_VERSION=v2.4.1

Also provide the exact terminal commands to:
- Install all dependencies
- Run server and agent together
- Test POST /api/metrics with curl
```

---

## Alert Thresholds Summary

| Metric | Warning | Critical |
|---|---|---|
| CPU | > 70% | > 80% |
| Memory | > 75% | > 90% |
| Response Time | > 500ms | > 800ms |
| Error Rate | > 5% | > 10% |
| Uptime | < 99.5% | < 99% |

---

## Socket.io Events Reference

| Event | Direction | Payload | Replaces |
|---|---|---|---|
| `metrics:update` | Server → Client | Full metric snapshot | `setInterval` polling |
| `chart:response_time` | Server → Client | `{ time, value }` | `setInterval` chart update |
| `chart:error_rate` | Server → Client | `{ time, value }` | `setInterval` chart update |
| `alert:new` | Server → Client | Full alert object | Polling `/api/alerts` |
| `alert:resolved` | Server → Client | `{ id, status }` | Manual refresh |
| `agent:ping` | Server → Client | `{ timestamp, agent_version }` | Static AgentStatus data |
| `health:update` | Server → Client | `{ percentage, label }` | Hardcoded `76` |

---

## REST Endpoints Reference

| # | Method | Endpoint | Component Served |
|---|---|---|---|
| 1 | `GET` | `/api/metrics/current` | All 5 MetricCards |
| 2 | `GET` | `/api/metrics/history?metric=response_time` | ResponseTimeChart |
| 3 | `GET` | `/api/metrics/history?metric=error_rate` | ErrorRateChart |
| 4 | `GET` | `/api/health` | SystemHealth gauge |
| 5 | `GET` | `/api/alerts?status=active` | ActiveAlerts, AlertBanner |
| 6 | `PATCH` | `/api/alerts/:id/dismiss` | AlertBanner dismiss ✕ |
| 7 | `GET` | `/api/agent/status` | AgentStatus panel |
| 8 | `POST` | `/api/metrics` | Called by agent only |

---

## Data Contract — `GET /api/metrics/current`

```json
{
  "cpu":           { "value": 87,    "unit": "%",  "trend": "up",   "status": "Critical", "sparkline": [72, 75, 80, 85, 87] },
  "memory":        { "value": 64,    "unit": "%",  "trend": "down", "status": "Healthy",  "sparkline": [68, 66, 65, 64, 62] },
  "uptime":        { "value": 99.8,  "unit": "%",  "trend": "up",   "status": "Healthy",  "sparkline": [99.7, 99.8, 99.8, 99.9, 99.8] },
  "response_time": { "value": 342,   "unit": "ms", "trend": "down", "status": "Healthy",  "sparkline": [500, 420, 390, 360, 342] },
  "error_rate":    { "value": 7.2,   "unit": "%",  "trend": "up",   "status": "Critical", "sparkline": [3.1, 4.5, 5.8, 6.5, 7.2] }
}
```

## Data Contract — `GET /api/metrics/history`

```json
[
  { "time": "14:23:10", "value": 342 },
  { "time": "14:23:20", "value": 410 },
  { "time": "14:23:30", "value": 389 }
]
```

## Data Contract — `GET /api/health`

```json
{
  "percentage": 76,
  "label": "Healthy",
  "components": {
    "cpu": "degraded",
    "memory": "healthy",
    "disk": "healthy",
    "network": "healthy"
  }
}
```

## Data Contract — `GET /api/alerts`

```json
[
  {
    "id": 1,
    "message": "CPU usage exceeded 80% threshold",
    "severity": "critical",
    "timestamp": "2025-09-15T12:01:00Z",
    "relative_time": "2 minutes ago",
    "status": "active",
    "metric": "cpu"
  }
]
```

## Data Contract — `GET /api/agent/status`

```json
{
  "connection_status": "connected",
  "last_ping_ms": 2000,
  "post_frequency_seconds": 5,
  "agent_version": "v2.4.1",
  "data_points_collected": 24847
}
```

---

## Tips

| Tip | Why |
|---|---|
| Generate in order (1→11) | Each file imports from the previous |
| Test POST /api/metrics first | All Socket.io events depend on it |
| Use `concurrently` to run all | One command starts server + agent |
| Check event names carefully | Frontend will silently fail on mismatch |
| Confirm ES Modules in package.json | `"type": "module"` required for import/export |

---

*TelemetryIQ — React + Node.js + Socket.io | Generated Prompt Reference v1.0*
