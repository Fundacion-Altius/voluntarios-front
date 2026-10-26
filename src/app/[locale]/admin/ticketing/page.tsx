'use client';

import { apiGet, apiPatch, apiPost } from '@/app/lib/csrf';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

interface Ticket {
  id: string;
  number: number;
  beneficiary_name: string;
  type: string;
  priority: boolean;
  status: string;
  operator_type: string | null;
}

interface Metrics {
  pending: number;
  in_attention: number;
  completed_today: number;
}

export default function TicketingPage() {
  const t = useTranslations('admin.ticketing');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState('consulta');
  const [priority, setPriority] = useState(false);

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/tickets/seed-demo', {});
      const [listRes, metricsRes] = await Promise.all([
        apiGet('/api/tickets'),
        apiGet('/api/tickets/metrics'),
      ]);
      if (!listRes.ok || !metricsRes.ok) {
        setError(t('error'));
        return;
      }
      const listData = (await listRes.json()) as { tickets?: Ticket[] };
      setTickets(listData.tickets || []);
      setMetrics((await metricsRes.json()) as Metrics);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial seed+load only
  }, []);

  const createTicket = async () => {
    if (!name.trim()) return;
    const res = await apiPost('/api/tickets', {
      beneficiary_name: name.trim(),
      type,
      priority,
    });
    if (!res.ok) {
      setError(t('error'));
      return;
    }
    setName('');
    setPriority(false);
    await load();
  };

  const take = async (id: string) => {
    const res = await apiPatch(`/api/tickets/${id}`, {
      status: 'en_atencion',
      attended_by: 'Demo',
      operator_type: 'trabajo_social',
    });
    if (!res.ok) {
      setError(t('error'));
      return;
    }
    await load();
  };

  const complete = async (id: string) => {
    const res = await apiPatch(`/api/tickets/${id}`, {
      status: 'completado',
      notes: 'OK',
    });
    if (!res.ok) {
      setError(t('error'));
      return;
    }
    await load();
  };

  if (loading) return <p className="p-6 text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('metricPending')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{metrics?.pending ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('metricInAttention')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{metrics?.in_attention ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('metricCompleted')}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{metrics?.completed_today ?? 0}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="max-w-xs"
          />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="consulta">{t('typeConsulta')}</option>
            <option value="tramite">{t('typeTramite')}</option>
            <option value="donacion">{t('typeDonacion')}</option>
            <option value="otro">{t('typeOtro')}</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
            {t('priority')}
          </label>
          <Button type="button" onClick={() => void createTicket()}>
            {t('create')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('queueTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('colName')}</TableHead>
                <TableHead>{t('colType')}</TableHead>
                <TableHead>{t('colStatus')}</TableHead>
                <TableHead>{t('colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((tk) => (
                <TableRow key={tk.id}>
                  <TableCell>
                    {tk.number}
                    {tk.priority ? (
                      <Badge className="ml-2" variant="destructive">
                        {t('priority')}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{tk.beneficiary_name}</TableCell>
                  <TableCell>{tk.type}</TableCell>
                  <TableCell>{tk.status}</TableCell>
                  <TableCell className="space-x-2">
                    {tk.status === 'pendiente' ? (
                      <Button size="sm" type="button" onClick={() => void take(tk.id)}>
                        {t('take')}
                      </Button>
                    ) : null}
                    {tk.status === 'en_atencion' ? (
                      <Button size="sm" type="button" onClick={() => void complete(tk.id)}>
                        {t('complete')}
                      </Button>
                    ) : null}
                    {tk.status === 'completado' ? '—' : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
