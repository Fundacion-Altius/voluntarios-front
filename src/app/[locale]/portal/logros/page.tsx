'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function LogrosPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.logros');
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const thisFetchId = ++fetchIdRef.current;
    apiClient<any[]>(apiUrl('/api/gamification/badges'))
      .then((result) => {
        if (thisFetchId !== fetchIdRef.current) return;
        if (result.success) setBadges(result.data);
        else setError(result.error);
      })
      .catch((e) => { if (thisFetchId === fetchIdRef.current) setError(e.message); })
      .finally(() => { if (thisFetchId === fetchIdRef.current) setLoading(false); });
  }, [session]);

  if (loading) return <div><PageHeader title={t('titulo')} /><LoadingSkeleton rows={2} /></div>;

  return (
    <div>
      <PageHeader title={t('titulo')} />
      {error ? <ErrorState message={error} /> : badges.length === 0 ? (
        <EmptyState title={t('sinInsignias')} description={t('completaActividades')} />
      ) : (
        <div className="flex flex-wrap gap-3">
          {badges.map((b: any) => (
            <Card key={b.id} className="w-40 text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🏅</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{b.badge_type.replace(/-/g, ' ')}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(b.awarded_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
