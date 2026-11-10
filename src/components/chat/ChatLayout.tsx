'use client';

import { useTranslations } from 'next-intl';
import { ChannelList, type ChannelListItem } from './ChannelList';
import { CreateChannelModal } from './CreateChannelModal';
import { cn } from '@/lib/utils';

interface Props {
  channels: ChannelListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreated: (id: string) => void;
  children: React.ReactNode;
}

export function ChatLayout({ channels, selectedId, onSelect, onCreated, children }: Props) {
  const t = useTranslations('portal.mensajes');
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-lg border bg-card md:min-h-[70vh] md:flex-row">
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col border-b md:w-64 md:border-b-0 md:border-r',
          selectedId && 'hidden md:flex',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <h1 className="min-w-0 truncate font-heading text-lg font-bold">{t('titulo')}</h1>
          <CreateChannelModal onCreated={onCreated} />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ChannelList
            channels={channels}
            selectedId={selectedId}
            onSelect={onSelect}
            emptyLabel={t('sinConversaciones')}
            directLabel={t('directo')}
            groupLabel={t('grupal')}
          />
        </div>
      </aside>
      <section className={cn('flex min-w-0 min-h-0 flex-1 flex-col', !selectedId && 'hidden md:flex')}>{children}</section>
    </div>
  );
}
