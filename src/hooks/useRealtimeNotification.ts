'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

function deriveWsUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }
  }
  try {
    const url = new URL(API_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  } catch {
    return 'ws://localhost:3001/ws';
  }
}

const WS_URL = deriveWsUrl();
const RECONNECT_DELAY = 5000;

export interface RealtimeNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
}

interface UseRealtimeNotificationOptions {
  authToken: string | undefined;
  onNotification?: (notification: RealtimeNotification) => void;
}

export function useRealtimeNotification({ authToken, onNotification }: UseRealtimeNotificationOptions) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!authToken) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(authToken)}`);

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      setConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification' && msg.data) {
          onNotification?.(msg.data as RealtimeNotification);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      // onclose will fire after this, which handles reconnection
    };

    wsRef.current = ws;
  }, [authToken, onNotification]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { connected };
}
