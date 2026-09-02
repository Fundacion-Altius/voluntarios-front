'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  placeholder: string;
  replyToId?: string | null;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: (typing: boolean) => void;
  onCancelReply?: () => void;
}

export function ComposeBox({ value, placeholder, replyToId, onChange, onSend, onTyping, onCancelReply }: Props) {
  return (
    <div className="space-y-2">
      {replyToId && (
        <button type="button" className="text-xs text-muted-foreground" onClick={onCancelReply}>
          Respondiendo · cancelar
        </button>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); onTyping(true); }}
          onBlur={() => onTyping(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
        />
        <Button onClick={onSend} disabled={!value.trim()}><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
