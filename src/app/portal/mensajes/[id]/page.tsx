'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { LoadingSkeleton, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient<any>(apiUrl(`/api/community/conversations/${id}`)),
      apiClient<{ data: any[] }>(apiUrl(`/api/community/conversations/${id}/messages`)),
    ])
      .then(([c, m]) => { setConversation(c); setMessages(m.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const handleIncomingMessage = useCallback((msg: any) => {
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  const authToken = (session as any)?.authToken;
  useRealtimeChat({ conversationId: id, authToken, onMessage: handleIncomingMessage });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await apiClient<any>(apiUrl(`/api/community/conversations/${id}/messages`), {
        method: 'POST',
        body: JSON.stringify({ body: newMessage.trim() }),
      });
      setNewMessage('');
    } catch { /* silent */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) return <div className="p-4"><LoadingSkeleton rows={2} /></div>;
  if (!conversation) return <div className="p-4"><EmptyState title="Conversación no encontrada" /></div>;

  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/portal/mensajes')}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-xl font-bold">{conversation.title || 'Conversación'}</h1>
      </div>
      <Card className="flex-1">
        <CardContent className="p-0">
          <div ref={scrollRef} className="flex h-[60vh] flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg: any) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isOwn ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted'}`}>
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
      <div className="flex gap-2">
        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribe un mensaje..." className="flex-1" />
        <Button onClick={sendMessage} disabled={!newMessage.trim()}><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
