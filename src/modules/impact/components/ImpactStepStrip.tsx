'use client';

import type { ImpactAdminView } from '@/modules/impact/catalog';

const STEPS: { id: ImpactAdminView; labelKey: string; n: number }[] = [
  { id: 'library-start', labelKey: 'stepStart', n: 1 },
  { id: 'library-mine', labelKey: 'stepMine', n: 2 },
  { id: 'editor', labelKey: 'stepPublic', n: 3 },
  { id: 'paths', labelKey: 'stepPaths', n: 4 },
];

export function ImpactStepStrip({
  active,
  onGo,
  labels,
}: {
  active: ImpactAdminView;
  onGo: (view: ImpactAdminView) => void;
  labels: Record<string, string>;
}) {
  const activeStep =
    STEPS.find((s) => s.id === active)?.n ??
    (active === 'library-add' || active === 'library-setup' ? 2 : active === 'home' ? 0 : 1);

  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {activeStep > 0 && (
        <span className="shrink-0 whitespace-nowrap text-xs font-bold text-muted-foreground">
          {labels.stepOf?.replace('{n}', String(activeStep)) ?? `Paso ${activeStep} de 4`}
        </span>
      )}
      {STEPS.map((step) => {
        const isOn = step.id === active
          || ((active === 'library-add' || active === 'library-setup') && step.id === 'library-mine');
        const isDone = activeStep > step.n;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onGo(step.id)}
            className={[
              'shrink-0 whitespace-nowrap rounded-[5px] border px-2.5 py-1 text-xs font-semibold',
              isOn
                ? 'border-primary bg-primary text-primary-foreground'
                : isDone
                  ? 'border-transparent bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground',
            ].join(' ')}
          >
            {step.n}. {labels[step.labelKey] ?? step.id}
          </button>
        );
      })}
    </div>
  );
}
