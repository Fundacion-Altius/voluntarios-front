'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { LessonRichText } from '@/components/portal/LessonRichText';

function QuizComponent({ quiz, lessonTitle }: { quiz: any; lessonTitle: string }) {
  const t = useTranslations('portal.leccion');
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correctIndex = quiz.correct ?? quiz.answer ?? 0;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const getOptionClassName = (i: number): string => {
    let className = 'cursor-pointer rounded-md border p-3 text-sm transition-colors ';
    if (!submitted) {
      className += selected === i ? 'border-primary bg-primary/5' : 'hover:bg-muted/50';
    } else {
      if (i === correctIndex) className += 'border-green-500 bg-green-50 text-green-800';
      else if (i === selected && i !== correctIndex) className += 'border-destructive bg-destructive/5 text-destructive';
      else className += 'opacity-60';
    }
    return className;
  };

  const getResultIcon = (i: number) => {
    if (!submitted) return null;
    if (i === correctIndex) return <Check className="size-4 text-green-600" />;
    if (i === selected && i !== correctIndex) return <X className="size-4 text-destructive" />;
    return null;
  };

  const resultMessage = submitted
    ? selected === correctIndex
      ? t('correcto')
      : t('respuestaIncorrecta')
    : null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{quiz.question || lessonTitle}</h3>
      <div className="space-y-2">
        {quiz.options?.map((opt: string, i: number) => (
          <div
            key={i}
            className={getOptionClassName(i)}
            onClick={() => { if (!submitted) setSelected(i); }}
          >
            <div className="flex items-center gap-2">
              <span className="flex-1">{opt}</span>
              {getResultIcon(i)}
            </div>
          </div>
        ))}
      </div>
      {!submitted ? (
        <Button onClick={handleSubmit} disabled={selected === null} className="w-full">
          {t('enviar')}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className={`text-sm font-medium ${selected === correctIndex ? 'text-green-600' : 'text-destructive'}`}>
            {resultMessage}
          </p>
          <Button variant="outline" onClick={handleRetry} className="w-full">
            {t('intentarDeNuevo')}
          </Button>
        </div>
      )}
    </div>
  );
}

async function fetchCourseData(
  courseId: string,
  lessonId: string,
  t: ReturnType<typeof useTranslations>,
  fetchIdRef: React.MutableRefObject<number>,
  setCourse: (data: any) => void,
  setError: (msg: string) => void,
  setLoading: (val: boolean) => void,
): Promise<void> {
  if (!courseId || !lessonId) return;
  const thisFetchId = ++fetchIdRef.current;
  try {
    const result = await apiClient<any>(apiUrl(`/api/courses/${courseId}`));
    if (thisFetchId !== fetchIdRef.current) return;
    if (!result.success) {
      setError(result.error || t('errorCargar'));
      setLoading(false);
      return;
    }
    const data = result.data;
    setCourse(data?.success ? data.data : data);
  } catch (err: any) {
    if (thisFetchId === fetchIdRef.current) setError(err.message);
  } finally {
    if (thisFetchId === fetchIdRef.current) setLoading(false);
  }
}

function renderErrorOrLoading(
  loading: boolean,
  error: string,
  lesson: any,
  courseId: string,
  t: ReturnType<typeof useTranslations>,
  router: any,
) {
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
        <p className="text-destructive">{error || t('leccionNoEncontrada')}</p>
        <Button variant="outline" onClick={() => router.push(`/portal/cursos/${courseId}`)}>{t('volverAlCurso')}</Button>
      </div>
    );
  }

  return null;
}

function renderLessonContent(lesson: any, t: ReturnType<typeof useTranslations>) {
  if (lesson.content_type === 'video' && lesson.content_url) {
    return (
      <div className="aspect-video w-full">
        <iframe
          src={lesson.content_url}
          className="h-full w-full rounded-lg"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  if (lesson.content_type === 'text' && lesson.content) {
    return <LessonRichText content={lesson.content} />;
  }

  if (lesson.content_type === 'quiz') {
    let quiz;
    try {
      quiz = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
    } catch {
      return <p className="text-destructive">{t('errorCargarCuestionario')}</p>;
    }
    return <QuizComponent quiz={quiz} lessonTitle={lesson.title} />;
  }

  return null;
}

function renderNavigation(
  prevLesson: any,
  nextLesson: any,
  courseId: string,
  t: ReturnType<typeof useTranslations>,
  router: any,
) {
  return (
    <div className="flex items-center justify-between">
      {prevLesson ? (
        <Link href={`/portal/cursos/${courseId}/lecciones/${prevLesson.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-1 size-4" /> {t('anterior')}
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {nextLesson ? (
        <Link href={`/portal/cursos/${courseId}/lecciones/${nextLesson.id}`}>
          <Button variant="outline">
            {t('siguiente')} <ArrowRight className="ml-1 size-4" />
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}

export default function LeccionPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.leccion');
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    fetchCourseData(courseId, lessonId, t, fetchIdRef, setCourse, setError, setLoading);
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
      const result = await apiClient.post(
        apiUrl(`/api/courses/${courseId}/lessons/${lessonId}/complete`),
      );
      if (!result.success) {
        setError(result.error || t('errorCompletar'));
        return;
      }
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

  const errorOrLoading = renderErrorOrLoading(loading, error, lesson, courseId, t, router);
  if (errorOrLoading) return errorOrLoading;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/portal/cursos/${courseId}`)}>
        <ArrowLeft className="mr-1 size-4" /> {t('volverAlCurso')}
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
            <CheckCircle className="mr-1 size-3" /> {t('completada')}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderLessonContent(lesson, t)}
        </CardContent>
      </Card>

      {!lesson.completed && (
        <Button onClick={handleComplete} disabled={completing} className="w-full">
          {completing ? t('guardando') : t('marcarCompletada')}
        </Button>
      )}

      {renderNavigation(prevLesson, nextLesson, courseId, t, router)}
    </div>
  );
}
