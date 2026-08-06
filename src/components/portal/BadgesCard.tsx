'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface BadgesCardProps {
  badges: { id: string; badge_type: string }[];
}

export function BadgesCard({ badges }: BadgesCardProps) {
  const t = useTranslations('portal.home');

  if (badges.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle>{t('insignias')}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <Badge key={b.id} variant="secondary">{b.badge_type.replace(/-/g, ' ')}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}