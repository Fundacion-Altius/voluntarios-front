'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { apiClient, apiUrl } from '@/lib/apiClient';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function asCategoryList(payload: unknown): Array<{ id: string; name: string }> {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Array<{ id: string; name: string }> }).data;
  }
  return [];
}

export default function BlogEditorPage() {
  const t = useTranslations('admin.blog');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = async (): Promise<Array<{ id: string; name: string }>> => {
    const result = await apiClient<unknown>(apiUrl('/api/blog/categories'));
    if (!result.success) return [];
    return asCategoryList(result.data);
  };

  useEffect(() => {
    void loadCategories().then(async (list) => {
      let next = list;
      if (next.length === 0) {
        const created = await apiClient<{ id: string; name: string }>(apiUrl('/api/blog/categories'), {
          method: 'POST',
          body: JSON.stringify({ name: 'General', slug: 'general', description: null }),
        });
        if (created.success && created.data.id) next = [created.data];
        else next = await loadCategories();
      }
      setCategories(next);
      setCategoryId((current) => current || next[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    if (!editId) return;
    void apiClient<any>(apiUrl(`/api/blog/posts/${editId}`)).then((result) => {
      if (result.success && result.data) {
        const data = result.data;
        setTitle(data.title || '');
        setSlug(data.slug || '');
        setSlugTouched(true);
        setExcerpt(data.excerpt || '');
        setBody(data.body || '');
        setImageUrl(data.image_url || '');
        setCategoryId(data.category_id || '');
      }
    }).finally(() => setLoading(false));
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const resolvedSlug = slug.trim() || slugify(title);
    const resolvedCategory = categoryId || categories[0]?.id;
    if (!resolvedCategory) {
      setError(t('errorCategoria'));
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      slug: resolvedSlug,
      excerpt: excerpt.trim() || null,
      body,
      image_url: imageUrl.trim() || null,
      category_id: resolvedCategory,
    };

    const result = editId
      ? await apiClient(apiUrl(`/api/blog/posts/${editId}`), { method: 'PUT', body: JSON.stringify(payload) })
      : await apiClient(apiUrl('/api/blog/posts'), { method: 'POST', body: JSON.stringify(payload) });

    if (!result.success) {
      setError(result.error || t('errorGuardar'));
      setSaving(false);
      return;
    }
    router.push('/admin/blog');
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full rounded-lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 size-4" /> {tc('volver')}</Button></Link>
        <h1 className="text-2xl font-bold">{editId ? t('editarPublicacion') : t('nuevaPublicacion')}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{tc('titulo')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                placeholder="mi-publicacion"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{tc('categoria')}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder={t('seleccionarCategoria')} /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">{t('extracto')}</Label>
              <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">{t('contenido')}</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={12} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{t('urlImagen')}</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Link href="/admin/blog"><Button type="button" variant="outline">{tc('cancelar')}</Button></Link>
              <Button type="submit" disabled={saving}>
                <Save className="mr-1 size-4" /> {saving ? tc('guardando') : tc('guardar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
