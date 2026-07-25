'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function NoticiaDetailPage() {
  const { data: session } = useSession();
  const authToken = (session as any)?.authToken;
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken || !slug) return;
    fetch(`${API_URL}/api/blog/posts/slug/${slug}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPost(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, authToken]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Noticia no encontrada.</p>
        <Link href="/portal/noticias"><Button variant="outline"><ArrowLeft className="mr-1 size-4" /> Volver</Button></Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <Link href="/portal/noticias">
        <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 size-4" /> Volver a noticias</Button>
      </Link>
      {post.image_url && (
        <img src={post.image_url} alt="" className="w-full rounded-lg object-cover" style={{ maxHeight: 400 }} />
      )}
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="size-4" /> {new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      {post.excerpt && <p className="text-lg text-muted-foreground">{post.excerpt}</p>}
      <div className="prose max-w-none whitespace-pre-wrap">{post.body}</div>
    </article>
  );
}
