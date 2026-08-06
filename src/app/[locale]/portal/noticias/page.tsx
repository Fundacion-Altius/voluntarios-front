'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

interface BlogPost {
  id: string; title: string; slug: string; excerpt: string | null;
  image_url: string | null; published_at: string;
}

export default function NoticiasPage() {
  const { data: session } = useSession();
  const t = useTranslations('portal.noticias');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true); setError(null);
    apiClient<{ data: BlogPost[]; totalPages?: number }>(apiUrl(`/api/blog/posts?page=${page}&pageSize=10`))
      .then((data) => { setPosts(data.data || []); setTotalPages(data.totalPages || 1); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, session]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('titulo')} subtitle={t('subtitulo')} />
      {loading ? <LoadingSkeleton rows={3} /> : error ? <ErrorState message={error} /> : posts.length === 0 ? (
        <EmptyState title={t('sinNoticias')} />
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
                        {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                      </div>
                      {post.image_url && <img src={post.image_url} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" /> {t('anterior')}
              </Button>
              <span className="text-sm text-muted-foreground">{t('pagina')} {page} {t('de')} {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t('siguiente')} <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
