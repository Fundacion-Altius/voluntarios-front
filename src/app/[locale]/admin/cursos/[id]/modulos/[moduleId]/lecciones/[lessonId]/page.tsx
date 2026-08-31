'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LessonForm } from './LessonForm';
import { apiClient, apiUrl } from '@/lib/apiClient';

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
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;

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
        const result = await apiClient<Lesson>(
          apiUrl(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
        );
        if (!result.success) {
          setError(result.error || t('errorCargar'));
          return;
        }
        const data = result.data;
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
  }, [isAuthenticated, courseId, moduleId, lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await apiClient.put(
        apiUrl(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
        {
          title,
          content_type: contentType,
          content,
          content_url: contentUrl || undefined,
        },
      );
      if (!result.success) {
        setError(result.error || t('errorActualizar'));
        return;
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

      <LessonForm
        title={title}
        setTitle={setTitle}
        contentType={contentType}
        setContentType={setContentType}
        content={content}
        setContent={setContent}
        contentUrl={contentUrl}
        setContentUrl={setContentUrl}
        submitting={submitting}
        error={error}
        setError={setError}
        successMsg={successMsg}
        setSuccessMsg={setSuccessMsg}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        t={t}
        tc={tc}
      />
    </div>
  );
}