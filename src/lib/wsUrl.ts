const DEFAULT_API = 'http://localhost:3001';

function toWsOrigin(raw: string): string {
  const url = new URL(raw);
  const protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}`;
}

/**
 * WebSocket base for notifications/chat. Prefers NEXT_PUBLIC_WS_BASE_URL,
 * else the backend host from NEXT_PUBLIC_API_URL. Never uses the Next
 * front host — Vercel has no /ws, and REST already goes through same-origin /api/*.
 */
export function deriveWsUrl(): string {
  const raw = process.env.NEXT_PUBLIC_WS_BASE_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API;
  try {
    return `${toWsOrigin(raw)}/ws`;
  } catch {
    return 'ws://localhost:3001/ws';
  }
}
