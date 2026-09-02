'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
import { FieldSelector } from '@/components/export/FieldSelector';
import { FilterConfig, type ExportFilters } from '@/components/export/FilterConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

const DOMAINS = ['volunteers', 'contracts', 'surveys', 'members', 'grants'] as const;
const FORMATS = ['csv', 'xlsx', 'pdf'] as const;

async function saveBlob(response: Response) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const header = response.headers.get('content-disposition') ?? '';
  const match = header.match(/filename="([^"]+)"/);
  link.href = url;
  link.download = match?.[1] ?? 'export.bin';
  link.click();
  URL.revokeObjectURL(url);
}

export default function CustomReportBuilderPage() {
  const t = useTranslations('admin.export');
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>('volunteers');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('csv');
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    status: '',
    sortField: '',
    sortDirection: 'desc',
  });
  const [reportName, setReportName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet(`/api/export/fields/${domain}`)
      .then((res) => res.json())
      .then((body) => {
        setAvailable(body.fields ?? []);
        setSelected(body.fields ?? []);
      });
  }, [domain]);

  const requestBody = () => ({
    domain,
    format,
    fields: selected,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    status: filters.status || undefined,
    sort: filters.sortField ? { field: filters.sortField, direction: filters.sortDirection } : undefined,
  });

  const run = async () => {
    setError('');
    const response = await apiPost('/api/export', requestBody());
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || t('error'));
      return;
    }
    await saveBlob(response);
  };

  const save = async () => {
    setError('');
    const response = await apiPost('/api/export/saved-reports', { name: reportName, request: requestBody() });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || t('error'));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('builderTitle')}</h2>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t('fieldsAndFilters')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="domain">{t('domain')}</Label>
              <Select value={domain} onValueChange={(value) => setDomain(value as typeof domain)}>
                <SelectTrigger id="domain" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="format">{t('format')}</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as typeof format)}>
                <SelectTrigger id="format" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <FieldSelector fields={available} selected={selected} onChange={setSelected} />
          <FilterConfig value={filters} onChange={setFilters} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={run}>{t('generate')}</Button>
            <Input className="max-w-xs" placeholder={t('savedName')} value={reportName} onChange={(event) => setReportName(event.target.value)} />
            <Button variant="outline" onClick={save} disabled={!reportName}>{t('saveReport')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
