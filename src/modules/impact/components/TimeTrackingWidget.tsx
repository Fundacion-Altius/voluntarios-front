/**
 * TimeTrackingWidget Component
 * 
 * A dashboard widget for tracking time spent on justification activities.
 * Provides start/stop timer functionality and month-over-month comparison metrics.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PlayCircle, StopCircle, Clock, TrendingUp, TrendingDown, Minus, Award, FileText, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeTrackingWidgetProps, ActivityType, JustificationTimeEntry, JustificationTimeMetrics, MonthlyComparison } from '../impactReportTypes';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Activity type configuration
const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: React.ReactNode; color: string }> = {
  report_creation: { label: 'Report Creation', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  evidence_collection: { label: 'Evidence Collection', icon: <Search className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  review: { label: 'Review', icon: <Users className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  revision: { label: 'Revision', icon: <Award className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  submission: { label: 'Submission', icon: <PlayCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
};

// Format time duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Format time for display
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format percentage
function formatPercentage(value: number): string {
  return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
}

export function TimeTrackingWidget({ 
  reportId, 
  userId, 
  onTimerStart,
  onTimerStop,
  showMetrics = true 
}: TimeTrackingWidgetProps) {
  const t = useTranslations('impact.timeTracking');
  const [activeTimer, setActiveTimer] = useState<JustificationTimeEntry | null>(null);
  const [timeMetrics, setTimeMetrics] = useState<JustificationTimeMetrics | null>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('report_creation');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch active timer
  const fetchActiveTimer = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/impact/impact-reports/justification-time/${userId}/active`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setActiveTimer(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching active timer:', err);
    }
  }, [userId]);

  // Fetch time metrics
  const fetchTimeMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/impact/impact-reports/justification-time/${reportId}/metrics`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTimeMetrics(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching time metrics:', err);
    }
  }, [reportId]);

  // Fetch monthly comparison
  const fetchMonthlyComparison = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/impact/impact-reports/justification-time/monthly-comparison`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMonthlyComparison(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching monthly comparison:', err);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchActiveTimer(),
          fetchTimeMetrics(),
          fetchMonthlyComparison(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load time tracking data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchActiveTimer, fetchTimeMetrics, fetchMonthlyComparison]);

  // Update elapsed time for active timer
  useEffect(() => {
    if (!activeTimer || !activeTimer.isActive) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(activeTimer.startTime).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      setElapsedTime(elapsedSeconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Handle timer start
  const handleStartTimer = async () => {
    if (!selectedActivity) return;
    
    try {
      if (onTimerStart) {
        await onTimerStart(selectedActivity);
      }
      
      // Refresh data after starting timer
      await fetchActiveTimer();
      await fetchTimeMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start timer');
    }
  };

  // Handle timer stop
  const handleStopTimer = async () => {
    if (!activeTimer) return;
    
    try {
      if (onTimerStop) {
        await onTimerStop();
      }
      
      // Refresh data after stopping timer
      await fetchActiveTimer();
      await fetchTimeMetrics();
      setElapsedTime(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop timer');
    }
  };

  // Get trend indicator
  const getTrendIndicator = () => {
    if (!monthlyComparison) return null;
    
    if (monthlyComparison.improvementPercentage > 5) {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        label: t('improving'),
        color: 'text-green-600',
        value: formatPercentage(monthlyComparison.improvementPercentage),
      };
    } else if (monthlyComparison.improvementPercentage < -5) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        label: t('worsening'),
        color: 'text-red-600',
        value: formatPercentage(monthlyComparison.improvementPercentage),
      };
    }
    return {
      icon: <Minus className="h-4 w-4" />,
      label: t('stable'),
      color: 'text-gray-600',
      value: formatPercentage(monthlyComparison.improvementPercentage),
    };
  };

  // Calculate total time for all reports
  const totalTimeAllReports = timeMetrics ? timeMetrics.totalTimeSeconds : 0;
  
  // Get time by activity for progress display
  const timeByActivity = timeMetrics ? timeMetrics.timeByActivity : {};
  const totalActivityTime = Object.values(timeByActivity).reduce((sum, time) => sum + time, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('timeTracking')}</CardTitle>
          <CardDescription>{t('loading')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('timeTracking')}</CardTitle>
        <CardDescription>{t('trackJustificationTime')}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Timer Controls */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Select value={selectedActivity} onValueChange={(value) => setSelectedActivity(value as ActivityType)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('selectActivity')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeTimer && activeTimer.isActive ? (
            <Button 
              variant="destructive" 
              onClick={handleStopTimer}
              className="flex items-center gap-2"
              disabled={!activeTimer.isActive}
            >
              <StopCircle className="h-5 w-5" />
              {t('stopTimer')}
            </Button>
          ) : (
            <Button 
              onClick={handleStartTimer}
              className="flex items-center gap-2"
              disabled={!!activeTimer?.isActive}
            >
              <PlayCircle className="h-5 w-5" />
              {t('startTimer')}
            </Button>
          )}
        </div>

        {/* Active Timer Display */}
        {activeTimer && activeTimer.isActive && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{t('activeTimer')}</h4>
                <p className="text-sm text-muted-foreground">
                  {ACTIVITY_CONFIG[activeTimer.activityType as ActivityType]?.label || activeTimer.activityType}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('startedAt')} {formatDate(activeTimer.startTime)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(elapsedTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Time Metrics */}
        {showMetrics && timeMetrics && (
          <div className="space-y-4">
            <h4 className="font-semibold">{t('timeMetrics')}</h4>
            
            {/* Total Time */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalTime')}</p>
                <p className="text-2xl font-bold">{formatDuration(totalTimeAllReports)}</p>
              </div>
              
              {/* Trend Indicator */}
              {monthlyComparison && (
                <div className="flex items-center gap-2">
                  <div className={getTrendIndicator()?.color || 'text-gray-600'}>
                    {getTrendIndicator()?.icon}
                  </div>
                  <span className={`text-sm font-medium ${getTrendIndicator()?.color || 'text-gray-600'}`}>
                    {getTrendIndicator()?.value}
                  </span>
                </div>
              )}
            </div>

            {/* Time by Activity */}
            {totalActivityTime > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">{t('timeByActivity')}</h5>
                <div className="space-y-2">
                  {Object.entries(timeByActivity).map(([activity, seconds]) => {
                    const config = ACTIVITY_CONFIG[activity as ActivityType];
                    const percentage = (seconds / totalActivityTime) * 100;
                    
                    return (
                      <div key={activity} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {config?.icon}
                            <span>{config?.label || activity}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {formatDuration(seconds)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly Comparison */}
            {monthlyComparison && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h5 className="font-semibold mb-3">{t('monthlyComparison')}</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('currentMonth')}</p>
                    <p className="text-xl font-bold">
                      {formatDuration(monthlyComparison.currentMonth.totalTimeSeconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('avgPerReport')}: {formatDuration(monthlyComparison.currentMonth.averageTimePerReport)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">{t('previousMonth')}</p>
                    <p className="text-xl font-bold">
                      {formatDuration(monthlyComparison.previousMonth.totalTimeSeconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('avgPerReport')}: {formatDuration(monthlyComparison.previousMonth.averageTimePerReport)}
                    </p>
                  </div>
                </div>

                {/* Improvement Indicator */}
                <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{t('improvement')}</p>
                  <p className={`text-2xl font-bold ${monthlyComparison.improvementPercentage > 0 ? 'text-green-600' : monthlyComparison.improvementPercentage < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatPercentage(monthlyComparison.improvementPercentage)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {monthlyComparison.improvementPercentage > 0 
                      ? t('timeReduced') 
                      : monthlyComparison.improvementPercentage < 0 
                        ? t('timeIncreased') 
                        : t('timeStable')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No data state */}
        {!activeTimer && !timeMetrics && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>{t('noTimeData')}</p>
            <p className="text-sm mt-1">{t('startTimerToTrack')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TimeTrackingWidget;
