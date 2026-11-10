'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { deriveWsUrl } from '@/lib/wsUrl';

const POLL_MS = 3000;
const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30000;

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

function nextDelay(attempt: number): number {
  const exp = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** Math.max(0, attempt));
  return exp;
}

export function useStaffChat({ channelId, authToken, onEvent, onPoll }: Options) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const intentionalCloseRef = useRef(false);
  const attemptRef = useRef(0);

  const clearReconnect = useCallback(() => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!authToken || !channelId || !mountedRef.current) return;
    intentionalCloseRef.current = false;
    clearReconnect();

    const ws = new WebSocket(`${deriveWsUrl()}?token=${encodeURIComponent(authToken)}`);
    ws.onopen = () => {
      if (!mountedRef.current) {
        intentionalCloseRef.current = true;
        ws.close();
        return;
      }
      attemptRef.current = 0;
      setConnected(true);
      ws.send(JSON.stringify({ type: 'staff.subscribe', channelId }));
    };
    ws.onmessage = (event) => {
      try {
        onEvent(JSON.parse(event.data));
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      wsRef.current = null;
      if (intentionalCloseRef.current) return;
      const delay = nextDelay(attemptRef.current);
      attemptRef.current += 1;
      reconnectRef.current = setTimeout(connect, delay);
    };
    wsRef.current = ws;
  }, [authToken, channelId, onEvent, clearReconnect]);

  useEffect(() => {
    mountedRef.current = true;
    intentionalCloseRef.current = false;
    attemptRef.current = 0;
    connect();
    return () => {
      mountedRef.current = false;
      intentionalCloseRef.current = true;
      clearReconnect();
      if (wsRef.current?.readyState === WebSocket.OPEN && channelId) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'staff.unsubscribe', channelId }));
        } catch {
          /* ignore */
        }
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect, channelId, clearReconnect]);

  useEffect(() => {
    if (connected || !channelId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => onPoll?.(), POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [connected, channelId, onPoll]);

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (!channelId || wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ type: typing ? 'typing:start' : 'typing:stop', channelId }));
    },
    [channelId],
  );

  const sendRead = useCallback(
    (messageId: string) => {
      if (!channelId || wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ type: 'message:read', channelId, messageId }));
    },
    [channelId],
  );

  return { connected, sendTyping, sendRead };
}
