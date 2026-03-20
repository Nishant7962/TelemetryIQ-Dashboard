import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Alert {
  id: number;
  timestamp: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

interface ActiveAlertsProps {
  alerts: Alert[];
  onDismiss?: (id: number) => void;
}

export function ActiveAlerts({ alerts, onDismiss }: ActiveAlertsProps) {
  const { colors, theme } = useTheme();

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" style={{ color: '#FF4C6A' }} />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" style={{ color: '#FFB830' }} />;
      default:
        return <Info className="w-4 h-4" style={{ color: '#6C63FF' }} />;
    }
  };

  const getDotColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF4C6A';
      case 'warning':  return '#FFB830';
      default:         return '#6C63FF';
    }
  };

  return (
    <div
      className="p-6 rounded-xl transition-colors duration-300"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: colors.text }}>Active Alerts</h3>
        {alerts.length > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255, 76, 106, 0.15)', color: '#FF4C6A' }}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 217, 166, 0.1)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#00D9A6' }} />
          </div>
          <span className="text-sm" style={{ color: colors.textSecondary }}>No active alerts</span>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg flex items-start gap-3 group"
              style={{ background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' }}
            >
              <div className="mt-0.5">{getIcon(alert.severity)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: colors.text }}>{alert.message}</p>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  {alert.timestamp}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="w-2 h-2 rounded-full mt-1.5"
                  style={{ background: getDotColor(alert.severity) }}
                />
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                    style={{ color: colors.textSecondary }}
                    title="Dismiss alert"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}