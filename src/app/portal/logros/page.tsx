'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function LogrosPage() {
  const { data: session } = useSession();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const thisFetchId = ++fetchIdRef.current;
    apiClient<any[]>(apiUrl('/api/gamification/badges'))
      .then((data) => { if (thisFetchId === fetchIdRef.current) setBadges(data); })
      .catch((e) => { if (thisFetchId === fetchIdRef.current) setError(e.message); })
      .finally(() => { if (thisFetchId === fetchIdRef.current) setLoading(false); });
  }, [session]);

  if (loading) return <div><PageHeader title="Mis insignias" /><LoadingSkeleton rows={2} /></div>;

  return (
    <div>
      <PageHeader title="Mis insignias" />
      {error ? <ErrorState message={error} /> : badges.length === 0 ? (
        <EmptyState title="Todavía no has ganado ninguna insignia" description="Completa actividades y cursos para ganar insignias." />
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
