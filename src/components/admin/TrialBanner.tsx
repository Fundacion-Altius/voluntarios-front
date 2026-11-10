'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { apiClient, apiUrl } from '@/lib/apiClient';

type SubscriptionStatus = {
  status?: string;
  trial_days_remaining?: number | null;
  readonly?: boolean;
};

export function TrialBanner() {
  const t = useTranslations('admin.trial');
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<SubscriptionStatus>(apiUrl('/api/billing/subscription-status'))
      .then((result) => {
        if (!cancelled) setStatus(result.success ? result.data : null);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) return null;

  if (status.status === 'trialing' && typeof status.trial_days_remaining === 'number') {
    return (
      <div
        role="status"
        className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-50"
      >
        {t('daysLeft', { n: status.trial_days_remaining })}{' '}
        <Link href="/planes" className="font-medium underline underline-offset-2">
          {t('seePlans')}
        </Link>
      </div>
    );
  }

  if (status.status === 'expired' && status.readonly) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-50"
      >
        {t('readonlyNotice')}{' '}
        <Link href="/planes" className="font-medium underline underline-offset-2">
          {t('seePlans')}
        </Link>
        {' · '}
        <Link href="/admin/exportaciones" className="font-medium underline underline-offset-2">
          {t('exportData')}
        </Link>
      </div>
    );
  }

  return null;
}
