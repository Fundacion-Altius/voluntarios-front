'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FormReport } from './useForms';

interface ReportViewProps {
  report: FormReport | null;
  reportLoading: boolean;
  onBack: () => void;
  t: ReturnType<typeof useTranslations>;
}

export function ReportView({ report, reportLoading, onBack, t }: ReportViewProps) {
  if (reportLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>{t('resultados')}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← {t('volverLista')}
          </Button>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-12" />
          </Card>
        ))}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>{t('resultados')}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← {t('volverLista')}
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('sinDatos')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <CardTitle>{t('resultados')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← {t('volverLista')}
        </Button>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        <p>{t('totalEnvios')}: {report.total}</p>
        <p>{t('generado')}: {format(new Date(report.generated_at), 'PPpp', { locale: es })}</p>
      </div>

      <div className="space-y-4">
        {report.data.map((question, index) => (
          <Card key={question.questionId}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {question.questionText} <span className="text-muted-foreground text-sm font-normal">({question.type})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('respuestas')}</p>
                  <p className="text-2xl font-bold">{question.count}</p>
                </div>
                {question.averageRating !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('promedio')}</p>
                    <p className="text-2xl font-bold">{question.averageRating.toFixed(1)}</p>
                  </div>
                )}
              </div>
              {question.distribution && Object.keys(question.distribution).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t('distribucion')}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(question.distribution).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}