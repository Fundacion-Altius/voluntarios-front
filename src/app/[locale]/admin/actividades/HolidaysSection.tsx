'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHolidays, type Holiday } from './useHolidays';

export default function HolidaysSection() {
  const t = useTranslations('admin.actividades');
  const tCommon = useTranslations('common');
  const { holidays, isLoading, error, addHoliday, setHolidayActive, deleteHoliday } = useHolidays();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setSubmitting(true);
    try {
      await addHoliday({ date, name, region: region || 'general' });
      setDate(''); setName(''); setRegion('');
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{t('festivos')}</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('anadirFestivo')}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}
              <div><label className="mb-1 block text-sm font-medium">{t('fecha')}</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div><label className="mb-1 block text-sm font-medium">{tCommon('nombre')}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div><label className="mb-1 block text-sm font-medium">{t('region')}</label>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('regionPlaceholder')} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? t('creando') : t('anadirFestivo')}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{t('listaFestivos')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : holidays.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('noFestivos')}</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {holidays.map((h: Holiday) => (
                  <div key={h.id} className={`flex items-center justify-between rounded-md border p-2 text-sm ${h.active !== 'true' ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span>{new Date(h.date).toLocaleDateString()}</span>
                      <span className="font-medium">{h.name}</span>
                      <Badge variant="outline">{h.region}</Badge>
                      <Badge variant={h.source === 'auto' ? 'secondary' : 'default'}>
                        {h.source === 'auto' ? t('auto') : t('manual')}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setHolidayActive(h.id, h.active !== 'true')}>
                        {h.active === 'true' ? t('desactivar') : t('activar')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteHoliday(h.id)}>
                        {tCommon('eliminar')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
