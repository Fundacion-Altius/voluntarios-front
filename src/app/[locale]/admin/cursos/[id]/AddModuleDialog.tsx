'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
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

interface AddModuleDialogProps {
  course: Course;
  courseId: string;
  newModuleTitle: string;
  setNewModuleTitle: (v: string) => void;
  newModuleDescription: string;
  setNewModuleDescription: (v: string) => void;
  newModuleOrder: string;
  setNewModuleOrder: (v: string) => void;
  moduleDialogOpen: boolean;
  setModuleDialogOpen: (v: boolean) => void;
  moduleSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  t: any;
  tc: any;
}

export function AddModuleDialog({
  course,
  courseId,
  newModuleTitle,
  setNewModuleTitle,
  newModuleDescription,
  setNewModuleDescription,
  newModuleOrder,
  setNewModuleOrder,
  moduleDialogOpen,
  setModuleDialogOpen,
  moduleSubmitting,
  onSubmit,
  t,
  tc,
}: AddModuleDialogProps) {
  return (
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
        <form onSubmit={onSubmit} className="space-y-4">
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
  );
}