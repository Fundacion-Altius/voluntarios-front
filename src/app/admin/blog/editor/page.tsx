'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function BlogEditorPage() {
  const { data: session } = useSession();
  const authToken = (session as any)?.authToken;
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    fetch(`${API_URL}/api/blog/categories`, {
      headers: { Authorization: `Bearer ${authToken}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories)
      .catch(() => {});
  }, [authToken]);

  useEffect(() => {
    if (!authToken || !editId) return;
    fetch(`${API_URL}/api/blog/posts/${editId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setExcerpt(data.excerpt || '');
          setBody(data.body || '');
          setImageUrl(data.image_url || '');
          setCategoryId(data.category_id || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [editId, authToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setSaving(true);
    try {
      const url = editId
        ? `${API_URL}/api/blog/posts/${editId}`
        : `${API_URL}/api/blog/posts`;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug, excerpt, body, image_url: imageUrl || null, category_id: categoryId }),
      });
      if (res.ok) router.push('/admin/blog');
    } catch {} finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full rounded-lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 size-4" /> Volver</Button></Link>
        <h1 className="text-2xl font-bold">{editId ? 'Editar publicación' : 'Nueva publicación'}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="mi-publicacion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Extracto</Label>
              <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Contenido</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de imagen</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2">
              <Link href="/admin/blog"><Button type="button" variant="outline">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}>
                <Save className="mr-1 size-4" /> {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
