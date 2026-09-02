'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Globe, EyeOff } from 'lucide-react';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function AdminBlogPage() {
  const t = useTranslations('admin.blog');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    const result = await apiClient<{ data: any[] }>(apiUrl('/api/blog/posts?status=all&pageSize=100'));
    if (result.success) setPosts(result.data.data || []);
    else setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    void fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('eliminarPublicacion'))) return;
    const result = await apiClient(apiUrl(`/api/blog/posts/${id}`), { method: 'DELETE' });
    if (result.success) setPosts((prev) => prev.filter((p) => p.id !== id));
    else setError(result.error);
  };

  const togglePublish = async (post: any) => {
    const published_at = post.published_at ? null : new Date().toISOString();
    const result = await apiClient(apiUrl(`/api/blog/posts/${post.id}`), {
      method: 'PUT',
      body: JSON.stringify({ published_at }),
    });
    if (result.success) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published_at } : p)));
    } else setError(result.error);
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog</h1>
        <Link href="/admin/blog/editor">
          <Button><Plus className="mr-1 size-4" /> {t('nuevaPublicacion')}</Button>
        </Link>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {posts.length === 0 ? (
        <p className="text-muted-foreground">{t('noHayPublicaciones')}</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{post.title}</p>
                    <Badge variant={post.published_at ? 'default' : 'secondary'}>
                      {post.published_at ? t('publicado') : t('borrador')}
                    </Badge>
                  </div>
                  {post.excerpt && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => void togglePublish(post)}>
                    {post.published_at ? <EyeOff className="size-4" /> : <Globe className="size-4" />}
                  </Button>
                  <Link href={`/admin/blog/editor?id=${post.id}`}>
                    <Button variant="ghost" size="sm"><Edit className="size-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => void handleDelete(post.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
