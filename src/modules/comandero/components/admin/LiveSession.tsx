'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FloorState } from '@/modules/comandero/types';
import { FloorGrid } from './FloorGrid';

/** A running service: add tables, watch the live floor, close the service. */
export function LiveSession({
  floor,
  busy,
  onAddTable,
  onClose,
}: {
  floor: FloorState | null;
  busy: boolean;
  onAddTable: (label: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations('comandero.admin.session');
  const [tableLabel, setTableLabel] = useState('');
  const label = tableLabel.trim();

  const addTable = async () => {
    await onAddTable(label);
    setTableLabel('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-600" aria-hidden />
              {t('livePill')}
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-foreground">{t('liveTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('liveHint')}</p>
        </div>
        <Button
          data-testid="comandero-session-close"
          className="min-h-11 bg-destructive/15 text-destructive hover:bg-destructive/25"
          onClick={onClose}
          disabled={busy}
        >
          {t('close')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="table-label">{t('addTable')}</Label>
          <Input
            id="table-label"
            data-testid="comandero-table-label"
            value={tableLabel}
            onChange={(e) => setTableLabel(e.target.value)}
            placeholder={t('tablePlaceholder')}
          />
        </div>
        <Button variant="outline" className="min-h-11" data-testid="comandero-table-add" onClick={addTable} disabled={!label}>
          <Plus className="mr-1 size-4" />
          {t('tableButton')}
        </Button>
      </div>
      <FloorGrid floor={floor} />
    </div>
  );
}
