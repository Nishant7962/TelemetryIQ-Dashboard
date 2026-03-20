// src/app/services/apiService.ts
// REST API calls for TelemetryIQ Dashboard

const BASE_URL = 'http://localhost:4000/api';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MetricValue {
  value: number;
  unit: string;
  trend: 'up' | 'down';
  status: 'Healthy' | 'Critical' | 'Warning';
  sparkline: number[];
}

export interface MetricsSnapshot {
  cpu: MetricValue;
  memory: MetricValue;
  uptime: MetricValue;
  response_time: MetricValue;
  error_rate: MetricValue;
}

export interface ChartPoint {
  time: string;
  value: number;
}

export interface HealthData {
  percentage: number;
  label: 'Healthy' | 'Degraded' | 'Critical';
  components: {
    cpu: string;
    memory: string;
    disk: string;
    network: string;
  };
}

export interface AlertData {
  id: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  relative_time: string;
  status: 'active' | 'dismissed' | 'resolved';
  metric: string;
}

export interface AgentStatusData {
  connection_status: 'connected' | 'disconnected';
  last_ping_ms: number | null;
  post_frequency_seconds: number;
  agent_version: string;
  data_points_collected: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${options?.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API Calls ──────────────────────────────────────────────────────────────

/** GET /api/metrics/current */
export async function fetchCurrentMetrics(): Promise<MetricsSnapshot> {
  return apiFetch<MetricsSnapshot>('/metrics/current');
}

/** GET /api/metrics/history?metric=X&limit=N */
export async function fetchMetricHistory(
  metric: 'cpu' | 'memory' | 'uptime' | 'response_time' | 'error_rate',
  limit = 20
): Promise<ChartPoint[]> {
  return apiFetch<ChartPoint[]>(`/metrics/history?metric=${metric}&limit=${limit}`);
}

/** GET /api/health */
export async function fetchHealth(): Promise<HealthData> {
  return apiFetch<HealthData>('/health');
}

/** GET /api/alerts */
export async function fetchAlerts(
  status: 'active' | 'resolved' | 'dismissed' | 'all' = 'active',
  limit = 10
): Promise<AlertData[]> {
  return apiFetch<AlertData[]>(`/alerts?status=${status}&limit=${limit}`);
}

/** PATCH /api/alerts/:id/dismiss */
export async function dismissAlert(id: number): Promise<{ id: number; status: string }> {
  return apiFetch<{ id: number; status: string }>(`/alerts/${id}/dismiss`, {
    method: 'PATCH',
  });
}

/** GET /api/agent/status */
export async function fetchAgentStatus(): Promise<AgentStatusData> {
  return apiFetch<AgentStatusData>('/agent/status');
}
