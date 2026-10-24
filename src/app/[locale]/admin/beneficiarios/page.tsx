'use client';

import { apiGet, apiPatch, apiPost } from '@/app/lib/csrf';
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

interface Beneficiary {
  id: string;
  display_name: string;
  program: string | null;
  notes: string | null;
}

interface MentoringMatch {
  id: string;
  beneficiary_id: string;
  volunteer_name: string;
  status: string;
}

export default function BeneficiariosPage() {
  const t = useTranslations('admin.beneficiarios');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [matches, setMatches] = useState<MentoringMatch[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [program, setProgram] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await apiPost('/api/beneficiaries/seed-demo', {});
      const res = await apiGet('/api/beneficiaries');
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      const body = (await res.json()) as {
        beneficiaries?: Beneficiary[];
        matches?: MentoringMatch[];
      };
      setBeneficiaries(body.beneficiaries || []);
      setMatches(body.matches || []);
      if (!selectedBeneficiary && body.beneficiaries?.[0]) {
        setSelectedBeneficiary(body.beneficiaries[0].id);
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [selectedBeneficiary, t]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const createBeneficiary = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/beneficiaries', {
        display_name: name.trim(),
        program: program.trim() || null,
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setName('');
      setProgram('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const createMatch = async () => {
    if (!selectedBeneficiary || !volunteerName.trim()) return;
    setBusy(true);
    try {
      const res = await apiPost('/api/beneficiaries/matches', {
        beneficiary_id: selectedBeneficiary,
        volunteer_id: `vol-${Date.now()}`,
        volunteer_name: volunteerName.trim(),
        status: 'active',
      });
      if (!res.ok) {
        setError(t('error'));
        return;
      }
      setVolunteerName('');
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  const endMatch = async (id: string) => {
    setBusy(true);
    try {
      await apiPatch(`/api/beneficiaries/matches/${id}`, { status: 'ended' });
      await load();
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder={t('programPlaceholder')}
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          />
          <Button type="button" onClick={() => void createBeneficiary()} disabled={busy}>
            {t('create')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!beneficiaries.length ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colName')}</TableHead>
                  <TableHead>{t('colProgram')}</TableHead>
                  <TableHead>{t('colNotes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beneficiaries.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.display_name}</TableCell>
                    <TableCell>{b.program || '—'}</TableCell>
                    <TableCell>{b.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('matchTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={selectedBeneficiary}
              onChange={(e) => setSelectedBeneficiary(e.target.value)}
            >
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.display_name}
                </option>
              ))}
            </select>
            <Input
              placeholder={t('volunteerPlaceholder')}
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
            />
            <Button type="button" onClick={() => void createMatch()} disabled={busy}>
              {t('assign')}
            </Button>
          </div>
          {!matches.length ? (
            <p className="text-sm text-muted-foreground">{t('matchesEmpty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('colVolunteer')}</TableHead>
                  <TableHead>{t('colBeneficiary')}</TableHead>
                  <TableHead>{t('colStatus')}</TableHead>
                  <TableHead>{t('colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => {
                  const ben = beneficiaries.find((b) => b.id === m.beneficiary_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{m.volunteer_name}</TableCell>
                      <TableCell>{ben?.display_name || m.beneficiary_id}</TableCell>
                      <TableCell>{m.status}</TableCell>
                      <TableCell>
                        {m.status !== 'ended' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void endMatch(m.id)}
                          >
                            {t('endMatch')}
                          </Button>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
