'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();
const POLL_MS = 3000;
const RECONNECT_DELAY = 5000;

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

export interface StaffChatEvent {
  type: string;
  id?: string;
  channelId?: string;
  channel_id?: string;
  userId?: string;
  messageId?: string;
  content?: string;
  sender_id?: string;
  created_at?: string;
  online?: boolean;
}

interface Options {
  channelId: string | undefined;
  authToken: string | undefined;
  onEvent: (event: StaffChatEvent) => void;
  onPoll?: () => void;
}

export function useStaffChat({ channelId, authToken, onEvent, onPoll }: Options) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!authToken || !channelId) return;
    const ws = new WebSocket(`${deriveWsUrl()}?token=${encodeURIComponent(authToken)}`);
    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      setConnected(true);
      ws.send(JSON.stringify({ type: 'staff.subscribe', channelId }));
    };
    ws.onmessage = (event) => {
      try { onEvent(JSON.parse(event.data)); } catch { /* ignore */ }
    };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      wsRef.current = null;
      reconnectRef.current = setTimeout(connect, RECONNECT_DELAY);
    };
    wsRef.current = ws;
  }, [authToken, channelId, onEvent]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current?.readyState === WebSocket.OPEN && channelId) {
        wsRef.current.send(JSON.stringify({ type: 'staff.unsubscribe', channelId }));
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, channelId]);

  useEffect(() => {
    if (connected || !channelId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => onPoll?.(), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [connected, channelId, onPoll]);

  const sendTyping = useCallback((typing: boolean) => {
    if (!channelId || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: typing ? 'typing:start' : 'typing:stop', channelId }));
  }, [channelId]);

  const sendRead = useCallback((messageId: string) => {
    if (!channelId || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message:read', channelId, messageId }));
  }, [channelId]);

  return { connected, sendTyping, sendRead };
}
