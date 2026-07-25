'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  image_url: string | null;
  category_id: string;
  author_id: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export default function NoticiasPage() {
  const { data: session } = useSession();
  const authToken = (session as any)?.authToken;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async (p: number) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/blog/posts?page=${p}&pageSize=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, authToken]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Noticias</h1>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No hay noticias publicadas aún.</p>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/portal/noticias/${post.slug}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {post.excerpt && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        )}
                      </div>
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="h-20 w-20 rounded-md object-cover" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {new Date(post.published_at).toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
