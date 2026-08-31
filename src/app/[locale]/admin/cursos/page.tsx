'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';

import { apiClient, apiUrl } from '@/lib/apiClient';

interface Course {
  id: number;
  title: string;
  level: string;
  category: string;
  status: string;
  lesson_count: number;
  created_at: string;
}

const statusBadge: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
};

const levelBadge: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  beginner: 'secondary',
  intermediate: 'outline',
  advanced: 'destructive',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export default function CursosPage() {
  const t = useTranslations('admin.cursos');
  const tc = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiClient<{ data?: Course[] } | Course[]>(apiUrl('/api/courses?status=all'));
      if (!result.success) {
        setError(result.error || t('errorCargar'));
        return;
      }
      const payload = result.data;
      setCourses(Array.isArray(payload) ? payload : (payload.data ?? []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await apiClient.delete(apiUrl(`/api/courses/${deleteTarget.id}`));
      if (!result.success) {
        setError(result.error || t('errorEliminar'));
        return;
      }
      setDeleteTarget(null);
      setSuccessMsg(t('cursoEliminado'));
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchCourses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <Button onClick={() => router.push('/admin/cursos/nuevo')}>
          <Plus className="mr-2 size-4" />
          {t('nuevoCurso')}
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc('titulo')}</TableHead>
              <TableHead>{t('nivel')}</TableHead>
              <TableHead>{tc('categoria')}</TableHead>
              <TableHead>{tc('estado')}</TableHead>
              <TableHead>{t('lecciones')}</TableHead>
              <TableHead>{t('creado')}</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  <BookOpen className="mx-auto mb-2 size-8 opacity-50" />
                  {t('sinCursos')}
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>
                    <Badge variant={levelBadge[course.level] || 'outline'}>
                      {course.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{course.category}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[course.status] || 'outline'}>
                      {course.status === 'published'
                        ? t('publicado')
                        : course.status === 'archived'
                          ? t('archivado')
                          : t('borrador')}
                    </Badge>
                  </TableCell>
                  <TableCell>{course.lesson_count}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(course.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/cursos/${course.id}`)}
                      >
                        <Edit2 className="mr-1 size-3" />
                        {tc('editar')}
                      </Button>
                      <AlertDialog
                        open={deleteTarget?.id === course.id}
                        onOpenChange={(open) => {
                          if (!open) setDeleteTarget(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(course)}
                          >
                            <Trash2 className="mr-1 size-3" />
                            {tc('eliminar')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('eliminarCurso')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('eliminarCursoDesc')}{' '}
                              <strong>{deleteTarget?.title}</strong>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tc('cancelar')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              {tc('eliminar')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
