'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LogrosPage() {
  const { data: session } = useSession();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {}; if (token) h['Authorization'] = `Bearer ${token}`; return h;
  };

  useEffect(() => {
    const thisFetchId = ++fetchIdRef.current;
    fetch(`${API_URL}/api/gamification/badges`, { headers: fetchHeaders(), credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { if (thisFetchId === fetchIdRef.current) setBadges(data.success ? data.data : data); })
      .finally(() => { if (thisFetchId === fetchIdRef.current) setLoading(false); });
  }, [session]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full rounded-lg" /></div>;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Mis insignias</h2>
      {badges.length === 0 ? (
        <p className="text-muted-foreground">Todavía no has ganado ninguna insignia.</p>
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
