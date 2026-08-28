'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { GrantCalendarEvent, Grant } from '@/types/grant';
import { grantCalendarApi, grantApi } from '@/lib/api/grantApi';
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from '@/types/grant';

export default function GrantCalendarPage() {
  const t = useTranslations('admin.grantCalendar');
  const tCommon = useTranslations('common');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [events, setEvents] = useState<GrantCalendarEvent[]>([]);
  const [upcomingGrants, setUpcomingGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Fetch calendar events
  const fetchCalendarEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const now = new Date();
      let from, to;
      
      switch (timeRange) {
        case 'today':
          from = now.toISOString().split('T')[0];
          to = now.toISOString().split('T')[0];
          break;
        case 'week':
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString().split('T')[0];
          to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay())).toISOString().split('T')[0];
          break;
        case 'month':
          from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        default:
          from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          to = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString().split('T')[0];
      }
      
      const response = await grantCalendarApi.getEvents(from, to);
      
      if (response.success && response.data) {
        setEvents(response.data);
      } else {
        setError(response.error || t('errorLoadingEvents'));
        setEvents([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoadingEvents'));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, t]);

  // Fetch upcoming deadlines
  const fetchUpcomingDeadlines = useCallback(async () => {
    try {
      const response = await grantCalendarApi.getUpcomingDeadlines(30);
      
      if (response.success && response.data) {
        setUpcomingGrants(response.data);
      }
    } catch (err) {
      console.error('Error fetching upcoming deadlines:', err);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchCalendarEvents(),
      fetchUpcomingDeadlines(),
    ]);
  }, [fetchCalendarEvents, fetchUpcomingDeadlines]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // Refetch when time range changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCalendarEvents();
    }
  }, [timeRange, isAuthenticated, fetchCalendarEvents]);

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get days until deadline
  const getDaysUntilDeadline = (deadline: string | undefined) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter events
  const filteredEvents = overdueOnly ? events.filter(e => e.is_overdue) : events;

  // Group events by date
  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const date = event.deadline.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, GrantCalendarEvent[]>);

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();

  // Get overdue events
  const overdueEvents = events.filter(e => e.is_overdue);

  // Get upcoming events
  const upcomingEvents = events.filter(e => !e.is_overdue);

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>{tCommon('notAuthenticated')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Time Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>{tCommon('filter')}</CardTitle>
          <CardDescription>{t('filterDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('today')}
            >
              {t('today')}
            </Button>
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              {t('thisWeek')}
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              {t('thisMonth')}
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('all')}
            >
              {tCommon('all')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={overdueOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOverdueOnly(!overdueOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('overdue')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{t('upcomingDeadlines')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">{t('upcomingDescription')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{t('overdue')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueEvents.length}</div>
            <p className="text-xs text-muted-foreground">{t('overdueDescription')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{t('totalEvents')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">{t('totalEventsDescription')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines Section */}
      {upcomingGrants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('next30Days')}</CardTitle>
            <CardDescription>{t('next30DaysDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingGrants.slice(0, 5).map(grant => {
              const daysUntil = getDaysUntilDeadline(grant.deadline);
              return (
                <div key={grant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{grant.name}</h3>
                      <Badge className={STATUS_COLORS[grant.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[grant.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      <Badge variant="outline">
                        {TYPE_LABELS[grant.type as keyof typeof TYPE_LABELS]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{grant.funding_body}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{formatDate(grant.deadline)}</p>
                      {daysUntil !== null && (
                        <p className="text-sm text-muted-foreground">
                          {daysUntil > 0 ? `en ${daysUntil} días` : 'hoy'}
                        </p>
                      )}
                    </div>
                    <Link href={`/admin/grants/${grant.id}`}>
                      <Button variant="ghost" size="sm">
                        {tCommon('view')}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
            {upcomingGrants.length > 5 && (
              <p className="text-sm text-muted-foreground">
                {t('andMore', { count: upcomingGrants.length - 5 })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>{t('calendarView')}</CardTitle>
          <CardDescription>{t('calendarViewDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {sortedDates.map(date => (
                <div key={date} className="space-y-2">
                  <h3 className="text-lg font-semibold">{formatDate(date)}</h3>
                  <div className="space-y-2">
                    {eventsByDate[date].map(event => (
                      <div
                        key={event.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg ${
                          event.is_overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.grant_name}</h4>
                            {event.is_overdue && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {t('overdue')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{event.event_type.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {TYPE_LABELS[event.grant_type as keyof typeof TYPE_LABELS]}
                          </Badge>
                          {event.days_until_deadline !== undefined && (
                            <Badge variant={event.days_until_deadline < 0 ? 'destructive' : 'default'}>
                              {event.days_until_deadline < 0
                                ? `${Math.abs(event.days_until_deadline)} días atrasado`
                                : `${event.days_until_deadline} días`}
                            </Badge>
                          )}
                          <Link href={`/admin/grants/${event.grant_id}`}>
                            <Button variant="ghost" size="sm">
                              {tCommon('view')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>{t('noEventsInRange')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Overdue Section */}
      {overdueEvents.length > 0 && !overdueOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{t('overdue')}</CardTitle>
            <CardDescription>{t('overdueSectionDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-4 border border-red-200 rounded-lg bg-red-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.grant_name}</h4>
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {t('overdue')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.event_type.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {TYPE_LABELS[event.grant_type as keyof typeof TYPE_LABELS]}
                  </Badge>
                  {event.days_until_deadline !== undefined && (
                    <Badge variant="destructive">
                      {Math.abs(event.days_until_deadline)} días atrasado
                    </Badge>
                  )}
                  <Link href={`/admin/grants/${event.grant_id}`}>
                    <Button variant="ghost" size="sm">
                      {tCommon('view')}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
