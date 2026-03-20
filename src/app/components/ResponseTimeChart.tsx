import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface ChartDataPoint {
  id: string;
  time: string;
  value: number;
}

interface ResponseTimeChartProps {
  data: ChartDataPoint[];
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  const { colors, theme } = useTheme();

  return (
    <div
      className="p-6 rounded-xl transition-colors duration-300"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold" style={{ color: colors.text }}>Response Time (ms)</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Last 20 data points
        </p>
      </div>
      <div className="h-64" style={{ minHeight: '256px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
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
              domain={[0, 1000]}
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
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6C63FF"
              strokeWidth={3}
              dot={{ fill: '#6C63FF', r: 4 }}
              activeDot={{ r: 6, fill: '#6C63FF' }}
              filter={theme === 'dark' ? 'url(#glow)' : undefined}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}