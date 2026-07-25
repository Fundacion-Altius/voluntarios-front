'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Users } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación',
  active: 'Activo',
  on_hold: 'En pausa',
  completed: 'Completado',
};

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-orange-100 text-orange-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function ProyectosPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const authRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  useEffect(() => {
    const token = authRef.current;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_URL}/api/community/projects`, { headers, credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setProjects(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full rounded-lg" /><Skeleton className="h-32 w-full rounded-lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Proyectos</h1>
        <Button onClick={() => router.push('/portal/proyectos/nuevo')}>
          <Plus className="mr-1 size-4" /> Nuevo proyecto
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Users className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">No tienes proyectos todavía.</p>
            <Button onClick={() => router.push('/portal/proyectos/nuevo')}>
              Crear primer proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p: any) => (
            <Card
              key={p.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/portal/proyectos/${p.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <Badge className={STATUS_COLORS[p.status] || ''}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {p.description && (
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  <span>{p.member_count || 0} miembros</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}