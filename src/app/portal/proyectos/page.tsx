'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planificación', active: 'Activo', on_hold: 'En pausa', completed: 'Completado',
};

export default function ProyectosPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<{ data: any[] }>(apiUrl('/api/community/projects'))
      .then((d) => setProjects(d.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) return <div><PageHeader title="Mis Proyectos" /><LoadingSkeleton rows={3} /></div>;
  if (error) return <div><PageHeader title="Mis Proyectos" /><ErrorState message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Proyectos"
        action={<Button onClick={() => router.push('/portal/proyectos/nuevo')}><Plus className="mr-1 size-4" /> Nuevo proyecto</Button>}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={<Users className="size-12 text-muted-foreground" />}
          title="No tienes proyectos todavía"
          action={<Button onClick={() => router.push('/portal/proyectos/nuevo')}>Crear primer proyecto</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p: any) => (
            <Card key={p.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(`/portal/proyectos/${p.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <Badge className={`${STATUS_LABELS[p.status] ? '' : ''}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {p.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
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
