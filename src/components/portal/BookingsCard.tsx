'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export interface Booking {
  id: string;
  date: string;
  shift: string;
  status: string;
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
              <div key={b.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{b.shift || t('turno')}</p>
                  <p className="text-xs text-muted-foreground">{new Date(b.date).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline">{b.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}