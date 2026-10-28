'use client';

import { apiPost } from '@/app/lib/csrf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface McpTool {
  name: string;
  description?: string;
  effect?: string;
  requiredRoles?: string[];
  requiresAuth?: boolean;
}

export default function McpInventoryPage() {
  const t = useTranslations('admin.mcp');
  const [tools, setTools] = useState<McpTool[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiPost('/api/mcp', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });
      if (!res.ok) {
        setError(t('error'));
        setTools([]);
        return;
      }
      const body = await res.json();
      const list = (body?.result?.tools as McpTool[]) || [];
      setTools(list);
    } catch {
      setError(t('error'));
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">{t('loading')}</p> : null}

      {!loading && !error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('toolsTitle')} ({tools.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('colName')}</TableHead>
                    <TableHead>{t('colEffect')}</TableHead>
                    <TableHead>{t('colRoles')}</TableHead>
                    <TableHead>{t('colDescription')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.name}>
                      <TableCell className="font-mono text-xs">{tool.name}</TableCell>
                      <TableCell>{tool.effect || '—'}</TableCell>
                      <TableCell>{(tool.requiredRoles || []).join(', ') || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tool.description || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
