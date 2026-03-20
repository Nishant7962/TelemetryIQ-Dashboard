// src/app/services/socketService.ts
// Socket.io client singleton for TelemetryIQ Dashboard

import { io, Socket } from 'socket.io-client';
import type { MetricsSnapshot, ChartPoint, AlertData } from './apiService';

const SERVER_URL = 'http://localhost:4000';

// ── Types for Socket.io payloads ───────────────────────────────────────────

export interface HealthUpdatePayload {
  percentage: number;
  label: 'Healthy' | 'Degraded' | 'Critical';
}

export interface AgentPingPayload {
  timestamp: string;
  agent_version: string;
}

export interface AlertResolvedPayload {
  id: number;
  status: 'resolved';
}

// ── Singleton Socket ───────────────────────────────────────────────────────

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log(`[Socket.io] ✅ Connected: ${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[Socket.io] ❌ Disconnected: ${reason}`);
    });

    socket.on('connect_error', (err) => {
      console.error(`[Socket.io] Connection error: ${err.message}`);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── Typed subscription helpers ─────────────────────────────────────────────

type Unsubscribe = () => void;

export function onMetricsUpdate(cb: (data: MetricsSnapshot) => void): Unsubscribe {
  const s = getSocket();
  s.on('metrics:update', cb);
  return () => s.off('metrics:update', cb);
}

export function onChartResponseTime(cb: (point: ChartPoint) => void): Unsubscribe {
  const s = getSocket();
  s.on('chart:response_time', cb);
  return () => s.off('chart:response_time', cb);
}

export function onChartErrorRate(cb: (point: ChartPoint) => void): Unsubscribe {
  const s = getSocket();
  s.on('chart:error_rate', cb);
  return () => s.off('chart:error_rate', cb);
}

export function onAlertNew(cb: (alert: AlertData) => void): Unsubscribe {
  const s = getSocket();
  s.on('alert:new', cb);
  return () => s.off('alert:new', cb);
}

export function onAlertResolved(cb: (payload: AlertResolvedPayload) => void): Unsubscribe {
  const s = getSocket();
  s.on('alert:resolved', cb);
  return () => s.off('alert:resolved', cb);
}

export function onAgentPing(cb: (payload: AgentPingPayload) => void): Unsubscribe {
  const s = getSocket();
  s.on('agent:ping', cb);
  return () => s.off('agent:ping', cb);
}

export function onHealthUpdate(cb: (payload: HealthUpdatePayload) => void): Unsubscribe {
  const s = getSocket();
  s.on('health:update', cb);
  return () => s.off('health:update', cb);
}
