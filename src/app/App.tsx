import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { MetricCard } from './components/MetricCard';
import { ResponseTimeChart } from './components/ResponseTimeChart';
import { ErrorRateChart } from './components/ErrorRateChart';
import { SystemHealth } from './components/SystemHealth';
import { ActiveAlerts } from './components/ActiveAlerts';
import { AgentStatus } from './components/AgentStatus';
import { Cpu, MemoryStick, Shield, Gauge, AlertTriangle } from 'lucide-react';
import { AppContent } from './components/AppContent';

interface ChartDataPoint {
  id: string;
  time: string;
  value: number;
}

// Generate mock data
const generateSparklineData = (length: number, min: number, max: number) => {
  return Array.from({ length }, () => Math.random() * (max - min) + min);
};

const generateTimeSeriesData = (length: number, min: number, max: number): ChartDataPoint[] => {
  const now = new Date();
  return Array.from({ length }, (_, i) => {
    const time = new Date(now.getTime() - (length - i) * 10000);
    return {
      id: `data-${time.getTime()}-${i}`,
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).slice(3),
      value: Math.random() * (max - min) + min,
    };
  });
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;