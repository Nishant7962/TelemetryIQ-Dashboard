import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Navbar } from './Navbar';
import { AlertBanner } from './AlertBanner';
import { MetricCard } from './MetricCard';
import { ResponseTimeChart } from './ResponseTimeChart';
import { ErrorRateChart } from './ErrorRateChart';
import { SystemHealth } from './SystemHealth';
import { ActiveAlerts } from './ActiveAlerts';
import { AgentStatus } from './AgentStatus';
import { useDashboard } from '../hooks/useDashboard';
import { Cpu, MemoryStick, Shield, Gauge, AlertTriangle, WifiOff, Loader2 } from 'lucide-react';

// ── Skeleton loader ────────────────────────────────────────────────────────

function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <div
      className="p-6 rounded-xl animate-pulse"
      style={{ background: colors.cardBackground, border: `1px solid ${colors.border}` }}
    >
      <div className="h-4 rounded mb-3" style={{ background: colors.border, width: '60%' }} />
      <div className="h-8 rounded mb-4" style={{ background: colors.border, width: '40%' }} />
      <div className="h-12 rounded" style={{ background: colors.border }} />
    </div>
  );
}

// ── Helper: derive MetricCard props from live metric data ──────────────────

function metricTrendColor(trend: 'up' | 'down', positiveIsGood: boolean): string {
  // For uptime: up is good. For error rate/response time: down is good.
  const isGood = positiveIsGood ? trend === 'up' : trend === 'down';
  return isGood ? '#00D9A6' : '#FF4C6A';
}

export function AppContent() {
  const { colors } = useTheme();
  const {
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
  } = useDashboard();

  // Top-banner alert: the most recent critical active alert (if any)
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<number>>(new Set());
  const bannerAlert = alerts.find(
    (a) => a.severity === 'critical' && a.status === 'active' && !dismissedBannerIds.has(a.id)
  );
  const isBannerVisible = !!bannerAlert;

  const handleBannerDismiss = async () => {
    if (!bannerAlert) return;
    setDismissedBannerIds((prev) => new Set(prev).add(bannerAlert.id));
    await dismissAlert(bannerAlert.id);
  };

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && !metrics) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: colors.background }}
      >
        <Navbar />
        <div className="flex flex-col items-center gap-4 mt-24">
          <WifiOff className="w-16 h-16" style={{ color: '#FF4C6A' }} />
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Backend Unreachable
          </h2>
          <p className="text-sm max-w-md text-center" style={{ color: colors.textSecondary }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#6C63FF' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Derive display values from live metrics ──────────────────────────────

  const cpuValue    = metrics?.cpu?.value;
  const memValue    = metrics?.memory?.value;
  const uptimeValue = metrics?.uptime?.value;
  const rtValue     = metrics?.response_time?.value;
  const erValue     = metrics?.error_rate?.value;

  const healthPct = health?.percentage ?? 100;

  // Convert alerts to the shape ActiveAlerts expects
  const activeAlertItems = alerts.map((a) => ({
    id: a.id,
    timestamp: a.relative_time,
    message: a.message,
    severity: a.severity as 'critical' | 'warning' | 'info',
  }));

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: colors.background }}>
      <Navbar socketConnected={socketConnected} />

      <AlertBanner
        message={bannerAlert?.message ?? ''}
        onDismiss={handleBannerDismiss}
        isVisible={isBannerVisible}
      />

      <main className="max-w-[1440px] mx-auto px-8 py-8">

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {loading && !metrics ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <MetricCard
                icon={Cpu}
                iconColor="#FF4C6A"
                label="CPU Usage"
                value={cpuValue !== undefined ? `${cpuValue.toFixed(1)}%` : '—'}
                trend={metrics?.cpu?.trend ?? 'up'}
                trendColor={metricTrendColor(metrics?.cpu?.trend ?? 'up', false)}
                status={metrics?.cpu?.status ?? 'Healthy'}
                sparklineData={metrics?.cpu?.sparkline ?? []}
              />
              <MetricCard
                icon={MemoryStick}
                iconColor="#6C63FF"
                label="Memory Usage"
                value={memValue !== undefined ? `${memValue.toFixed(1)}%` : '—'}
                trend={metrics?.memory?.trend ?? 'up'}
                trendColor={metricTrendColor(metrics?.memory?.trend ?? 'up', false)}
                status={metrics?.memory?.status ?? 'Healthy'}
                sparklineData={metrics?.memory?.sparkline ?? []}
              />
              <MetricCard
                icon={Shield}
                iconColor="#00D9A6"
                label="Uptime"
                value={uptimeValue !== undefined ? `${uptimeValue.toFixed(2)}%` : '—'}
                trend={metrics?.uptime?.trend ?? 'up'}
                trendColor={metricTrendColor(metrics?.uptime?.trend ?? 'up', true)}
                status={metrics?.uptime?.status ?? 'Healthy'}
                sparklineData={metrics?.uptime?.sparkline ?? []}
              />
              <MetricCard
                icon={Gauge}
                iconColor="#6C63FF"
                label="Response Time"
                value={rtValue !== undefined ? `${rtValue}ms` : '—'}
                trend={metrics?.response_time?.trend ?? 'down'}
                trendColor={metricTrendColor(metrics?.response_time?.trend ?? 'down', false)}
                status={metrics?.response_time?.status ?? 'Healthy'}
                sparklineData={metrics?.response_time?.sparkline ?? []}
              />
              <MetricCard
                icon={AlertTriangle}
                iconColor="#FF4C6A"
                label="Error Rate"
                value={erValue !== undefined ? `${erValue.toFixed(1)}%` : '—'}
                trend={metrics?.error_rate?.trend ?? 'up'}
                trendColor={metricTrendColor(metrics?.error_rate?.trend ?? 'up', false)}
                status={metrics?.error_rate?.status ?? 'Healthy'}
                sparklineData={metrics?.error_rate?.sparkline ?? []}
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {loading && responseTimeData.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <ResponseTimeChart data={responseTimeData} />
              <ErrorRateChart data={errorRateData} />
            </>
          )}
        </div>

        {/* Bottom Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SystemHealth percentage={healthPct} label={health?.label} />
          <ActiveAlerts alerts={activeAlertItems} onDismiss={dismissAlert} />
          <AgentStatus status={agentStatus} lastPingTimestamp={lastPingTimestamp} />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-6 text-center transition-colors duration-300"
        style={{
          background: colors.cardBackground,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            TelemetryIQ © 2025 | Powered by React + Node.js + Socket.io
          </p>
          {loading && (
            <Loader2
              className="w-4 h-4 animate-spin"
              style={{ color: colors.textSecondary }}
            />
          )}
        </div>
      </footer>
    </div>
  );
}
