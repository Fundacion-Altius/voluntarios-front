'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
}

interface HistoryItem {
  id: string;
  filename: string;
  format: string;
  domain: string;
  file_size: number;
  generated_at: string;
  expiry_date: string;
}

async function saveBlob(response: Response, fallback: string) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fallback;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExportHistoryPage() {
  const t = useTranslations('admin.export');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');

  const loadHistory = () => {
    apiGet('/api/export/history')
      .then((res) => res.json())
      .then(setHistory);
  };

  useEffect(() => {
    apiGet('/api/export/templates')
      .then((res) => res.json())
      .then(setTemplates);
    loadHistory();
  }, []);

  const runTemplate = async (id: string, format: string) => {
    setError('');
    const response = await apiPost('/api/export', { templateId: id, format });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || t('error'));
      return;
    }
    await saveBlob(response, `${id}.${format}`);
    loadHistory();
  };

  const download = async (item: HistoryItem) => {
    const response = await apiGet(`/api/export/history/${item.id}/download`);
    if (response.status === 410) {
      setError(t('expired'));
      return;
    }
    if (!response.ok) {
      setError(t('error'));
      return;
    }
    await saveBlob(response, item.filename);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <h2 className="mr-auto text-xl font-semibold">{t('title')}</h2>
        <Button asChild variant="outline">
          <Link href="/admin/exportaciones/builder">{t('builderTitle')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/exportaciones/programadas">{t('schedulesTitle')}</Link>
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="text-base">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="flex gap-2">
                {template.supportedFormats.map((format) => (
                  <Button key={format} size="sm" variant="outline" onClick={() => runTemplate(template.id, format)}>
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <h3 className="text-lg font-medium">{t('historyTitle')}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">{t('filename')}</th>
              <th>{t('domain')}</th>
              <th>{t('generatedAt')}</th>
              <th>{t('size')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.filename}</td>
                <td>{item.domain}</td>
                <td>{new Date(item.generated_at).toLocaleString()}</td>
                <td>{item.file_size}</td>
                <td>
                  <Button size="sm" variant="outline" onClick={() => download(item)}>{t('download')}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
