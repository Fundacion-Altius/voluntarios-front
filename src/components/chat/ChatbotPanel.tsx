"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { getCSRFToken } from "@/app/lib/csrf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getApiBaseUrl } from "@/lib/apiUrl";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pendingTools?: string[];
}

interface ChatSessionResponse {
  id?: string;
  sessionId?: string;
}

interface ToolCall {
  toolName?: string;
  hitlStatus?: string;
  hitlItemId?: string;
  result?: unknown;
  args?: unknown;
}

interface ChatMessageResponse {
  id?: string;
  role?: string;
  reply?: string;
  content?: string;
  pendingTools?: string[];
  toolCalls?: ToolCall[];
}

async function ensureCsrfCookie(): Promise<void> {
  if (typeof window === "undefined" || getCSRFToken()) return;
  await fetch(`${getApiBaseUrl()}/api/csrf-token`, { credentials: "include" });
}

function authHeaders(authToken?: string): HeadersInit {
  const csrf = getCSRFToken();
  return {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(csrf ? { "X-CSRF-Token": csrf } : {}),
  };
}

function sessionIdFromCreate(data: ChatSessionResponse): string | null {
  if (typeof data.id === "string" && data.id.length > 0) return data.id;
  if (typeof data.sessionId === "string" && data.sessionId.length > 0) {
    return data.sessionId;
  }
  return null;
}

function assistantReplyFromMessage(data: ChatMessageResponse): string {
  if (typeof data.reply === "string") return data.reply;
  if (typeof data.content === "string") return data.content;
  return "";
}

export function pendingToolsFromMessage(
  data: ChatMessageResponse,
): string[] | undefined {
  if (Array.isArray(data.pendingTools)) {
    return data.pendingTools.filter((name): name is string => typeof name === "string");
  }
  if (!Array.isArray(data.toolCalls)) return undefined;
  const pending = data.toolCalls.flatMap((call) =>
    call.hitlStatus === "pending" &&
    typeof call.toolName === "string" &&
    call.toolName.length > 0
      ? [call.toolName]
      : [],
  );
  return pending.length > 0 ? pending : undefined;
}

export function ChatbotPanel() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return <div className="p-4 text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!session) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Debes iniciar sesión para usar el chatbot.
        </p>
      </Card>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setError(null);
    setIsSending(true);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      await ensureCsrfCookie();
      const token = (session as { authToken?: string }).authToken;
      const headers = authHeaders(token);
      const base = getApiBaseUrl();

      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const sessionRes = await fetch(`${base}/api/agent/chat/sessions`, {
          method: "POST",
          headers,
          credentials: "include",
        });
        if (!sessionRes.ok) {
          throw new Error(`Chat API error: ${sessionRes.status}`);
        }
        const created = (await sessionRes.json()) as ChatSessionResponse;
        activeSessionId = sessionIdFromCreate(created);
        if (!activeSessionId) {
          throw new Error("Chat API error: missing session id");
        }
        setSessionId(activeSessionId);
      }

      const res = await fetch(
        `${base}/api/agent/chat/sessions/${activeSessionId}/messages`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ content: text }),
        },
      );

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.status}`);
      }

      const data = (await res.json()) as ChatMessageResponse;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantReplyFromMessage(data),
          pendingTools: pendingToolsFromMessage(data),
        },
      ]);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      setError(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4" data-testid="chatbot-panel">
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Escribe un mensaje para iniciar la conversación con el asistente.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "self-end max-w-[80%] rounded-md bg-primary/10 px-3 py-2 text-sm"
                : "self-start max-w-[80%] rounded-md bg-muted px-3 py-2 text-sm"
            }
          >
            <div className="font-medium text-xs text-muted-foreground">
              {m.role === "user" ? "Tú" : "Asistente"}
            </div>
            <div>{m.content}</div>
            {m.pendingTools && m.pendingTools.length > 0 && (
              <div
                className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900"
                data-testid="hitl-pending-notice"
              >
                Esperando aprobación humana para: {m.pendingTools.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
      {error && (
        <div
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}
      <Textarea
        aria-label="Mensaje al chatbot"
        placeholder="Escribe tu mensaje…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void send();
          }
        }}
        rows={3}
        data-testid="chatbot-input"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          ⌘/Ctrl+Enter para enviar
        </span>
        <Button
          onClick={() => void send()}
          disabled={isSending || !input.trim()}
          data-testid="chatbot-send"
        >
          {isSending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </Card>
  );
}
