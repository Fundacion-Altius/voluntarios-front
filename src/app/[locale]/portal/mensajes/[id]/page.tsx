'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ChatWorkspace } from '@/components/chat/ChatWorkspace';
import { ComposeBox } from '@/components/chat/ComposeBox';
import { MemberList } from '@/components/chat/MemberList';
import { MessageThread } from '@/components/chat/MessageThread';
import { useStaffChat, type StaffChatEvent } from '@/hooks/useStaffChat';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { LoadingSkeleton, EmptyState } from '@/components/portal/StateViews';

interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group';
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reply_to_id?: string | null;
  reads?: Array<{ user_id: string }>;
}

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('portal.chat');
  const { data: session } = useSession();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<Array<{ user_id: string; role: string }>>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const authToken = (session as { authToken?: string } | null)?.authToken;

  const reloadMessages = useCallback(async () => {
    const page = await apiClient<{ data: ChatMessage[] }>(apiUrl(`/api/chat/channels/${id}/messages?limit=50`));
    setMessages(page.data || []);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient<Channel>(apiUrl(`/api/chat/channels/${id}`)),
      apiClient<{ data: Array<{ user_id: string; role: string }> }>(apiUrl(`/api/chat/channels/${id}/members`)),
      apiClient<{ data: ChatMessage[] }>(apiUrl(`/api/chat/channels/${id}/messages?limit=50`)),
    ])
      .then(([c, m, msgs]) => {
        setChannel(c);
        setMembers(m.data || []);
        setMessages(msgs.data || []);
      })
      .catch(() => setChannel(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onEvent = useCallback((event: StaffChatEvent) => {
    if (event.type === 'message:new' && event.id) {
      setMessages((prev) => prev.some((m) => m.id === event.id) ? prev : [...prev, event as unknown as ChatMessage]);
    }
    if (event.type === 'typing:start' && event.userId !== currentUserId) setTypingUser(event.userId ?? null);
    if (event.type === 'typing:stop') setTypingUser(null);
    if (event.type === 'message:read' && event.messageId && event.userId) {
      setMessages((prev) => prev.map((m) => (
        m.id === event.messageId
          ? { ...m, reads: [...(m.reads ?? []), { user_id: event.userId as string }] }
          : m
      )));
    }
    if (event.type === 'presence:update' && event.userId) {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (event.online) next.add(event.userId as string);
        else next.delete(event.userId as string);
        return next;
      });
    }
  }, [currentUserId]);

  const { sendTyping, sendRead } = useStaffChat({
    channelId: id,
    authToken,
    onEvent,
    onPoll: reloadMessages,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.sender_id !== currentUserId) {
      void apiClient(apiUrl(`/api/chat/messages/${last.id}/read`), { method: 'POST', body: '{}' });
      sendRead(last.id);
    }
  }, [messages, currentUserId, sendRead]);

  async function send() {
    if (!draft.trim()) return;
    await apiClient(apiUrl(`/api/chat/channels/${id}/messages`), {
      method: 'POST',
      body: JSON.stringify({ content: draft.trim(), replyToId }),
    });
    setDraft('');
    setReplyToId(null);
    sendTyping(false);
  }

  const thread = loading ? (
    <LoadingSkeleton rows={3} />
  ) : !channel ? (
    <EmptyState title={t('conversacionNoEncontrada')} />
  ) : (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b px-4 py-3">
          <h2 className="font-heading font-semibold">{channel.name}</h2>
          <p className="text-xs text-muted-foreground">{channel.type === 'direct' ? t('directo') : t('grupal')}</p>
        </div>
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <MessageThread
            messages={messages}
            currentUserId={currentUserId}
            emptyLabel={t('sinMensajes')}
            onReply={setReplyToId}
          />
        </div>
        {typingUser && <p className="px-4 text-xs text-muted-foreground">{t('escribiendo')}</p>}
        <div className="border-t p-3">
          <ComposeBox
            value={draft}
            placeholder={t('escribeMensaje')}
            replyToId={replyToId}
            onChange={setDraft}
            onSend={() => void send()}
            onTyping={sendTyping}
            onCancelReply={() => setReplyToId(null)}
          />
        </div>
      </div>
      {channel.type === 'group' && (
        <MemberList members={members} onlineIds={onlineIds} title={t('miembros')} />
      )}
    </div>
  );

  return <ChatWorkspace selectedId={id}>{thread}</ChatWorkspace>;
}
