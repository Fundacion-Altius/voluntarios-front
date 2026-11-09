'use client';

import { useTranslations } from 'next-intl';
import { MenuCard } from '@/modules/comandero/components/admin/MenuCard';
import { SessionCard } from '@/modules/comandero/components/admin/SessionCard';

export default function ComanderoAdminPage() {
  const t = useTranslations('comandero.admin');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1" data-testid="comandero-admin">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <MenuCard />
      <SessionCard />
    </div>
  );
}
