'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StartSessionForm } from './StartSessionForm';

/** Concept "Siguiente paso" panel beside the classroom carta. */
export function NextStepCard({
  busy,
  sessionOpen,
  onStart,
  onGoSala,
}: {
  busy: boolean;
  sessionOpen: boolean;
  onStart: (label: string) => void;
  onGoSala: () => void;
}) {
  const t = useTranslations('comandero.admin');

  return (
    <Card data-testid="comandero-next-step">
      <CardHeader>
        <CardTitle>{t('nextStep.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('nextStep.body')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionOpen ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('session.alreadyOpen')}</p>
            <button
              type="button"
              data-testid="comandero-next-step-go-sala"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-amber-950 hover:bg-amber-400"
              onClick={onGoSala}
            >
              {t('nextStep.goSala')}
            </button>
          </div>
        ) : (
          <StartSessionForm busy={busy} onStart={onStart} />
        )}
        <p className="text-xs text-muted-foreground">{t('nextStep.footnote')}</p>
      </CardContent>
    </Card>
  );
}
