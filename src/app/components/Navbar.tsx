import { Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  socketConnected?: boolean;
}

export function Navbar({ socketConnected = false }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { colors, theme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <nav
      className="w-full px-8 py-4 flex items-center justify-between"
      style={{
        background: theme === 'dark' ? '#12122A' : '#FFFFFF',
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(108, 99, 255, 0.2)' : 'rgba(108, 99, 255, 0.15)'}`,
        boxShadow: `0 4px 12px ${theme === 'dark' ? 'rgba(108, 99, 255, 0.1)' : 'rgba(108, 99, 255, 0.08)'}`,
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#6C63FF' }}>
          <Activity className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: colors.text }}>TelemetryIQ</span>
      </div>

      {/* Center: App name tag */}
      <div
        className="px-4 py-2 rounded-lg"
        style={{
          background: 'rgba(108, 99, 255, 0.1)',
          border: '1px solid rgba(108, 99, 255, 0.3)',
        }}
      >
        <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          Live Monitoring Dashboard
        </span>
      </div>

      {/* Right: Live badge, clock, and theme toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: socketConnected ? '#00D9A6' : '#FFB830' }}
            />
            {socketConnected && (
              <div
                className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping"
                style={{ background: '#00D9A6', opacity: 0.75 }}
              />
            )}
          </div>
          <span className="text-sm font-bold" style={{ color: socketConnected ? '#00D9A6' : '#FFB830' }}>
            {socketConnected ? 'LIVE' : 'CONNECTING'}
          </span>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg font-mono text-sm"
          style={{
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            color: colors.text,
          }}
        >
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}