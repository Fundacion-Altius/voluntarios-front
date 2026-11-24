'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { getApiBaseUrl } from '@/lib/apiUrl';
import { readApiError } from '@/lib/errorMessage';

const API_URL = getApiBaseUrl();

function groupByWeek(rankings: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const r of rankings) {
    const key = r.week_start ? new Date(r.week_start).toLocaleDateString() : 'sin-fecha';
    (groups[key] ??= []).push(r);
  }
  return groups;
}

function RankingGroups({ groups }: { groups: Record<string, any[]> }) {
  const t = useTranslations('admin.ranking');
  return (
    <div className="space-y-6">
      {Object.entries(groups).sort().reverse().map(([week, entries]) => (
        <Card key={week}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('semanaDel')} {week}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.sort((a: any, b: any) => (a.position || 99) - (b.position || 99)).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted-foreground">#{entry.position}</span>
                    <span>{entry.user_id.slice(0, 8)}</span>
                  </div>
                  <Badge variant="secondary">{entry.points} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RankingBody({ isLoading, groups }: { isLoading: boolean; groups: Record<string, any[]> }) {
  const t = useTranslations('admin.ranking');
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-lg" />))}
      </div>
    );
  }
  if (Object.keys(groups).length === 0) return <p className="text-muted-foreground">{t('noHayRankings')}</p>;
  return <RankingGroups groups={groups} />;
}

export default function RankingAdminPage() {
  const t = useTranslations('admin.ranking');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {}; if (token) h['Authorization'] = `Bearer ${token}`; return h;
  };

  const fetchRankings = useCallback(async () => {
    const thisFetchId = ++fetchIdRef.current;
    const isLatest = () => thisFetchId === fetchIdRef.current;
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/gamification/ranking/admin`, {
        headers: fetchHeaders(), credentials: 'include',
      });
      if (!res.ok) {
        setError(await readApiError(res, 'Error'));
        if (isLatest()) setIsLoading(false);
        return;
      }
      const data = await res.json();
      if (isLatest()) { setRankings(data.success ? data.data : data); setIsLoading(false); }
    } catch (err: any) {
      if (isLatest()) { setError(err.message); setIsLoading(false); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { fetchRankings(); }, [fetchRankings]);

  if (authLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /></div>;
  if (!isAuthenticated) return null;

  const weeklyGroups = groupByWeek(rankings);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t('historial')}</h2>
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <RankingBody isLoading={isLoading} groups={weeklyGroups} />
    </div>
  );
}
