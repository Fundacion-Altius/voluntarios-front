'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, Globe, EyeOff } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function AdminBlogPage() {
  const t = useTranslations('admin.blog');
  const { data: session } = useSession();
  const authToken = (session as any)?.authToken;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/blog/posts?status=all&pageSize=100`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('eliminarPublicacion'))) return;
    try {
      const res = await fetch(`${API_URL}/api/blog/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  const togglePublish = async (post: any) => {
    try {
      const published_at = post.published_at ? null : new Date().toISOString();
      const res = await fetch(`${API_URL}/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ published_at }),
      });
      if (res.ok) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, published_at } : p)));
      }
    } catch {}
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
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(post)}>
                    {post.published_at ? <EyeOff className="size-4" /> : <Globe className="size-4" />}
                  </Button>
                  <Link href={`/admin/blog/editor?id=${post.id}`}>
                    <Button variant="ghost" size="sm"><Edit className="size-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
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
