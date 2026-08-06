'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_type: string;
  content: string;
  content_url: string;
  order: number;
  created_at: string;
}

export default function EditarLeccionPage() {
  const t = useTranslations('admin.leccion');
  const tc = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;

  const token = (session as any)?.authToken;

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('text');
  const [content, setContent] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchLesson = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_URL}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
          }
        );
        if (!res.ok) throw new Error(t('errorCargar'));
        const data: Lesson = await res.json();
        setTitle(data.title);
        setContentType(data.content_type);
        setContent(data.content || '');
        setContentUrl(data.content_url || '');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [isAuthenticated, token, courseId, moduleId, lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            title,
            content_type: contentType,
            content,
            content_url: contentUrl,
          }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || t('errorActualizar'));
      }
      setSuccessMsg(t('leccionActualizada'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push(`/admin/cursos/${courseId}`)}>
          <ArrowLeft className="mr-2 size-4" />
          {t('volverAlCurso')}
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{t('editarLeccion')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">{tc('titulo')}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">{t('tipoContenido')}</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t('texto')}</SelectItem>
                    <SelectItem value="video">{t('video')}</SelectItem>
                    <SelectItem value="quiz">{t('quiz')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {contentType === 'video' && (
                <div className="space-y-2">
                  <Label htmlFor="contentUrl">{t('urlVideo')}</Label>
                  <Input
                    id="contentUrl"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    required
                  />
                </div>
              )}

              {(contentType === 'text' || contentType === 'quiz') && (
                <div className="space-y-2">
                  <Label htmlFor="content">
                    {contentType === 'quiz' ? t('configQuiz') : tc('contenido')}
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? tc('guardando') : t('guardarCambios')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/cursos/${courseId}`)}
                >
                  {tc('cancelar')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
