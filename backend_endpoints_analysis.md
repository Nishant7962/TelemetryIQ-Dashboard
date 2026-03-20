# TelemetryIQ Dashboard — Required Backend Endpoints

> All data is currently **hardcoded / mock-generated** on the frontend.  
> The footer already hints at the intended stack: **React + Node.js + Socket.io**

---

## Dashboard Component → Data Mapping

| Component | Currently Mocked Data | Needs Real API |
|---|---|---|
| [MetricCard](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/MetricCard.tsx#18-144) (×5) | CPU %, Memory %, Uptime, Response Time, Error Rate | ✅ |
| [ResponseTimeChart](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ResponseTimeChart.tsx#14-80) | 20-point time-series, regenerated every 5s | ✅ |
| [ErrorRateChart](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ErrorRateChart.tsx#14-73) | 20-point time-series, regenerated every 5s | ✅ |
| [SystemHealth](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/SystemHealth.tsx#3-57) | Single health percentage (hardcoded `76`) | ✅ |
| [ActiveAlerts](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ActiveAlerts.tsx#15-73) | 3 hardcoded alert objects | ✅ |
| [AgentStatus](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AgentStatus.tsx#3-73) | Connection status, last ping, version, data points | ✅ |
| [AlertBanner](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AlertBanner.tsx#10-75) | Single hardcoded critical message | ✅ |

---

## REST Endpoints Required

### 1. `GET /api/metrics/current`
Returns the current snapshot of all system metrics (for the 5 Metric Cards).

**Response:**
```json
{
  "cpu":           { "value": 87, "unit": "%", "trend": "up", "status": "Critical", "sparkline": [72, 75, 80, 85, 87] },
  "memory":        { "value": 64, "unit": "%", "trend": "down", "status": "Healthy", "sparkline": [68, 66, 65, 64, 62] },
  "uptime":        { "value": 99.8, "unit": "%", "trend": "up", "status": "Healthy", "sparkline": [99.7, 99.8, 99.8, 99.9, 99.8] },
  "response_time": { "value": 342, "unit": "ms", "trend": "down", "status": "Healthy", "sparkline": [500, 420, 390, 360, 342] },
  "error_rate":    { "value": 7.2, "unit": "%", "trend": "up", "status": "Critical", "sparkline": [3.1, 4.5, 5.8, 6.5, 7.2] }
}
```

---

### 2. `GET /api/metrics/history`
Returns historical time-series data for the two charts.

**Query Params:**
- `metric` — `response_time` | `error_rate`
- `limit` — number of data points (default: `20`)
- `interval` — time interval between points in seconds (default: `10`)

**Response:**
```json
[
  { "time": "14:23:10", "value": 342 },
  { "time": "14:23:20", "value": 410 }
]
```

---

### 3. `GET /api/health`
Returns the overall system health score (for the [SystemHealth](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/SystemHealth.tsx#3-57) radial gauge).

**Response:**
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

---

### 4. `GET /api/alerts`
Returns the list of active alerts (for the [ActiveAlerts](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ActiveAlerts.tsx#15-73) panel and [AlertBanner](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AlertBanner.tsx#10-75)).

**Query Params:**
- `status` — `active` | `resolved` | `all` (default: `active`)
- `limit` — max items (default: `10`)

**Response:**
```json
[
  {
    "id": 1,
    "message": "CPU usage exceeded 80% threshold",
    "severity": "critical",
    "timestamp": "2025-09-15T12:01:00Z",
    "relative_time": "2 minutes ago"
  }
]
```

**Severity values:** `critical` | `warning` | `info`

---

### 5. `PATCH /api/alerts/:id/dismiss`
Marks an alert as dismissed (triggered when user clicks ✕ on [AlertBanner](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AlertBanner.tsx#10-75)).

**Response:**
```json
{ "id": 1, "status": "dismissed" }
```

---

### 6. `GET /api/agent/status`
Returns the monitoring agent's connection and runtime info (for [AgentStatus](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AgentStatus.tsx#3-73) panel).

**Response:**
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

## Real-Time WebSocket / Socket.io Events

The footer explicitly says **Socket.io**. These events replace the 5-second `setInterval` polling on the frontend.

| Event (Server → Client) | Purpose | Payload |
|---|---|---|
| `metrics:update` | Push new metric snapshot every N seconds | Same shape as `GET /api/metrics/current` |
| `chart:response_time` | Stream new response time data point | `{ time, value }` |
| `chart:error_rate` | Stream new error rate data point | `{ time, value }` |
| `alert:new` | Notify dashboard of a new incoming alert | Full alert object |
| `alert:resolved` | Notify when an alert is auto-resolved | `{ id, status: "resolved" }` |
| `agent:ping` | Keep-alive / heartbeat from agent | `{ timestamp, agent_version }` |
| `health:update` | Push updated system health score | `{ percentage, label }` |

> [!TIP]
> The frontend already polls every **5 seconds** with `setInterval`. Replacing this with a `metrics:update` Socket.io event will make the dashboard truly real-time with minimal refactoring.

---

## Summary Table

| # | Endpoint / Event | Method | Component Served |
|---|---|---|---|
| 1 | `/api/metrics/current` | `GET` | All 5 [MetricCard](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/MetricCard.tsx#18-144)s |
| 2 | `/api/metrics/history` | `GET` | [ResponseTimeChart](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ResponseTimeChart.tsx#14-80), [ErrorRateChart](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ErrorRateChart.tsx#14-73) |
| 3 | `/api/health` | `GET` | [SystemHealth](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/SystemHealth.tsx#3-57) |
| 4 | `/api/alerts` | `GET` | [ActiveAlerts](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ActiveAlerts.tsx#15-73), [AlertBanner](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AlertBanner.tsx#10-75) |
| 5 | `/api/alerts/:id/dismiss` | `PATCH` | [AlertBanner](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AlertBanner.tsx#10-75) dismiss button |
| 6 | `/api/agent/status` | `GET` | [AgentStatus](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AgentStatus.tsx#3-73) |
| 7 | `metrics:update` | Socket.io push | All [MetricCard](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/MetricCard.tsx#18-144)s (real-time) |
| 8 | `chart:response_time` | Socket.io push | [ResponseTimeChart](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ResponseTimeChart.tsx#14-80) |
| 9 | `chart:error_rate` | Socket.io push | [ErrorRateChart](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ErrorRateChart.tsx#14-73) |
| 10 | `alert:new` | Socket.io push | [ActiveAlerts](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ActiveAlerts.tsx#15-73), [AlertBanner](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AlertBanner.tsx#10-75) |
| 11 | `alert:resolved` | Socket.io push | [ActiveAlerts](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/ActiveAlerts.tsx#15-73) |
| 12 | `agent:ping` | Socket.io push | [AgentStatus](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/AgentStatus.tsx#3-73) — last ping |
| 13 | `health:update` | Socket.io push | [SystemHealth](file:///d:/Knowella_Projects/TelemetryIQ%20Dashboard%20Design/src/app/components/SystemHealth.tsx#3-57) |
