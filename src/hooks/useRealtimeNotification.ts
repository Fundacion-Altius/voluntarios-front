'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

function deriveWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_WS_BASE_URL}/ws`;
  }
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
  const intentionalCloseRef = useRef(false);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  const authTokenRef = useRef(authToken);
  authTokenRef.current = authToken;

  const connect = useCallback(() => {
    const token = authTokenRef.current;
    if (!token) return;
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    intentionalCloseRef.current = false;
    const ws = new WebSocket(`${deriveWsUrl()}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        intentionalCloseRef.current = true;
        ws.close();
        return;
      }
      setConnected(true);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification' && msg.data) {
          onNotificationRef.current?.(msg.data as RealtimeNotification);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      setConnected(false);
      if (!mountedRef.current || intentionalCloseRef.current) return;
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      // onclose will fire after this, which handles reconnection
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!authToken) return undefined;
    connect();

    return () => {
      mountedRef.current = false;
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [authToken, connect]);

  return { connected };
}
