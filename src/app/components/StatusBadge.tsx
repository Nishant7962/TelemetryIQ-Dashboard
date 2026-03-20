interface StatusBadgeProps {
  status: 'Healthy' | 'Critical' | 'Warning';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    Healthy: {
      bg: 'rgba(0, 217, 166, 0.15)',
      text: '#00D9A6',
      border: 'rgba(0, 217, 166, 0.3)',
    },
    Critical: {
      bg: 'rgba(255, 76, 106, 0.15)',
      text: '#FF4C6A',
      border: 'rgba(255, 76, 106, 0.3)',
    },
    Warning: {
      bg: 'rgba(255, 184, 48, 0.15)',
      text: '#FFB830',
      border: 'rgba(255, 184, 48, 0.3)',
    },
  };

  const color = colors[status];

  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
      }}
    >
      {status}
    </span>
  );
}
