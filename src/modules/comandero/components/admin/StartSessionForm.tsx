'use client';

import { Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Names the service and starts it; the carta is frozen as a snapshot at that moment. */
export function StartSessionForm({ busy, onStart }: { busy: boolean; onStart: (label: string) => void }) {
  const t = useTranslations('comandero.admin.session');
  const [label, setLabel] = useState('');
  const name = label.trim();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="session-label">{t('label')}</Label>
        <Input
          id="session-label"
          data-testid="comandero-session-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('labelPlaceholder')}
        />
      </div>
      <Button data-testid="comandero-session-start" onClick={() => onStart(name)} disabled={busy || !name}>
        {busy ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Plus className="mr-1 size-4" />}
        {t('start')}
      </Button>
    </div>
  );
}
