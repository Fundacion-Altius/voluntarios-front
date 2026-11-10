'use client';

import type { ImpactSourceType } from '@/modules/impact/catalog';

export function SourceBadge({
  type,
  labels,
}: {
  type: ImpactSourceType;
  labels: { automatic: string; semiautomatic: string; entity_provided: string };
}) {
  const text = labels[type];
  const cls =
    type === 'automatic'
      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
      : type === 'semiautomatic'
        ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
        : 'bg-primary/10 text-primary';
  return (
    <span className={`inline-flex w-fit items-center rounded-[5px] px-1.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {text}
    </span>
  );
}

export function PublicToggle({
  on,
  disabled,
  label,
  onToggle,
}: {
  on: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className="mt-2 flex min-h-11 items-center gap-2 text-left text-sm disabled:opacity-60"
    >
      <span
        className={[
          'relative inline-flex h-6 w-10 shrink-0 rounded-full border transition-colors',
          on ? 'border-primary bg-primary' : 'border-border bg-muted',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
