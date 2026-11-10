'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function RankingPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.ranking');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const thisFetchId = ++fetchIdRef.current;
    apiClient<any>(apiUrl('/api/gamification/ranking'))
      .then((d) => { if (thisFetchId === fetchIdRef.current) setData(d); })
      .catch((e) => { if (thisFetchId === fetchIdRef.current) setError(e.message); })
      .finally(() => { if (thisFetchId === fetchIdRef.current) setLoading(false); });
  }, [session]);

  if (loading) return <div><PageHeader title={t('titulo')} /><LoadingSkeleton rows={3} /></div>;

  const top3 = data?.top3 || [];

  return (
    <div>
      <PageHeader title={t('titulo')} subtitle={t('subtitulo')} />
      {error ? <ErrorState message={error} /> : top3.length === 0 ? (
        <EmptyState title={t('sinDatos')} description={t('participa')} />
      ) : (
        <div className="space-y-3">
          {top3.map((entry: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground">#{idx + 1}</span>
                  <div>
                    <p className="font-medium">{entry.name}</p>
                  </div>
                </div>
                <Badge variant="secondary">{entry.points} pts</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
