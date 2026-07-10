'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RankingAdminPage() {
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
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/gamification/ranking/admin`, {
        headers: fetchHeaders(), credentials: 'include',
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) { setRankings(data.success ? data.data : data); setIsLoading(false); }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) { setError(err.message); setIsLoading(false); }
    }
  }, [session]);

  useEffect(() => { fetchRankings(); }, [fetchRankings]);

  if (authLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /></div>;
  if (!isAuthenticated) return null;

  const weeklyGroups: Record<string, any[]> = {};
  for (const r of rankings) {
    const key = r.week_start ? new Date(r.week_start).toLocaleDateString() : 'sin-fecha';
    if (!weeklyGroups[key]) weeklyGroups[key] = [];
    weeklyGroups[key].push(r);
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Historial de Ranking Semanal</h2>
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-lg" />))}
        </div>
      ) : Object.keys(weeklyGroups).length === 0 ? (
        <p className="text-muted-foreground">No hay rankings publicados aún.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(weeklyGroups).sort().reverse().map(([week, entries]) => (
            <Card key={week}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Semana del {week}</CardTitle>
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
      )}
    </div>
  );
}
