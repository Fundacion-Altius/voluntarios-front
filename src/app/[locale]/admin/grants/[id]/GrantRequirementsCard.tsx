'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { grantApi } from '@/lib/api/grantApi';
import type { GrantRequirementsData } from '@/types/grant';

interface GrantRequirementsCardProps {
  grantId: string;
  data: GrantRequirementsData | null;
  onChanged: () => Promise<void> | void;
}

export function GrantRequirementsCard({ grantId, data, onChanged }: GrantRequirementsCardProps) {
  const t = useTranslations('admin.grantDetail');
  const tCommon = useTranslations('common');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const requirements = data?.requirements ?? [];
  const completion = data?.completion;

  const handleToggle = async (reqId: string, completed: boolean) => {
    setPendingId(reqId);
    setError(null);
    try {
      const response = await grantApi.updateRequirement(grantId, reqId, { completed });
      if (!response.success) {
        setError(response.error || t('errorUpdatingRequirement'));
        return;
      }
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorUpdatingRequirement'));
    } finally {
      setPendingId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setIsAdding(true);
    setError(null);
    try {
      const response = await grantApi.createRequirement(grantId, { title: trimmed });
      if (!response.success) {
        setError(response.error || t('errorAddingRequirement'));
        return;
      }
      setTitle('');
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorAddingRequirement'));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('requirements')}</CardTitle>
        <CardDescription>{t('requirementsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {completion && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {t('requirementsProgress', { completed: completion.completed, total: completion.total })}
              </span>
              <span className="font-semibold" data-testid="requirements-percent">
                {completion.percent}%
              </span>
            </div>
            <Progress value={completion.percent} aria-label={t('requirements')} />
            <Badge variant={completion.ready_to_submit ? 'default' : 'secondary'}>
              {completion.ready_to_submit ? t('readyToSubmit') : t('notReadyToSubmit')}
            </Badge>
          </div>
        )}

        {requirements.length === 0 ? (
          <Alert>
            <AlertDescription>{t('noRequirements')}</AlertDescription>
          </Alert>
        ) : (
          <ul className="space-y-2">
            {requirements.map((req) => (
              <li key={req.id} className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  id={`req-${req.id}`}
                  checked={req.completed}
                  disabled={pendingId === req.id}
                  onCheckedChange={(checked) => handleToggle(req.id, checked === true)}
                  className="mt-1"
                />
                <label htmlFor={`req-${req.id}`} className="flex-1 cursor-pointer">
                  <span className={req.completed ? 'text-muted-foreground line-through' : 'font-medium'}>
                    {req.title}
                  </span>
                  {!req.required && (
                    <Badge variant="outline" className="ml-2">
                      {t('optional')}
                    </Badge>
                  )}
                  {req.description && <p className="text-sm text-muted-foreground">{req.description}</p>}
                  {req.file_name && <p className="text-xs text-muted-foreground">{req.file_name}</p>}
                </label>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('newRequirementPlaceholder')}
            aria-label={t('newRequirementPlaceholder')}
            className="max-w-sm"
            disabled={isAdding}
          />
          <Button type="submit" size="sm" disabled={isAdding || !title.trim()}>
            {isAdding ? tCommon('creando') : t('addRequirement')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
