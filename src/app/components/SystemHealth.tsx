import { useTheme } from '../context/ThemeContext';

interface SystemHealthProps {
  percentage: number;
  label?: 'Healthy' | 'Degraded' | 'Critical';
}

export function SystemHealth({ percentage, label }: SystemHealthProps) {
  const { colors, theme } = useTheme();
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (label === 'Critical') return '#FF4C6A';
    if (label === 'Degraded') return '#FFB830';
    return '#6C63FF';
  };

  const arcColor = getColor();
  const displayLabel = label ?? 'Healthy';

  return (
    <div
      className="p-6 rounded-xl transition-colors duration-300"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h3 className="text-lg font-bold mb-6" style={{ color: colors.text }}>System Health</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="60"
              fill="none"
              stroke={arcColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease',
                filter: theme === 'dark'
                  ? `drop-shadow(0 0 8px ${arcColor}99)`
                  : `drop-shadow(0 0 4px ${arcColor}66)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: colors.text }}>
              {percentage}%
            </span>
            <span className="text-sm font-medium" style={{ color: arcColor }}>
              {displayLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}