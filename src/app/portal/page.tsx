'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const LEVEL_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-white',
  gold: 'bg-yellow-500 text-white',
  diamond: 'bg-blue-500 text-white',
};

const LEVEL_LABELS: Record<string, string> = {
  bronze: 'Bronce', silver: 'Plata', gold: 'Oro', diamond: 'Diamante',
};

export default function PortalPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const authRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  const fetchHeaders = () => {
    const token = authRef.current;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const headers = fetchHeaders();

    Promise.all([
      fetch(`${API_URL}/api/gamification/profile`, { headers, credentials: 'include' }),
      fetch(`${API_URL}/api/activities/sessions/upcoming`, { headers, credentials: 'include' }),
    ]).then(([profRes, bookRes]) => {
      if (profRes.ok) profRes.json().then(setProfile);
      if (bookRes.ok) bookRes.json().then(setBookings);
    }).catch(() => {}).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleCertificate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/certificate`, { headers: fetchHeaders(), credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCertUrl(url);
      window.open(url, '_blank');
    } catch {}
  };

  const handleShareCard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/share-card`, { headers: fetchHeaders(), credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {}
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full rounded-lg" /><Skeleton className="h-48 w-full rounded-lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Nivel</p>
                <Badge className={LEVEL_COLORS[profile.level] || ''}>{LEVEL_LABELS[profile.level] || profile.level}</Badge>
              </div>
              <div><p className="text-xs text-muted-foreground">Puntos totales</p><p className="text-lg font-bold">{profile.totalPoints}</p></div>
              <div><p className="text-xs text-muted-foreground">Puntos esta semana</p><p className="text-lg font-bold">{profile.weekPoints}</p></div>
              <div><p className="text-xs text-muted-foreground">Racha</p><p className="text-lg font-bold">{profile.currentStreak} semanas</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleCertificate}>Descargar certificado</Button>
              <Button size="sm" variant="outline" onClick={handleShareCard}>Compartir tarjeta</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      {profile?.badges && profile.badges.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Insignias</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b: any) => (
                <Badge key={b.id} variant="secondary">{b.badge_type.replace(/-/g, ' ')}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings */}
      <Card>
        <CardHeader><CardTitle>Mis reservas</CardTitle></CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas próximas.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">{b.shift || 'Turno'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline">{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
