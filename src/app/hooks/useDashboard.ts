// src/app/hooks/useDashboard.ts
// Central data hook — fetches REST on mount + subscribes to Socket.io events

import { useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentMetrics,
  fetchMetricHistory,
  fetchHealth,
  fetchAlerts,
  fetchAgentStatus,
  dismissAlert as apiDismissAlert,
  type MetricsSnapshot,
  type ChartPoint,
  type HealthData,
  type AlertData,
  type AgentStatusData,
} from '../services/apiService';
import {
  onMetricsUpdate,
  onChartResponseTime,
  onChartErrorRate,
  onAlertNew,
  onAlertResolved,
  onAgentPing,
  onHealthUpdate,
  getSocket,
} from '../services/socketService';

// ── Chart data id helper ───────────────────────────────────────────────────

function toChartPoint(p: ChartPoint, idx: number) {
  return { id: `pt-${p.time}-${idx}`, time: p.time, value: p.value };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useDashboard() {
  // ── Metrics state ─────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);

  // ── Chart data ────────────────────────────────────────────────────────
  const [responseTimeData, setResponseTimeData] = useState<
    { id: string; time: string; value: number }[]
  >([]);
  const [errorRateData, setErrorRateData] = useState<
    { id: string; time: string; value: number }[]
  >([]);

  // ── Health ────────────────────────────────────────────────────────────
  const [health, setHealth] = useState<HealthData | null>(null);

  // ── Alerts ────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  // ── Agent status ──────────────────────────────────────────────────────
  const [agentStatus, setAgentStatus] = useState<AgentStatusData | null>(null);
  const [lastPingTimestamp, setLastPingTimestamp] = useState<string | null>(null);

  // ── Socket connection status ──────────────────────────────────────────
  const [socketConnected, setSocketConnected] = useState(false);

  // ── Loading / error ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Dismiss alert ─────────────────────────────────────────────────────
  const dismissAlert = useCallback(async (id: number) => {
    try {
      await apiDismissAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Failed to dismiss alert:', e);
    }
  }, []);

  // ── Initial REST fetch ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        const [metricsData, rtHistory, erHistory, healthData, alertsData, agentData] =
          await Promise.allSettled([
            fetchCurrentMetrics(),
            fetchMetricHistory('response_time', 20),
            fetchMetricHistory('error_rate', 20),
            fetchHealth(),
            fetchAlerts('active', 10),
            fetchAgentStatus(),
          ]);

        if (cancelled) return;

        if (metricsData.status === 'fulfilled') setMetrics(metricsData.value);
        if (rtHistory.status === 'fulfilled')
          setResponseTimeData(rtHistory.value.map(toChartPoint));
        if (erHistory.status === 'fulfilled')
          setErrorRateData(erHistory.value.map(toChartPoint));
        if (healthData.status === 'fulfilled') setHealth(healthData.value);
        if (alertsData.status === 'fulfilled') setAlerts(alertsData.value);
        if (agentData.status === 'fulfilled') setAgentStatus(agentData.value);
      } catch (e) {
        if (!cancelled)
          setError('Could not reach backend. Make sure the server is running on port 4000.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ── Socket.io subscriptions ───────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    // Track connection status
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setSocketConnected(true);

    // metrics:update → update all 5 metric cards
    const unsubMetrics = onMetricsUpdate((data) => {
      setMetrics(data);
    });

    // chart:response_time → append new point, keep last 20
    const unsubRT = onChartResponseTime((point) => {
      setResponseTimeData((prev) => {
        const next = [...prev.slice(-19), toChartPoint(point, Date.now())];
        return next;
      });
    });

    // chart:error_rate → append new point, keep last 20
    const unsubER = onChartErrorRate((point) => {
      setErrorRateData((prev) => {
        const next = [...prev.slice(-19), toChartPoint(point, Date.now())];
        return next;
      });
    });

    // health:update
    const unsubHealth = onHealthUpdate((payload) => {
      setHealth((prev) =>
        prev
          ? { ...prev, percentage: payload.percentage, label: payload.label }
          : null
      );
    });

    // alert:new → prepend to list
    const unsubAlertNew = onAlertNew((alert) => {
      setAlerts((prev) => {
        // Avoid duplicates
        if (prev.some((a) => a.id === alert.id)) return prev;
        return [alert, ...prev].slice(0, 10);
      });
    });

    // alert:resolved → remove from active list
    const unsubAlertResolved = onAlertResolved((payload) => {
      setAlerts((prev) => prev.filter((a) => a.id !== payload.id));
    });

    // agent:ping → update last ping time + re-fetch agent status
    const unsubPing = onAgentPing((payload) => {
      setLastPingTimestamp(payload.timestamp);
      // Refresh agent status from REST (has data_points_collected)
      fetchAgentStatus()
        .then((data) => setAgentStatus(data))
        .catch(() => {/* silent */});
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      unsubMetrics();
      unsubRT();
      unsubER();
      unsubHealth();
      unsubAlertNew();
      unsubAlertResolved();
      unsubPing();
    };
  }, []);

  return {
    metrics,
    responseTimeData,
    errorRateData,
    health,
    alerts,
    agentStatus,
    lastPingTimestamp,
    socketConnected,
    loading,
    error,
    dismissAlert,
  };
}
