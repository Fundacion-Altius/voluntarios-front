'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function NuevoCursoPage() {
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
        throw new Error(errData?.message || 'Error al crear curso');
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
          Volver a cursos
        </Button>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Nuevo Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del curso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del curso"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: educación, logística, acompañamiento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de imagen</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear Curso'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
