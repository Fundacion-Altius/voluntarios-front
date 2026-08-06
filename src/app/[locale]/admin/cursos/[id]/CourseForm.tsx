'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface CourseFormProps {
  course: Course;
  title: string;
  description: string;
  level: string;
  category: string;
  imageUrl: string;
  submitting: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onLevelChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onImageUrlChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: any;
  tc: any;
}

export function CourseForm({
  course,
  title,
  description,
  level,
  category,
  imageUrl,
  submitting,
  onTitleChange,
  onDescriptionChange,
  onLevelChange,
  onCategoryChange,
  onImageUrlChange,
  onSubmit,
  t,
  tc,
}: CourseFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editarCurso')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{tc('titulo')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{tc('descripcion')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="level">{t('nivel')}</Label>
              <Select value={level} onValueChange={onLevelChange}>
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
                onChange={(e) => onCategoryChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageUrl">{t('urlImagen', { ns: 'admin.blog' })}</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => onImageUrlChange(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('guardando') : t('guardarCambios')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}