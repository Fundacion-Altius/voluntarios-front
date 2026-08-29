'use client';

import { useTranslations } from 'next-intl';
import { ChannelList, type ChannelListItem } from './ChannelList';
import { CreateChannelModal } from './CreateChannelModal';

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
    <div className="flex min-h-[70vh] overflow-hidden rounded-lg border bg-card">
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b p-3">
          <h1 className="font-heading text-lg font-bold">{t('titulo')}</h1>
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
      <section className="flex min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
