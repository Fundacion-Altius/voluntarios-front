'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import type { SurveyReport } from './useSurveys';

interface ReportViewProps {
  report: SurveyReport | null;
  reportLoading: boolean;
  onBack: () => void;
  t: any;
}

export function ReportView({ report, reportLoading, onBack, t }: ReportViewProps) {
  if (reportLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!report) {
    return <p className="text-muted-foreground">{t('sinDatosReporte')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {report.data.map((q) => (
          <Card key={q.questionId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{q.questionText}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{q.averageRating}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {q.totalAnswers} {t('respuestas')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t('totalRespuestas')}: {report.total}</p>
      <p className="text-xs text-muted-foreground">{t('generado')}: {new Date(report.generated_at).toLocaleString()}</p>
    </div>
  );
}