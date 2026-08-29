'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export interface AutomationMetricsView {
  tasksAutomated: number;
  hoursSaved: number;
  breakdown: {
    member_comms: number;
    churn_alerts: number;
    grant_reminders: number;
  };
}

export interface ManualTaskView {
  id: string;
  title: string;
  href: string;
}

interface AutomationWorkloadWidgetProps {
  metrics: AutomationMetricsView;
  manualCount: number;
  justificationHref?: string;
}

export function AutomationWorkloadWidget({
  metrics,
  manualCount,
  justificationHref = '/admin/grants',
}: AutomationWorkloadWidgetProps) {
  const t = useTranslations('admin.automation');
  const { member_comms, churn_alerts, grant_reminders } = metrics.breakdown;
  const summary = t('metricsSummary', {
    tasks: metrics.tasksAutomated,
    hours: metrics.hoursSaved,
    memberComms: member_comms,
    churnAlerts: churn_alerts,
    grantReminders: grant_reminders,
  });

  return (
    <Card data-testid="automation-workload-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('workloadTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{summary}</p>
        <p className="text-sm">
          {t('manualPending', { count: manualCount })}{' '}
          <Link href={justificationHref} className="underline">
            {t('justificationLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
