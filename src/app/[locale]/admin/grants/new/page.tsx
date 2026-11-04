'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Link, useRouter } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { grantApi } from '@/lib/api/grantApi';
import type { GrantFormData, GrantType } from '@/types/grant';

interface FormState {
  name: string;
  funding_body: string;
  type: GrantType;
  amount: string;
  application_date: string;
  deadline: string;
  resolution_date: string;
  justification_deadline: string;
  justification_requirements: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  funding_body: '',
  type: 'public',
  amount: '',
  application_date: '',
  deadline: '',
  resolution_date: '',
  justification_deadline: '',
  justification_requirements: '',
};

function toPayload(form: FormState): GrantFormData {
  const payload: GrantFormData = {
    name: form.name.trim(),
    funding_body: form.funding_body.trim(),
    type: form.type,
    amount: Number(form.amount),
  };
  if (form.application_date) payload.application_date = form.application_date;
  if (form.deadline) payload.deadline = form.deadline;
  if (form.resolution_date) payload.resolution_date = form.resolution_date;
  if (form.justification_deadline) payload.justification_deadline = form.justification_deadline;
  if (form.justification_requirements.trim()) {
    payload.justification_requirements = form.justification_requirements.trim();
  }
  return payload;
}

export default function NewGrantPage() {
  const t = useTranslations('admin.grantForm');
  const tPage = useTranslations('admin.grantsPage');
  const tDetail = useTranslations('admin.grantDetail');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    form.name.trim() !== '' && form.funding_body.trim() !== '' && Number(form.amount) > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await grantApi.create(toPayload(form));
      if (response.success && response.data) {
        router.push(`/admin/grants/${response.data.id}`);
      } else {
        setError(response.error || t('error'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>{tCommon('notAuthenticated')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/grants">
          <Button variant="outline" size="sm" type="button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tDetail('backToList')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground">{tPage('subtitle')}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tDetail('basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('title')}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="grant-name">{t('name')}</Label>
                <Input
                  id="grant-name"
                  required
                  placeholder={t('namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-funding-body">{t('fundingBody')}</Label>
                <Input
                  id="grant-funding-body"
                  required
                  placeholder={t('fundingBodyPlaceholder')}
                  value={form.funding_body}
                  onChange={(e) => setField('funding_body', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-type">{t('type')}</Label>
                <Select value={form.type} onValueChange={(value) => setField('type', value as GrantType)}>
                  <SelectTrigger id="grant-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">{tPage('public')}</SelectItem>
                    <SelectItem value="private">{tPage('private')}</SelectItem>
                    <SelectItem value="EU">{tPage('eu')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-amount">{t('amount')}</Label>
                <Input
                  id="grant-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  placeholder={t('amountPlaceholder')}
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-application-date">{t('applicationDate')}</Label>
                <Input
                  id="grant-application-date"
                  type="date"
                  value={form.application_date}
                  onChange={(e) => setField('application_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-deadline">{t('deadline')}</Label>
                <Input
                  id="grant-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setField('deadline', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-resolution-date">{t('resolutionDate')}</Label>
                <Input
                  id="grant-resolution-date"
                  type="date"
                  value={form.resolution_date}
                  onChange={(e) => setField('resolution_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grant-justification-deadline">{t('justificationDeadline')}</Label>
                <Input
                  id="grant-justification-deadline"
                  type="date"
                  value={form.justification_deadline}
                  onChange={(e) => setField('justification_deadline', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="grant-justification-requirements">{t('justificationRequirements')}</Label>
                <Textarea
                  id="grant-justification-requirements"
                  maxLength={500}
                  placeholder={t('justificationRequirementsPlaceholder')}
                  value={form.justification_requirements}
                  onChange={(e) => setField('justification_requirements', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/admin/grants">
                <Button type="button" variant="outline">
                  {t('cancel')}
                </Button>
              </Link>
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? tCommon('guardando') : t('submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
