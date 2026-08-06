'use client';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function ProyectosPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('portal.proyectos');
  const STATUS_LABELS: Record<string, string> = {
    planning: t('planificacion'), active: t('activo'), on_hold: t('enPausa'), completed: t('completado'),
  };
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient<{ data: any[] }>(apiUrl('/api/community/projects'))
      .then((d) => setProjects(d.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) return <div><PageHeader title={t('titulo')} /><LoadingSkeleton rows={3} /></div>;
  if (error) return <div><PageHeader title={t('titulo')} /><ErrorState message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('titulo')}
        action={<Button onClick={() => router.push('/portal/proyectos/nuevo')}><Plus className="mr-1 size-4" /> {t('nuevoProyecto')}</Button>}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={<Users className="size-12 text-muted-foreground" />}
          title={t('sinProyectos')}
          action={<Button onClick={() => router.push('/portal/proyectos/nuevo')}>{t('crearPrimero')}</Button>}
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
                  <span>{p.member_count || 0} {t('miembros')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
