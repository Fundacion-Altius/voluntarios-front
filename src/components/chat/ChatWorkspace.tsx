'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ChatLayout } from '@/components/chat/ChatLayout';
import type { ChannelListItem } from '@/components/chat/ChannelList';
import { LoadingSkeleton, ErrorState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

interface Props {
  selectedId?: string;
  children?: React.ReactNode;
}

export function ChatWorkspace({ selectedId, children }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('portal.mensajes');
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiClient<{ data: ChannelListItem[] }>(apiUrl('/api/chat/channels'))
      .then((d) => setChannels(d.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, session]);

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message={error} />;

  return (
    <ChatLayout
      channels={channels}
      selectedId={selectedId}
      onSelect={(id) => router.push(`/portal/mensajes/${id}`)}
      onCreated={(id) => router.push(`/portal/mensajes/${id}`)}
    >
      {children ?? (
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          {t('eligeCanal')}
        </div>
      )}
    </ChatLayout>
  );
}
