import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface ChartDataPoint {
  id: string;
  time: string;
  value: number;
}

interface ErrorRateChartProps {
  data: ChartDataPoint[];
}

export function ErrorRateChart({ data }: ErrorRateChartProps) {
  const { colors, theme } = useTheme();

  const getBarColor = (value: number) => {
    if (value < 5) return '#00D9A6';
    if (value <= 10) return '#FFB830';
    return '#FF4C6A';
  };

  return (
    <div
      className="p-6 rounded-xl transition-colors duration-300"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold" style={{ color: colors.text }}>Error Rate (%)</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Last 20 intervals
        </p>
      </div>
      <div className="h-64" style={{ minHeight: '256px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} />
            <XAxis
              dataKey="time"
              stroke={colors.textSecondary}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.textSecondary }}
            />
            <YAxis
              stroke={colors.textSecondary}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.textSecondary }}
              domain={[0, 20]}
            />
            <Tooltip
              contentStyle={{
                background: colors.cardBackground,
                border: '1px solid rgba(108, 99, 255, 0.3)',
                borderRadius: '8px',
                color: colors.text,
              }}
              labelStyle={{ color: colors.textSecondary }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}