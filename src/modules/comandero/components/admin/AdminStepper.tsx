'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type AdminStep = 'carta' | 'abrir' | 'sala' | 'cierre';

const STEPS: AdminStep[] = ['carta', 'abrir', 'sala', 'cierre'];

/** Four-phase docente flow: Carta → Abrir servicio → Sala en vivo → Cierre. */
export function AdminStepper({
  step,
  onStep,
  canOpenSala,
  canOpenCierre,
}: {
  step: AdminStep;
  onStep: (step: AdminStep) => void;
  canOpenSala: boolean;
  canOpenCierre: boolean;
}) {
  const t = useTranslations('comandero.admin.steps');
  const activeIndex = STEPS.indexOf(step);

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={t('aria')} data-testid="comandero-admin-steps">
      {STEPS.map((id, index) => {
        const done = index < activeIndex;
        const on = id === step;
        const locked =
          (id === 'sala' && !canOpenSala && !on) || (id === 'cierre' && !canOpenCierre && !on);
        return (
          <button
            key={id}
            type="button"
            data-testid={`comandero-step-${id}`}
            disabled={locked}
            onClick={() => onStep(id)}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors',
              on && 'border-primary bg-primary text-primary-foreground',
              done && !on && 'border-primary/30 bg-primary/10 text-primary',
              !on && !done && 'border-border bg-muted/40 text-muted-foreground',
              locked && 'cursor-not-allowed opacity-50',
            )}
          >
            <span
              className={cn(
                'grid size-5 place-items-center rounded-full text-xs font-bold',
                on ? 'bg-primary-foreground text-primary' : done ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground',
              )}
            >
              {done ? '✓' : index + 1}
            </span>
            {t(id)}
          </button>
        );
      })}
    </nav>
  );
}
