'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { CourseForm } from './CourseForm';
import { AddModuleDialog } from './AddModuleDialog';
import { ModuleManagement } from './ModuleManagement';

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

interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  category: string;
  image_url: string;
  status: string;
  lesson_count: number;
  created_at: string;
  modules: Module[];
}

export default function EditarCursoPage() {
  const t = useTranslations('admin.cursos');
  const tc = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const token = (session as any)?.authToken;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('beginner');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [newModuleOrder, setNewModuleOrder] = useState('');
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  const [deleteModuleTarget, setDeleteModuleTarget] = useState<Module | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ moduleId: number; lessonId: number } | null>(null);

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');
  const [editModuleOrder, setEditModuleOrder] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const fetchCourse = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error(t('errorCargarCurso'));
      const data: Course = await res.json();
      setCourse(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setLevel(data.level || 'beginner');
      setCategory(data.category || '');
      setImageUrl(data.image_url || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchCourse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ title, description, level, category, image_url: imageUrl }),
      });
      if (!res.ok) throw new Error(t('errorCargarCurso'));
      showSuccess(t('cursoActualizado'));
      fetchCourse();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setModuleSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newModuleTitle,
          description: newModuleDescription,
          order: newModuleOrder ? Number(newModuleOrder) : undefined,
        }),
      });
      if (!res.ok) throw new Error(t('errorCrearModulo'));
      setNewModuleTitle('');
      setNewModuleDescription('');
      setNewModuleOrder('');
      setModuleDialogOpen(false);
      showSuccess(t('modulocreado'));
      fetchCourse();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleUpdateModule = async (moduleId: number) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editModuleTitle,
          description: editModuleDescription,
          order: editModuleOrder ? Number(editModuleOrder) : undefined,
        }),
      });
      if (!res.ok) throw new Error(t('errorActualizarModulo'));
      setEditingModule(null);
      showSuccess(t('modulocActualizado'));
      fetchCourse();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModuleTarget) return;
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/modules/${deleteModuleTarget.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error(t('errorEliminarModulo'));
      setDeleteModuleTarget(null);
      showSuccess(t('modulocEliminado'));
      fetchCourse();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    setError('');
    try {
      const res = await fetch(
        `${API_URL}/api/courses/${courseId}/modules/${deleteLessonTarget.moduleId}/lessons/${deleteLessonTarget.lessonId}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        }
      );
      if (!res.ok) throw new Error(t('errorEliminarLeccion'));
      setDeleteLessonTarget(null);
      showSuccess(t('leccionEliminada'));
      fetchCourse();
    } catch (err: any) {
      setError(err.message);
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
        <Button variant="ghost" onClick={() => router.push('/admin/cursos')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('volverCursos')}
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !course ? (
        <p className="text-muted-foreground">{t('cursoNoEncontrado')}</p>
      ) : (
        <div className="space-y-8">
          <CourseForm
            course={course}
            title={title}
            description={description}
            level={level}
            category={category}
            imageUrl={imageUrl}
            submitting={submitting}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onLevelChange={setLevel}
            onCategoryChange={setCategory}
            onImageUrlChange={setImageUrl}
            onSubmit={handleUpdateCourse}
            t={t}
            tc={tc}
          />
          <ModuleManagement
            course={course}
            courseId={courseId}
            token={token}
            expandedModules={expandedModules}
            setExpandedModules={setExpandedModules}
            deleteModuleTarget={deleteModuleTarget}
            setDeleteModuleTarget={setDeleteModuleTarget}
            deleteLessonTarget={deleteLessonTarget}
            setDeleteLessonTarget={setDeleteLessonTarget}
            editingModule={editingModule}
            setEditingModule={setEditingModule}
            editModuleTitle={editModuleTitle}
            setEditModuleTitle={setEditModuleTitle}
            editModuleDescription={editModuleDescription}
            setEditModuleDescription={setEditModuleDescription}
            editModuleOrder={editModuleOrder}
            setEditModuleOrder={setEditModuleOrder}
            newModuleTitle={newModuleTitle}
            setNewModuleTitle={setNewModuleTitle}
            newModuleDescription={newModuleDescription}
            setNewModuleDescription={setNewModuleDescription}
            newModuleOrder={newModuleOrder}
            setNewModuleOrder={setNewModuleOrder}
            moduleDialogOpen={moduleDialogOpen}
            setModuleDialogOpen={setModuleDialogOpen}
            moduleSubmitting={moduleSubmitting}
            error={error}
            setError={setError}
            successMsg={successMsg}
            setSuccessMsg={setSuccessMsg}
            t={t}
            tc={tc}
            onAddModule={handleAddModule}
            onUpdateModule={handleUpdateModule}
            onDeleteModule={handleDeleteModule}
            onDeleteLesson={handleDeleteLesson}
            router={router}
          />
        </div>
      )}
    </div>
  );
}