"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/apiUrl";

export const DEFAULT_CHATBOT_DISPLAY_NAME = "Asistente";

const NAME_KEYS = ["chatbotDisplayName", "chatbot_display_name"] as const;
const NEST_KEYS = ["tenant", "settings", "user", "data"] as const;
const NAME_ENDPOINTS = ["/api/auth/me", "/api/tenants/current"] as const;

function readName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function chatbotDisplayNameFromPayload(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  for (const key of NAME_KEYS) {
    const name = readName(record[key]);
    if (name) return name;
  }
  for (const key of NEST_KEYS) {
    const nested = chatbotDisplayNameFromPayload(record[key]);
    if (nested) return nested;
  }
  return undefined;
}

export function resolveChatbotDisplayName(data: unknown): string {
  return chatbotDisplayNameFromPayload(data) ?? DEFAULT_CHATBOT_DISPLAY_NAME;
}

function authHeaders(authToken?: string): HeadersInit {
  return {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export async function fetchChatbotDisplayName(authToken?: string): Promise<string | undefined> {
  const base = getApiBaseUrl();
  for (const path of NAME_ENDPOINTS) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "GET",
        headers: authHeaders(authToken),
        credentials: "include",
      });
      if (!res.ok) continue;
      const data: unknown = await res.json();
      const name = chatbotDisplayNameFromPayload(data);
      if (name) return name;
    } catch {
      // Try the next known source (me, then tenant settings).
    }
  }
  return undefined;
}

export function useChatbotDisplayName(enabled: boolean, authToken?: string) {
  const [displayName, setDisplayName] = useState(DEFAULT_CHATBOT_DISPLAY_NAME);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchChatbotDisplayName(authToken).then((name) => {
      if (!cancelled && name) setDisplayName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, authToken]);

  return { displayName, setDisplayName };
}
