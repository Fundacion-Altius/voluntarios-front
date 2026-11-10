'use client';

import { Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/modules/comandero/money';
import type { MenuItem } from '@/modules/comandero/types';

/** Classroom carta as concept rows (not a data table): name · station · price · remove. */
export function MenuRows({ items, onRemove }: { items: MenuItem[]; onRemove: (id: string) => void }) {
  const t = useTranslations('comandero.admin.menu');
  const locale = useLocale();

  return (
    <div className="space-y-2" data-testid="comandero-menu-table" role="list">
      {items.map((item) => (
        <div
          key={item.id}
          role="listitem"
          data-testid="comandero-menu-row"
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3"
        >
          <div className="min-w-0 font-medium" data-testid="comandero-menu-row-name">
            {item.name}
          </div>
          <span
            className={
              item.category === 'bebida'
                ? 'rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800'
                : 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900'
            }
          >
            {t(item.category === 'bebida' ? 'barra' : 'cocina')}
          </span>
          <span className="tabular-nums text-sm font-semibold" data-testid="comandero-menu-row-price">
            {formatMoney(item.price_cents, locale)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            aria-label={t('remove', { name: item.name })}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
}
