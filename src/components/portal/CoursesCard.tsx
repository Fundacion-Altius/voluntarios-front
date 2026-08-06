'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface CoursesCardProps {
  courses: any[];
}

export function CoursesCard({ courses }: CoursesCardProps) {
  const t = useTranslations('portal.home');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('misCursos')}</CardTitle>
        <Link href="/portal/cursos" className="text-sm text-primary hover:underline">{t('verMas')}</Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {courses.slice(0, 3).map((enrollment: any) => (
            <a key={enrollment.id} href={`/portal/cursos/${enrollment.course_id}`} className="block rounded-md border p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{enrollment.course_title || t('curso')}</p>
                <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                  {enrollment.status === 'completed' ? t('completado') : `${enrollment.progress_pct}%`}
                </Badge>
              </div>
              {enrollment.progress_pct > 0 && (
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${enrollment.progress_pct}%` }} />
                </div>
              )}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}