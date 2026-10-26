'use client';

import { apiGet, apiPost } from '@/app/lib/csrf';
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

interface Family {
  id: string;
  name: string;
  adults: number;
  children: number;
}

interface Rule {
  id: string;
  name: string;
  min_adults: number;
  min_children: number;
  lines: { item: string; quantity: number }[];
}

interface DoorEvent {
  id: string;
  family_id: string;
  kind: string;
  reason: string | null;
}

interface Leftover {
  id: string;
  item: string;
  quantity: number;
  destination: string;
  partner_name: string | null;
}

interface Tally {
  family_count: number;
  lines: { item: string; quantity: number }[];
}

export default function UnKiloPage() {
  const t = useTranslations('admin.unKilo');
  const [families, setFamilies] = useState<Family[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [door, setDoor] = useState<DoorEvent[]>([]);
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [tally, setTally] = useState<Tally | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('1');

  const load = useCallback(async (seed = false) => {
    setLoading(true);
    setError('');
    try {
      if (seed) await apiPost('/api/one-kilo/seed-demo', {});
      const res = await apiGet('/api/one-kilo');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const data = (await res.json()) as {
        families?: Family[];
        rules?: Rule[];
        door?: DoorEvent[];
        leftovers?: Leftover[];
        tally?: Tally;
      };
      setFamilies(data.families || []);
      setRules(data.rules || []);
      setDoor(data.door || []);
      setLeftovers(data.leftovers || []);
      setTally(data.tally || null);
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

  const createFamily = async () => {
    if (!name.trim()) return;
    const res = await apiPost('/api/one-kilo/families', {
      name: name.trim(),
      adults: Number(adults) || 0,
      children: Number(children) || 0,
    });
    if (!res.ok) {
      setError(t('error'));
      return;
    }
    setName('');
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

      <Card>
        <CardHeader>
          <CardTitle>{t('rosterTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('familyNamePlaceholder')}
              className="max-w-xs"
            />
            <Input
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              placeholder={t('adults')}
              className="w-24"
            />
            <Input
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              placeholder={t('children')}
              className="w-24"
            />
            <Button type="button" onClick={() => void createFamily()}>
              {t('addFamily')}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colName')}</TableHead>
                <TableHead>{t('adults')}</TableHead>
                <TableHead>{t('children')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.name}</TableCell>
                  <TableCell>{f.adults}</TableCell>
                  <TableCell>{f.children}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('rulesTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map((r) => (
              <div key={r.id} className="rounded border p-3 text-sm">
                <div className="font-medium">{r.name}</div>
                <div className="text-muted-foreground">
                  ≥{r.min_adults} {t('adults')} · ≥{r.min_children} {t('children')}
                </div>
                <ul className="mt-1 list-disc pl-5">
                  {r.lines.map((l) => (
                    <li key={l.item}>
                      {l.item}: {l.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('tallyTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">
              {t('familiesCounted', { count: tally?.family_count ?? 0 })}
            </p>
            <ul className="space-y-1 text-sm">
              {(tally?.lines || []).map((l) => (
                <li key={l.item} className="flex justify-between border-b py-1">
                  <span>{l.item}</span>
                  <Badge variant="secondary">{l.quantity}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('doorTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colFamily')}</TableHead>
                  <TableHead>{t('colKind')}</TableHead>
                  <TableHead>{t('colReason')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {door.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{families.find((f) => f.id === e.family_id)?.name || e.family_id}</TableCell>
                    <TableCell>{e.kind}</TableCell>
                    <TableCell>{e.reason || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('leftoversTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colItem')}</TableHead>
                  <TableHead>{t('colQty')}</TableHead>
                  <TableHead>{t('colDestination')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leftovers.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.item}</TableCell>
                    <TableCell>{l.quantity}</TableCell>
                    <TableCell>
                      {l.destination}
                      {l.partner_name ? ` · ${l.partner_name}` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
