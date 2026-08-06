'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface NewsCardProps {
  posts: any[];
}

export function NewsCard({ posts }: NewsCardProps) {
  const t = useTranslations('portal.home');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('ultimasNoticias')}</CardTitle>
        <Link href="/portal/noticias" className="text-sm text-primary hover:underline">{t('verMas')}</Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {posts.slice(0, 3).map((post: any) => (
            <a key={post.id} href={`/portal/noticias/${post.slug}`} className="block rounded-md border p-3 transition-colors hover:bg-muted/50">
              <p className="text-sm font-medium">{post.title}</p>
              {post.excerpt && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}