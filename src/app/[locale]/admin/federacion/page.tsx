'use client';

import { apiGet } from '@/app/lib/csrf';
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

interface FederationTenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  contracts: number;
  active_volunteers: number;
}

interface FederationDashboard {
  federation: { id: string; name: string; slug: string };
  totals: {
    member_tenants: number;
    contracts: number;
    active_volunteers: number;
  };
  tenants: FederationTenantSummary[];
}

export default function FederacionPage() {
  const t = useTranslations('admin.federacion');
  const [data, setData] = useState<FederationDashboard | null>(null);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    setForbidden(false);
    setLoading(true);
    try {
      const res = await apiGet('/api/federation/dashboard');
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(t('error'));
        setData(null);
        return;
      }
      setData((await res.json()) as FederationDashboard);
    } catch {
      setError(t('error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (forbidden) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('forbidden')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        {data?.federation ? (
          <p className="mt-1 text-sm font-medium">{data.federation.name}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('memberTenants')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.totals.member_tenants}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('contracts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.totals.contracts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('activeVolunteers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.totals.active_volunteers}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('tenantsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.tenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('colName')}</TableHead>
                      <TableHead>{t('colSlug')}</TableHead>
                      <TableHead>{t('colStatus')}</TableHead>
                      <TableHead className="text-right">{t('contracts')}</TableHead>
                      <TableHead className="text-right">{t('activeVolunteers')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{tenant.slug}</TableCell>
                        <TableCell>{tenant.status}</TableCell>
                        <TableCell className="text-right">{tenant.contracts}</TableCell>
                        <TableCell className="text-right">{tenant.active_volunteers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
