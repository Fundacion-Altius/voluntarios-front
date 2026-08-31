'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { BookingQr } from '@/components/portal/BookingQr';

export interface Booking {
  id: string;
  date: string;
  shift: string;
  status: string;
  name?: string;
  qrPayload?: string;
  qrDataUrl?: string;
}

interface BookingsCardProps {
  bookings: Booking[];
}

export function BookingsCard({ bookings }: BookingsCardProps) {
  const t = useTranslations('portal.home');

  return (
    <Card>
      <CardHeader><CardTitle>{t('misReservas')}</CardTitle></CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('sinReservas')}</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{b.name || b.shift || t('turno')}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.date).toLocaleDateString()}
                    {b.shift ? ` · ${b.shift}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{b.status}</Badge>
                  <BookingQr dataUrl={b.qrDataUrl} payload={b.qrPayload} label={t('codigoQr')} hint={t('mostrarQr')} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}