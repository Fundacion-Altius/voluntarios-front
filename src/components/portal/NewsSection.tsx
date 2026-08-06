'use client';

import { LoadingSkeleton } from '@/components/portal/StateViews';
import { NewsCard } from '@/components/portal/NewsCard';

interface NewsSectionProps {
  posts: any[];
  postsLoading: boolean;
}

export function NewsSection({ posts, postsLoading }: NewsSectionProps) {
  if (postsLoading) return <LoadingSkeleton rows={1} />;
  if (posts.length === 0) return null;
  return <NewsCard posts={posts} />;
}