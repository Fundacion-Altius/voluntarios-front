'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, CalendarDays } from 'lucide-react';

interface CalendarEvent {
  id: string;
  name: string;
  type: string;
  deadline: string;
  funding_body: string;
}

const TYPE_COLORS: Record<string, string> = {
  EU: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  public: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  private: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  CSR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const TYPE_LABELS: Record<string, string> = {
  EU: 'EU',
  public: 'Público',
  private: 'Privado',
  CSR: 'RSE',
};

export default function FondosCalendarioPage() {
  const t = useTranslations('admin.fondos');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);

    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const toDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    const to = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;

    apiClient<CalendarEvent[]>(apiUrl(`/api/fund-opportunities/calendar?from=${from}&to=${to}`))
      .then((result) => {
        if (result.success) setEvents(result.data);
        else setError(result.error);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const groupedByMonth: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const month = event.deadline.substring(0, 7);
    if (!groupedByMonth[month]) groupedByMonth[month] = [];
    groupedByMonth[month].push(event);
  }

  const monthLabels: Record<string, string> = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <Link href="/admin/fondos" className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="size-4" />
        {t('volverLista')}
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="size-5" />
        <h2 className="text-xl font-semibold">{t('calendarioTitulo')}</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          {t('sinEventos')}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, monthEvents]) => {
            const [year, monthNum] = month.split('-');
            return (
              <div key={month}>
                <h3 className="mb-2 text-lg font-semibold">
                  {monthLabels[monthNum] || monthNum} {year}
                </h3>
                <div className="space-y-2">
                  {monthEvents
                    .sort((a, b) => a.deadline.localeCompare(b.deadline))
                    .map((event) => (
                      <Card key={event.id}>
                        <CardContent className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center rounded-md bg-muted px-2 py-1 text-center">
                              <span className="text-xs text-muted-foreground">
                                {event.deadline.substring(8, 10)}
                              </span>
                              <span className="text-xs font-medium">
                                {monthLabels[event.deadline.substring(5, 7)]?.substring(0, 3) || ''}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{event.name}</p>
                              <p className="text-xs text-muted-foreground">{event.funding_body}</p>
                            </div>
                          </div>
                          <Badge className={TYPE_COLORS[event.type] || ''}>
                            {TYPE_LABELS[event.type] || event.type}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
