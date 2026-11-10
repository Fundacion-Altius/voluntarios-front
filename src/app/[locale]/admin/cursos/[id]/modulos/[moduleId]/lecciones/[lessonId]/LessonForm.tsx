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
import { Skeleton } from '@/components/ui/skeleton';

interface LessonFormProps {
  title: string;
  setTitle: (v: string) => void;
  contentType: string;
  setContentType: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  contentUrl: string;
  setContentUrl: (v: string) => void;
  submitting: boolean;
  error: string;
  setError: (v: string) => void;
  successMsg: string;
  setSuccessMsg: (v: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  t: any;
  tc: any;
}

export function LessonForm({
  title,
  setTitle,
  contentType,
  setContentType,
  content,
  setContent,
  contentUrl,
  setContentUrl,
  submitting,
  error,
  setError,
  successMsg,
  setSuccessMsg,
  isLoading,
  onSubmit,
  t,
  tc,
}: LessonFormProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{t('editarLeccion')}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
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
              onClick={() => window.history.back()}
            >
              {tc('cancelar')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}