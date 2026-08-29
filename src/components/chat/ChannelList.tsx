'use client';

import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChannelListItem {
  id: string;
  name: string;
  type: 'direct' | 'group';
  topic?: string | null;
}

interface Props {
  channels: ChannelListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  emptyLabel: string;
  directLabel: string;
  groupLabel: string;
}

export function ChannelList({ channels, selectedId, onSelect, emptyLabel, directLabel, groupLabel }: Props) {
  if (channels.length === 0) {
    return <p className="px-3 py-6 text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-1">
      {channels.map((channel) => (
        <li key={channel.id}>
          <button
            type="button"
            onClick={() => onSelect(channel.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
              selectedId === channel.id && 'bg-primary/10',
            )}
          >
            <MessageSquare className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate font-medium">{channel.name}</span>
            <span className="text-[10px] uppercase text-muted-foreground">
              {channel.type === 'direct' ? directLabel : groupLabel}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
