'use client';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function NuevoProyectoPage() {
  const router = useRouter();
  const t = useTranslations('portal.nuevoProyecto');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError(t('tituloObligatorio')); return; }

    setSubmitting(true);
    setError('');

    const result = await apiClient<{ projectId: string }>(apiUrl('/api/community/projects'), {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    });

    if (!result.success) {
      setError(result.error || t('errorCrear'));
      setSubmitting(false);
      return;
    }

    router.push(`/portal/proyectos/${result.data.projectId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('titulo')}</h1>
      </div>

      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{t('detalles')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('tituloLabel')} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('nombreProyecto')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('descripcionLabel')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('describeObjetivo')}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('fechaLimite')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
                {t('crearProyecto')}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {t('cancelar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
