'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { BookOpen, CheckCircle, Circle, ChevronRight, Download } from 'lucide-react';

function computeProgress(course: any): { total: number; completed: number; pct: number } {
  const total = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const completed = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.filter((l: any) => l.completed).length || 0), 0) || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct };
}

function renderCourseState(loading: boolean, error: string | null, course: any, t: any, router: any, id: string) {
  if (loading) return <div><LoadingSkeleton rows={4} /></div>;
  if (error && !course) return <div><ErrorState message={error} /><Button variant="outline" className="mt-4" onClick={() => router.push('/portal/cursos')}>{t('volverCursos')}</Button></div>;
  if (!course) return <div><EmptyState title={t('cursoNoEncontrado')} action={<Button variant="outline" onClick={() => router.push('/portal/cursos')}>{t('volverCursos')}</Button>} /></div>;
  return null;
}

function renderEnrollSection(course: any, enrolling: boolean, error: string | null, id: string, t: any, handleEnroll: () => Promise<void>) {
  const progressPct = computeProgress(course).pct;
  if (!course.enrolled) {
    return (
      <Button onClick={handleEnroll} disabled={enrolling}>
        {enrolling ? t('inscribiendo') : t('inscribirse')}
      </Button>
    );
  }
  return (
    <Card>
      <CardHeader><CardTitle>{t('tuProgreso')}</CardTitle></CardHeader>
      <CardContent>
        {course.enrollment_status === 'completed' && (
          <Badge className="mb-3 bg-green-600 text-white">{t('cursoCompletado')}</Badge>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <span className="text-sm font-medium">{progressPct}%</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{computeProgress(course).completed} {t('de')} {computeProgress(course).total} {t('leccionesCompletadas')}</p>
        {progressPct === 100 && (
          <a href={`/api/courses/${id}/certificate`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
            <Button variant="outline" size="sm"><Download className="mr-2 size-4" /> {t('descargarCertificado')}</Button>
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function renderModules(course: any, id: string, t: any) {
  if (!course.modules || course.modules.length === 0) return null;
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">{t('contenidoCurso')}</h2>
      {course.modules.map((mod: any, modIdx: number) => (
        <Card key={mod.id || modIdx}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{mod.title || `${t('modulo')} ${modIdx + 1}`}</CardTitle>
            {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {mod.lessons?.map((lesson: any, lesIdx: number) => (
                <Link key={lesson.id} href={`/portal/cursos/${id}/lecciones/${lesson.id}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                  {lesson.completed ? <CheckCircle className="size-4 shrink-0 text-green-600" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1">{lesson.title || `${t('leccion')} ${lesIdx + 1}`}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CursoDetailPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.cursos');
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
      .then((result) => {
        if (result.success) setCourse(result.data);
        else setError(result.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, session]);

  const handleEnroll = async () => {
    setEnrolling(true); setError(null);
    try {
      const result = await apiClient.post(apiUrl(`/api/courses/${id}/enroll`));
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCourse((prev: any) => ({ ...prev, enrolled: true, enrollment_status: 'enrolled' }));
    } catch (e: any) { setError(e.message); } finally { setEnrolling(false); }
  };

  if (loading) return <div><LoadingSkeleton rows={4} /></div>;
  if (error && !course) return <div><ErrorState message={error} /><Button variant="outline" className="mt-4" onClick={() => router.push('/portal/cursos')}>{t('volverCursos')}</Button></div>;
  if (!course) return <div><EmptyState title={t('cursoNoEncontrado')} action={<Button variant="outline" onClick={() => router.push('/portal/cursos')}>{t('volverCursos')}</Button>} /></div>;

  const { total: totalLessons, completed: completedLessons, pct: progress } = computeProgress(course);

  const courseState = renderCourseState(loading, error, course, t, router, id);
  if (courseState) return courseState;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/portal/cursos')}>
        <ChevronRight className="mr-1 size-4 rotate-180" /> {t('volverCursos')}
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
      {renderEnrollSection(course, enrolling, error, id, t, handleEnroll)}
      {renderModules(course, id, t)}
    </div>
  );
}
