'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface WorkflowConfig {
  id: string;
  enabled: boolean;
  templateName: string;
  subject: string;
}

const WORKFLOW_LABELS: Record<string, string> = {
  'member.welcome': 'memberWelcome',
  'member.lapsed': 'memberLapsed',
  'member.anniversary': 'memberAnniversary',
  'grant.deadline_reminder': 'grantDeadlineReminder',
  'grant.overdue_escalation': 'grantOverdueEscalation',
};

function workflowLabel(id: string, t: ReturnType<typeof useTranslations>): string {
  const key = WORKFLOW_LABELS[id];
  return key ? t(`workflow.${key}`) : id;
}

export default function AutomationSettingsPage() {
  const t = useTranslations('admin.automation');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    apiClient<WorkflowConfig[]>(apiUrl('/api/automation/workflows')).then((result) => {
      if (result.success) setWorkflows(result.data);
      else setError(result.error);
      setIsLoading(false);
    });
  }, [authLoading, isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const saveWorkflow = async (workflow: WorkflowConfig) => {
    setSavingId(workflow.id);
    setError('');
    const result = await apiClient<WorkflowConfig>(apiUrl(`/api/automation/workflows/${workflow.id}`), {
      method: 'PUT',
      body: JSON.stringify({ enabled: workflow.enabled, subject: workflow.subject, templateName: workflow.templateName }),
    });
    if (!result.success) setError(result.error);
    setSavingId(null);
  };

  const patchWorkflow = (id: string, patch: Partial<WorkflowConfig>) => {
    setWorkflows((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('settingsTitle')}</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {workflows.map((workflow) => (
        <Card key={workflow.id}>
          <CardHeader>
            <CardTitle className="text-base">{workflowLabel(workflow.id, t)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`enabled-${workflow.id}`}
                checked={workflow.enabled}
                onCheckedChange={(checked) => patchWorkflow(workflow.id, { enabled: checked === true })}
              />
              <Label htmlFor={`enabled-${workflow.id}`}>{t('enabled')}</Label>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`subject-${workflow.id}`}>{t('subject')}</Label>
              <Input
                id={`subject-${workflow.id}`}
                value={workflow.subject}
                onChange={(event) => patchWorkflow(workflow.id, { subject: event.target.value })}
              />
            </div>
            <Button onClick={() => saveWorkflow(workflow)} disabled={savingId === workflow.id}>
              {t('save')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
