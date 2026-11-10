"use client";

import { useEffect, useState } from "react";
import { getCSRFToken } from "@/app/lib/csrf";
import { getApiBaseUrl } from "@/lib/apiUrl";

export const DEFAULT_CHATBOT_DISPLAY_NAME = "Asistente";

type EnsuredChatSession = {
  sessionId: string;
  displayName: string;
};

let cachedSession: EnsuredChatSession | null = null;
let inflight: Promise<EnsuredChatSession> | null = null;

export function resetAgentChatSessionCache() {
  cachedSession = null;
  inflight = null;
}

function readName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sessionRecord(data: unknown): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  if (record.session && typeof record.session === "object") {
    return record.session as Record<string, unknown>;
  }
  return record;
}

/** Reads session.agentIdentity.chatbotDisplayName from a session payload. */
export function chatbotDisplayNameFromSession(data: unknown): string | undefined {
  const session = sessionRecord(data);
  if (!session) return undefined;
  const identity = session.agentIdentity;
  if (!identity || typeof identity !== "object") return undefined;
  return readName((identity as Record<string, unknown>).chatbotDisplayName);
}

export function resolveChatbotDisplayName(data: unknown): string {
  return chatbotDisplayNameFromSession(data) ?? DEFAULT_CHATBOT_DISPLAY_NAME;
}

export function sessionIdFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const session = sessionRecord(data) ?? {};
  for (const record of [session, root]) {
    if (typeof record.id === "string" && record.id.length > 0) return record.id;
    if (typeof record.sessionId === "string" && record.sessionId.length > 0) {
      return record.sessionId;
    }
  }
  return null;
}

async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === "undefined" || getCSRFToken()) return;
  await fetch(`${getApiBaseUrl()}/api/csrf-token`, { credentials: "include" });
}

function authHeaders(authToken?: string, json = false): HeadersInit {
  const csrf = getCSRFToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(csrf ? { "X-CSRF-Token": csrf } : {}),
  };
}

export async function fetchAgentChatSessionById(sessionId: string, authToken?: string): Promise<unknown> {
  const res = await fetch(`${getApiBaseUrl()}/api/agent/chat/sessions/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: authHeaders(authToken),
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }
  return res.json();
}

async function createAgentChatSession(authToken?: string): Promise<unknown> {
  await ensureCsrfCookie();
  const res = await fetch(`${getApiBaseUrl()}/api/agent/chat/sessions`, {
    method: "POST",
    headers: authHeaders(authToken, true),
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }
  return res.json();
}

export async function ensureAgentChatSession(authToken?: string): Promise<EnsuredChatSession> {
  if (cachedSession) return cachedSession;
  if (inflight) return inflight;

  inflight = (async () => {
    const created = await createAgentChatSession(authToken);
    const sessionId = sessionIdFromPayload(created);
    if (!sessionId) {
      throw new Error("Chat API error: missing session id");
    }
    const ensured = {
      sessionId,
      displayName: resolveChatbotDisplayName(created),
    };
    cachedSession = ensured;
    return ensured;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function useChatbotDisplayName(enabled: boolean, authToken?: string) {
  const [displayName, setDisplayName] = useState(DEFAULT_CHATBOT_DISPLAY_NAME);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void ensureAgentChatSession(authToken)
      .then((ensured) => {
        if (!cancelled) setDisplayName(ensured.displayName);
      })
      .catch(() => {
        // Keep Asistente when session create/GET fails.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, authToken]);

  return { displayName, setDisplayName };
}
