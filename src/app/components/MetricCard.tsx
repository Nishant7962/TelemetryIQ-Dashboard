import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface MetricCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  trend: 'up' | 'down';
  trendColor: string;
  status: 'Healthy' | 'Critical' | 'Warning';
  sparklineData: number[];
}

export function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  trend,
  trendColor,
  status,
  sparklineData,
}: MetricCardProps) {
  const { colors, theme } = useTheme();
  const sparkData = sparklineData.map((value, index) => ({ value, index }));

  const getGlowColor = () => {
    if (status === 'Critical') return 'rgba(255, 76, 106, 0.4)';
    if (status === 'Warning') return 'rgba(255, 184, 48, 0.4)';
    return 'rgba(108, 99, 255, 0.4)';
  };

  const getBorderGlowColor = () => {
    if (status === 'Critical') return 'rgba(255, 76, 106, 0.6)';
    if (status === 'Warning') return 'rgba(255, 184, 48, 0.6)';
    return 'rgba(108, 99, 255, 0.6)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 rounded-xl relative overflow-hidden transition-all duration-300 group"
      style={{
        background: colors.cardBackground,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(10px)',
        boxShadow: theme === 'dark' 
          ? `0 4px 12px ${getGlowColor()}, 0 0 20px ${getGlowColor()}`
          : `0 2px 8px rgba(0, 0, 0, 0.1)`,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = getBorderGlowColor();
        e.currentTarget.style.boxShadow = theme === 'dark'
          ? `0 8px 24px ${getGlowColor()}, 0 0 40px ${getGlowColor()}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : `0 4px 16px rgba(0, 0, 0, 0.15), 0 0 20px ${getGlowColor()}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.boxShadow = theme === 'dark'
          ? `0 4px 12px ${getGlowColor()}, 0 0 20px ${getGlowColor()}`
          : `0 2px 8px rgba(0, 0, 0, 0.1)`;
      }}
    >
      {/* Animated glow effect */}
      {theme === 'dark' && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          animate={{
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `radial-gradient(circle at 50% 0%, ${getGlowColor()} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Icon */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <motion.div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ 
            background: `${iconColor}20`,
            boxShadow: `0 0 20px ${iconColor}40`,
          }}
          whileHover={{
            scale: 1.1,
            boxShadow: `0 0 30px ${iconColor}60`,
          }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor, filter: `drop-shadow(0 0 4px ${iconColor})` }} />
        </motion.div>
        {trend === 'up' ? (
          <TrendingUp className="w-5 h-5" style={{ color: trendColor }} />
        ) : (
          <TrendingDown className="w-5 h-5" style={{ color: trendColor }} />
        )}
      </div>

      {/* Label and Value */}
      <div className="mb-4 relative z-10">
        <p className="text-sm mb-1" style={{ color: colors.textSecondary }}>
          {label}
        </p>
        <p className="text-3xl font-bold" style={{ color: colors.text }}>{value}</p>
      </div>

      {/* Sparkline */}
      <div className="h-12 mb-3 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={iconColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status Badge */}
      <div className="flex justify-end relative z-10">
        <StatusBadge status={status} />
      </div>
    </motion.div>
  );
}