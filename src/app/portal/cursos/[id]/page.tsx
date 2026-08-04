'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { BookOpen, CheckCircle, Circle, ChevronRight } from 'lucide-react';

export default function CursoDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient<any>(apiUrl(`/api/courses/${id}`))
      .then((data) => setCourse(data.success ? data.data : data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, session]);

  const handleEnroll = async () => {
    setEnrolling(true); setError(null);
    try {
      await apiClient<any>(apiUrl(`/api/courses/${id}/enroll`), { method: 'POST' });
      setCourse((prev: any) => ({ ...prev, enrolled: true }));
    } catch (e: any) { setError(e.message); } finally { setEnrolling(false); }
  };

  if (loading) return <div><LoadingSkeleton rows={4} /></div>;
  if (error && !course) return <div><ErrorState message={error} /><Button variant="outline" className="mt-4" onClick={() => router.push('/portal/cursos')}>Volver a cursos</Button></div>;
  if (!course) return <div><EmptyState title="Curso no encontrado" action={<Button variant="outline" onClick={() => router.push('/portal/cursos')}>Volver a cursos</Button>} /></div>;

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completedLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.filter((l: any) => l.completed).length || 0), 0) || 0;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/portal/cursos')}>
        <ChevronRight className="mr-1 size-4 rotate-180" /> Volver a cursos
      </Button>
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-semibold">{course.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {course.level && <Badge variant="secondary">{course.level}</Badge>}
              {course.category && <Badge variant="outline">{course.category}</Badge>}
            </div>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">{course.description}</p>
      </div>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {course.enrolled ? (
        <Card>
          <CardHeader><CardTitle>Tu progreso</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{completedLessons} de {totalLessons} lecciones completadas</p>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={handleEnroll} disabled={enrolling}>{enrolling ? 'Inscribiendo...' : 'Inscribirse'}</Button>
      )}
      {course.modules && course.modules.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Contenido del curso</h2>
          {course.modules.map((mod: any, modIdx: number) => (
            <Card key={mod.id || modIdx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{mod.title || `Módulo ${modIdx + 1}`}</CardTitle>
                {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {mod.lessons?.map((lesson: any, lesIdx: number) => (
                    <Link key={lesson.id} href={`/portal/cursos/${id}/lecciones/${lesson.id}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                      {lesson.completed ? <CheckCircle className="size-4 shrink-0 text-green-600" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
                      <span className="flex-1">{lesson.title || `Lección ${lesIdx + 1}`}</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
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
