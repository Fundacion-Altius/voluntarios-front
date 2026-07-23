'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RankingPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {}; if (token) h['Authorization'] = `Bearer ${token}`; return h;
  };

  useEffect(() => {
    const thisFetchId = ++fetchIdRef.current;
    fetch(`${API_URL}/api/gamification/ranking`, { headers: fetchHeaders(), credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (thisFetchId === fetchIdRef.current) setData(d); })
      .finally(() => { if (thisFetchId === fetchIdRef.current) setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full rounded-lg" /></div>;

  const top3 = data?.top3 || [];

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Ranking semanal</h2>
      {top3.length === 0 ? (
        <p className="text-muted-foreground">Aún no hay datos de ranking esta semana.</p>
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
