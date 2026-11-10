'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

type VideoMode = 'meeting' | 'livestream';

interface ListedRoom {
  roomId: string;
  contextId?: string;
  status?: string;
}

export default function PortalVideoPage() {
  const t = useTranslations('portal.video');
  const router = useRouter();
  const [contextId, setContextId] = useState('community-demo');
  const [mode, setMode] = useState<VideoMode>('meeting');
  const [rooms, setRooms] = useState<ListedRoom[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const encoded =
        mode === 'livestream' ? `livestream:${contextId.trim() || 'default'}` : `meeting:${contextId.trim() || 'default'}`;
      const res = await apiGet(
        `/api/video/rooms?contextType=community&contextId=${encodeURIComponent(encoded)}`,
      );
      if (!res.ok) {
        setRooms([]);
        return;
      }
      const body = (await res.json()) as { data?: ListedRoom[] };
      setRooms(Array.isArray(body.data) ? body.data : []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [contextId, mode]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const createRoom = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiPost('/api/video/rooms', {
        contextType: 'community',
        contextId: contextId.trim() || 'default',
        mode,
      });
      if (!res.ok) {
        setError(t('errorCreate'));
        return;
      }
      const body = (await res.json()) as { data?: { roomId?: string } };
      const roomId = body.data?.roomId;
      if (!roomId) {
        setError(t('errorCreate'));
        return;
      }
      router.push(`/portal/sala/${roomId}`);
    } catch {
      setError(t('errorCreate'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            placeholder={t('contextPlaceholder')}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant={mode === 'meeting' ? 'secondary' : 'outline'}
              onClick={() => setMode('meeting')}
            >
              {t('modeMeeting')}
            </Button>
            <Button
              type="button"
              variant={mode === 'livestream' ? 'secondary' : 'outline'}
              onClick={() => setMode('livestream')}
            >
              {t('modeLivestream')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === 'livestream' ? t('livestreamHint') : t('meetingHint')}
          </p>
          <Button type="button" onClick={() => void createRoom()} disabled={busy}>
            {busy ? t('creating') : t('create')}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('listTitle')}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadRooms()}>
            {t('refresh')}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : !rooms.length ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <ul className="space-y-2">
              {rooms.map((r) => (
                <li key={r.roomId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono text-xs">{r.roomId}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/portal/sala/${r.roomId}`)}
                  >
                    {t('open')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
