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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, Edit2, BookOpen } from 'lucide-react';

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

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
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
          <Card>
            <CardHeader>
              <CardTitle>{t('editarCurso')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCourse} className="space-y-4">
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
                  <Label htmlFor="description">{tc('descripcion')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="level">{t('nivel')}</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t('principiante')}</SelectItem>
                        <SelectItem value="intermediate">{t('intermedio')}</SelectItem>
                        <SelectItem value="advanced">{t('avanzado')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{tc('categoria')}</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">{t('urlImagen', { ns: 'admin.blog' })}</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? t('guardando') : t('guardarCambios')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('modulos')}</CardTitle>
              <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1 size-4" />
                    {t('anadirModulo')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('nuevoModulo')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddModule} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="moduleTitle">{tc('titulo')}</Label>
                      <Input
                        id="moduleTitle"
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moduleDescription">{tc('descripcion')}</Label>
                      <Textarea
                        id="moduleDescription"
                        value={newModuleDescription}
                        onChange={(e) => setNewModuleDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moduleOrder">{tc('orden')}</Label>
                      <Input
                        id="moduleOrder"
                        type="number"
                        value={newModuleOrder}
                        onChange={(e) => setNewModuleOrder(e.target.value)}
                        placeholder="Auto"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={moduleSubmitting}>
                      {moduleSubmitting ? t('creando') : t('crearModulo')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-3">
                  {[...course.modules]
                    .sort((a, b) => a.order - b.order)
                    .map((mod) => (
                      <div key={mod.id} className="rounded-md border">
                        <div
                          className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/50"
                          onClick={() => toggleModule(mod.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedModules.has(mod.id) ? (
                              <ChevronDown className="size-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{mod.title}</span>
                            <Badge variant="outline" className="ml-2">
                              {mod.lessons?.length || 0} {t('lecciones')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {tc('orden')}: {mod.order}
                            </span>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Dialog
                              open={editingModule?.id === mod.id}
                              onOpenChange={(open) => {
                                if (!open) setEditingModule(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setEditingModule(mod);
                                    setEditModuleTitle(mod.title);
                                    setEditModuleDescription(mod.description || '');
                                    setEditModuleOrder(String(mod.order));
                                  }}
                                >
                                  <Edit2 className="size-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t('editarModulo')}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>{tc('titulo')}</Label>
                                    <Input
                                      value={editModuleTitle}
                                      onChange={(e) => setEditModuleTitle(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>{tc('descripcion')}</Label>
                                    <Textarea
                                      value={editModuleDescription}
                                      onChange={(e) => setEditModuleDescription(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>{tc('orden')}</Label>
                                    <Input
                                      type="number"
                                      value={editModuleOrder}
                                      onChange={(e) => setEditModuleOrder(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    className="w-full"
                                    onClick={() => handleUpdateModule(mod.id)}
                                  >
                                    {tc('guardar')}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog
                              open={deleteModuleTarget?.id === mod.id}
                              onOpenChange={(open) => {
                                if (!open) setDeleteModuleTarget(null);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setDeleteModuleTarget(mod)}
                                >
                                  <Trash2 className="size-3 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('eliminarModulo')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('eliminarModuloDesc')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{tc('cancelar')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteModule}>
                                    {tc('eliminar')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {expandedModules.has(mod.id) && (
                          <div className="border-t px-4 py-3">
                            {mod.lessons && mod.lessons.length > 0 ? (
                              <div className="space-y-2">
                                {[...mod.lessons]
                                  .sort((a, b) => a.order - b.order)
                                  .map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="size-3 text-muted-foreground" />
                                        <span className="text-sm">{lesson.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {lesson.content_type}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          onClick={() =>
                                            router.push(
                                              `/admin/cursos/${courseId}/modulos/${mod.id}/lecciones/${lesson.id}`
                                            )
                                          }
                                        >
                                          <Edit2 className="size-3" />
                                        </Button>
                                        <AlertDialog
                                          open={deleteLessonTarget?.lessonId === lesson.id && deleteLessonTarget?.moduleId === mod.id}
                                          onOpenChange={(open) => {
                                            if (!open) setDeleteLessonTarget(null);
                                          }}
                                        >
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon-xs"
                                              onClick={() =>
                                                setDeleteLessonTarget({ moduleId: mod.id, lessonId: lesson.id })
                                              }
                                            >
                                              <Trash2 className="size-3 text-destructive" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                  <AlertDialogTitle>{t('eliminarLeccion')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('eliminarLeccionDesc')} <strong>{deleteLessonTarget?.lessonId}</strong>.
                                  </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>{tc('cancelar')}</AlertDialogCancel>
                                              <AlertDialogAction onClick={handleDeleteLesson}>
                                                {tc('eliminar')}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="py-2 text-sm text-muted-foreground">
                                {t('sinLecciones')}
                              </p>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() =>
                                router.push(
                                  `/admin/cursos/${courseId}/modulos/${mod.id}/lecciones/nueva`
                                )
                              }
                            >
                              <Plus className="mr-1 size-3" />
                              {t('anadirLeccion')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">
                  {t('sinModulos')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
