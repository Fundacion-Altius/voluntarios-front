'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const authRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  useEffect(() => {
    if (!id || !authRef.current) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${authRef.current}` };
    Promise.all([
      fetch(`${API_URL}/api/community/conversations/${id}`, { headers, credentials: 'include' }),
      fetch(`${API_URL}/api/community/conversations/${id}/messages`, { headers, credentials: 'include' }),
    ])
      .then(([cRes, mRes]) => Promise.all([
        cRes.ok ? cRes.json() : null,
        mRes.ok ? mRes.json() : { data: [] },
      ]))
      .then(([c, m]) => {
        setConversation(c);
        setMessages(m.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const handleIncomingMessage = useCallback((msg: any) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useRealtimeChat({
    conversationId: id,
    authToken: authRef.current,
    onMessage: handleIncomingMessage,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authRef.current}`,
    };
    const res = await fetch(`${API_URL}/api/community/conversations/${id}/messages`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ body: newMessage.trim() }),
    });
    if (res.ok) {
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return (<div className="space-y-4"><Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-96 w-full rounded-lg" /></div>);
  if (!conversation) return <p className="text-muted-foreground">Conversación no encontrada.</p>;

  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/portal/proyectos/mensajes')}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">{conversation.title || 'Conversación'}</h1>
      </div>

      {/* Messages */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <div ref={scrollRef} className="flex h-[60vh] flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg: any) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      isOwn
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-muted'
                    }`}
                  >
                    <p>{msg.body}</p>
                    <p className={`mt-1 text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">Sin mensajes. ¡Empieza la conversación!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}