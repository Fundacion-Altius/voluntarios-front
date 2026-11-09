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
    <>
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
        <Button variant="outline" data-testid="comandero-table-add" onClick={addTable} disabled={!label}>
          <Plus className="mr-1 size-4" />
          {t('tableButton')}
        </Button>
        <Button
          data-testid="comandero-session-close"
          className="bg-cta text-cta-foreground hover:bg-cta-hover"
          onClick={onClose}
          disabled={busy}
        >
          {t('close')}
        </Button>
      </div>
      <FloorGrid floor={floor} />
    </>
  );
}
