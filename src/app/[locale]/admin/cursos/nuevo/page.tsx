'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
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

export default function NuevoCursoPage() {
  const t = useTranslations('admin.cursos');
  const tc = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('beginner');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = (session as any)?.authToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ title, description, level, category, image_url: imageUrl }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || t('errorCrearCurso'));
        return;
      }
      router.push('/admin/cursos');
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
        <Button variant="ghost" onClick={() => router.push('/admin/cursos')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('volverCursos')}
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{t('nuevoCurso')}</CardTitle>
        </CardHeader>
        <CardContent>
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
                placeholder={t('tituloPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{tc('descripcion')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descripcionPlaceholder')}
                rows={4}
              />
            </div>

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
                placeholder={t('ejemploCategoria')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('urlImagen', { ns: 'admin.blog' })}</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('creando') : t('crearCurso')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
