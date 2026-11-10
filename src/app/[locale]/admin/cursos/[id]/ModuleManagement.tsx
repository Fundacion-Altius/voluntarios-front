'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, Edit2, BookOpen } from 'lucide-react';
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

interface ModuleManagementProps {
  course: Course;
  courseId: string;
  token: string | undefined;
  expandedModules: Set<number>;
  setExpandedModules: React.Dispatch<React.SetStateAction<Set<number>>>;
  deleteModuleTarget: Course['modules'][number] | null;
  setDeleteModuleTarget: (m: Course['modules'][number] | null) => void;
  deleteLessonTarget: { moduleId: number; lessonId: number } | null;
  setDeleteLessonTarget: (l: { moduleId: number; lessonId: number } | null) => void;
  editingModule: Course['modules'][number] | null;
  setEditingModule: (m: Course['modules'][number] | null) => void;
  editModuleTitle: string;
  setEditModuleTitle: (v: string) => void;
  editModuleDescription: string;
  setEditModuleDescription: (v: string) => void;
  editModuleOrder: string;
  setEditModuleOrder: (v: string) => void;
  newModuleTitle: string;
  setNewModuleTitle: (v: string) => void;
  newModuleDescription: string;
  setNewModuleDescription: (v: string) => void;
  newModuleOrder: string;
  setNewModuleOrder: (v: string) => void;
  moduleDialogOpen: boolean;
  setModuleDialogOpen: (v: boolean) => void;
  moduleSubmitting: boolean;
  error: string;
  setError: (v: string) => void;
  successMsg: string;
  setSuccessMsg: (v: string) => void;
  t: any;
  tc: any;
  onAddModule: (e: React.FormEvent) => void;
  onUpdateModule: (moduleId: number) => void;
  onDeleteModule: () => void;
  onDeleteLesson: () => void;
  router: ReturnType<typeof useRouter>;
}

export function ModuleManagement({
  course,
  courseId,
  token,
  expandedModules,
  setExpandedModules,
  deleteModuleTarget,
  setDeleteModuleTarget,
  deleteLessonTarget,
  setDeleteLessonTarget,
  editingModule,
  setEditingModule,
  editModuleTitle,
  setEditModuleTitle,
  editModuleDescription,
  setEditModuleDescription,
  editModuleOrder,
  setEditModuleOrder,
  newModuleTitle,
  setNewModuleTitle,
  newModuleDescription,
  setNewModuleDescription,
  newModuleOrder,
  setNewModuleOrder,
  moduleDialogOpen,
  setModuleDialogOpen,
  moduleSubmitting,
  error,
  setError,
  successMsg,
  setSuccessMsg,
  t,
  tc,
  onAddModule,
  onUpdateModule,
  onDeleteModule,
  onDeleteLesson,
  router,
}: ModuleManagementProps) {
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (!course.modules || course.modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('modulos')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-muted-foreground">
            {t('sinModulos')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <form onSubmit={onAddModule} className="space-y-4">
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
                            onClick={() => onUpdateModule(mod.id)}
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
                          <AlertDialogAction onClick={onDeleteModule}>
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
                                      <AlertDialogAction onClick={onDeleteLesson}>
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
      </CardContent>
    </Card>
  );
}