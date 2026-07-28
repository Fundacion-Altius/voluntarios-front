'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

interface Profile {
  level: string;
  totalPoints: number;
  weekPoints: number;
  currentStreak: number;
  badges: { id: string; badge_type: string }[];
}

interface Booking {
  id: string;
  date: string;
  shift: string;
  status: string;
}

function levelBadgeClass(level: string): string {
  const map: Record<string, string> = {
    bronze: 'bg-amber-700 text-white',
    silver: 'bg-gray-400 text-white',
    gold: 'bg-yellow-500 text-white',
    diamond: 'bg-blue-500 text-white',
  };
  return map[level] || '';
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    bronze: 'Bronce', silver: 'Plata', gold: 'Oro', diamond: 'Diamante',
  };
  return map[level] || level;
}

function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Card>
      <CardHeader><CardTitle>Mi Perfil</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Nivel</p>
            <Badge className={levelBadgeClass(profile.level)}>{levelLabel(profile.level)}</Badge>
          </div>
          <div><p className="text-xs text-muted-foreground">Puntos totales</p><p className="text-lg font-bold">{profile.totalPoints}</p></div>
          <div><p className="text-xs text-muted-foreground">Puntos esta semana</p><p className="text-lg font-bold">{profile.weekPoints}</p></div>
          <div><p className="text-xs text-muted-foreground">Racha</p><p className="text-lg font-bold">{profile.currentStreak} semanas</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingsCard({ bookings }: { bookings: Booking[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Mis reservas</CardTitle></CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes reservas próximas.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
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
  );
}

export default function PortalPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const authRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  useEffect(() => {
    apiClient<Profile>(apiUrl('/api/gamification/profile'))
      .then(setProfile)
      .catch((e) => setProfileError(e.message))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    apiClient<Booking[]>(apiUrl('/api/activities/upcoming'))
      .then(setBookings)
      .catch((e) => setBookingsError(e.message))
      .finally(() => setBookingsLoading(false));
  }, []);

  useEffect(() => {
    apiClient<{ data: any[] }>(apiUrl('/api/blog/posts?page=1&pageSize=5'))
      .then((d) => setRecentPosts(d.data || []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, []);

  useEffect(() => {
    apiClient<any[]>(apiUrl('/api/courses/my-enrollments'))
      .then(setMyCourses)
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  const handleCertificate = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/certificate`, { credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setCertUrl(url);
      window.open(url, '_blank');
    } catch {}
  }, []);

  const handleShareCard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/share-card`, { credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {}
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Mi Panel" subtitle="Bienvenido a tu portal de voluntariado" />

      {profileLoading ? <LoadingSkeleton rows={1} /> : profileError ? <ErrorState message={profileError} /> : profile && (
        <Card>
          <CardHeader><CardTitle>Mi Perfil</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Nivel</p>
                <Badge className={levelBadgeClass(profile.level)}>{levelLabel(profile.level)}</Badge>
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

      {profile?.badges && profile.badges.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Insignias</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b) => (
                <Badge key={b.id} variant="secondary">{b.badge_type.replace(/-/g, ' ')}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {postsLoading ? <LoadingSkeleton rows={1} /> : recentPosts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas noticias</CardTitle>
            <a href="/portal/noticias" className="text-sm text-primary hover:underline">Ver más</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPosts.slice(0, 3).map((post: any) => (
                <a key={post.id} href={`/portal/noticias/${post.slug}`} className="block rounded-md border p-3 transition-colors hover:bg-muted/50">
                  <p className="text-sm font-medium">{post.title}</p>
                  {post.excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {coursesLoading ? <LoadingSkeleton rows={1} /> : myCourses.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis cursos</CardTitle>
            <a href="/portal/cursos" className="text-sm text-primary hover:underline">Ver más</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myCourses.slice(0, 3).map((enrollment: any) => (
                <a key={enrollment.id} href={`/portal/cursos/${enrollment.course_id}`} className="block rounded-md border p-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{enrollment.course_title || 'Curso'}</p>
                    <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                      {enrollment.status === 'completed' ? 'Completado' : `${enrollment.progress_pct}%`}
                    </Badge>
                  </div>
                  {enrollment.progress_pct > 0 && (
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${enrollment.progress_pct}%` }} />
                    </div>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {bookingsLoading ? <LoadingSkeleton rows={1} /> : bookingsError ? <ErrorState message={bookingsError} /> : <BookingsCard bookings={bookings} />}
    </div>
  );
}
