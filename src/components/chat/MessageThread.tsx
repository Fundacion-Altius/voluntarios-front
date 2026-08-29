'use client';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reply_to_id?: string | null;
  reads?: Array<{ user_id: string }>;
}

interface Props {
  messages: ChatMessage[];
  currentUserId?: string;
  emptyLabel: string;
  onReply?: (id: string) => void;
}

export function MessageThread({ messages, currentUserId, emptyLabel, onReply }: Props) {
  if (messages.length === 0) {
    return <p className="m-auto text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <>
      {messages.map((msg) => {
        const isOwn = msg.sender_id === currentUserId;
        const readCount = msg.reads?.length ?? 0;
        return (
          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <button type="button" className="max-w-[75%] text-left" onClick={() => onReply?.(msg.id)}>
              <div className={`rounded-2xl px-4 py-2 text-sm ${isOwn ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted'}`}>
                {msg.reply_to_id && <p className="mb-1 text-[10px] opacity-70">↩</p>}
                <p>{msg.content}</p>
                <p className={`mt-1 text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {new Date(msg.created_at).toLocaleString()}
                  {isOwn && readCount > 0 ? ` · ✓✓ ${readCount}` : ''}
                </p>
              </div>
            </button>
          </div>
        );
      })}
    </>
  );
}
