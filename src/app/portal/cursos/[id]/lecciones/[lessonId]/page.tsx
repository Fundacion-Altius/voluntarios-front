'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function LeccionPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  useEffect(() => {
    if (!courseId || !lessonId) return;
    const thisFetchId = ++fetchIdRef.current;
    fetch(`${API_URL}/api/cursos/${courseId}`, {
      headers: fetchHeaders(),
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar la lección');
        return res.json();
      })
      .then((data) => {
        if (thisFetchId === fetchIdRef.current) setCourse(data.success ? data.data : data);
      })
      .catch((err) => {
        if (thisFetchId === fetchIdRef.current) setError(err.message);
      })
      .finally(() => {
        if (thisFetchId === fetchIdRef.current) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId, session]);

  const allLessons = course?.modules?.flatMap((m: any) => m.lessons || []) || [];
  const currentIndex = allLessons.findIndex((l: any) => String(l.id) === String(lessonId));
  const lesson = allLessons[currentIndex] || null;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleComplete = async () => {
    setCompleting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...fetchHeaders() },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al marcar como completada');
      setCourse((prev: any) => {
        const updated = { ...prev };
        updated.modules = updated.modules.map((m: any) => ({
          ...m,
          lessons: m.lessons?.map((l: any) =>
            String(l.id) === String(lessonId) ? { ...l, completed: true } : l
          ),
        }));
        return updated;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || 'Lección no encontrada.'}</p>
        <Button variant="outline" onClick={() => router.push(`/portal/cursos/${courseId}`)}>Volver al curso</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/portal/cursos/${courseId}`)}>
        <ArrowLeft className="mr-1 size-4" /> Volver al curso
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-1 text-muted-foreground">{lesson.description}</p>
          )}
        </div>
        {lesson.completed && (
          <Badge className="shrink-0 bg-green-600 text-white">
            <CheckCircle className="mr-1 size-3" /> Completada
          </Badge>
        )}
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card>
        <CardContent className="pt-6">
          {lesson.content_type === 'video' && (
            <div className="aspect-video w-full">
              <iframe
                src={lesson.content_url}
                className="h-full w-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {lesson.content_type === 'text' && lesson.content && (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          )}

          {lesson.content_type === 'quiz' && (() => {
            let quiz;
            try {
              quiz = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
            } catch {
              return <p className="text-destructive">Error al cargar el cuestionario.</p>;
            }
            return (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{quiz.question || lesson.title}</h3>
                <div className="space-y-2">
                  {quiz.options?.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className="cursor-pointer rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {!lesson.completed && (
        <Button onClick={handleComplete} disabled={completing} className="w-full">
          {completing ? 'Guardando...' : 'Marcar como completada'}
        </Button>
      )}

      <div className="flex items-center justify-between">
        {prevLesson ? (
          <Link href={`/portal/cursos/${courseId}/lecciones/${prevLesson.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-1 size-4" /> Anterior
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link href={`/portal/cursos/${courseId}/lecciones/${nextLesson.id}`}>
            <Button variant="outline">
              Siguiente <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
