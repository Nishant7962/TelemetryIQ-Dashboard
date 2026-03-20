import { useTheme } from '../context/ThemeContext';
import type { AgentStatusData } from '../services/apiService';

interface AgentStatusProps {
  status: AgentStatusData | null;
  lastPingTimestamp: string | null;
}

export function AgentStatus({ status, lastPingTimestamp }: AgentStatusProps) {
  const { colors } = useTheme();

  const isConnected = status?.connection_status === 'connected';
  const dotColor = isConnected ? '#00D9A6' : '#FF4C6A';
  const connectionLabel = isConnected ? 'Connected' : 'Disconnected';

  // Derive human-readable last ping
  const getLastPingLabel = () => {
    if (!lastPingTimestamp && !status?.last_ping_ms) return '—';
    const ms = status?.last_ping_ms;
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${ms}ms ago`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.round(seconds / 60)}m ago`;
  };

  const dataPoints = status?.data_points_collected ?? 0;
  const formattedDataPoints = dataPoints.toLocaleString();
  const agentVersion = status?.agent_version ?? '—';
  const postFrequency = status
    ? `Every ${status.post_frequency_seconds}s`
    : 'Every 5s';

  return (
    <div
      className="p-6 rounded-xl transition-colors duration-300"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: colors.text }}>Agent Status</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            Connection Status
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: dotColor }}
              />
              {isConnected && (
                <div
                  className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                  style={{ background: dotColor, opacity: 0.75 }}
                />
              )}
            </div>
            <span className="text-sm font-medium" style={{ color: dotColor }}>
              {connectionLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            Last Ping
          </span>
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            {getLastPingLabel()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            POST Frequency
          </span>
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            {postFrequency}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            Agent Version
          </span>
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            {agentVersion}
          </span>
        </div>

        <div
          className="mt-4 pt-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              Data Points Collected
            </span>
            <span className="text-sm font-bold" style={{ color: colors.text }}>
              {formattedDataPoints}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}