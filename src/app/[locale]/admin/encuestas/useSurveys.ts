'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface Survey {
  id: number;
  nombre: string;
  departamento: string;
  minutos: number;
  created_at: string;
}

export interface QuestionRating {
  questionId: number;
  questionText: string;
  averageRating: number;
  totalAnswers: number;
}

export interface SurveyReport {
  title: string;
  generated_at: string;
  data: QuestionRating[];
  total: number;
}

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export function useSurveys() {
  const { data: session } = useSession();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SurveyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchSurveys = useCallback(async () => {
    const token = (session as any)?.authToken;
    const thisFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/surveys`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to fetch surveys');
        if (thisFetchId === fetchIdRef.current) { setIsLoading(false); }
        return;
      }
      const data = await res.json();
      if (thisFetchId === fetchIdRef.current) {
        setSurveys(data);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) {
        setError(err.message);
        setIsLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const createSurvey = async (survey: { nombre: string; departamento: string; minutos: number }) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/surveys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(survey),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false as const, error: errorData.message || errorData.error || 'Failed to create survey' };
    }
    await fetchSurveys();
    return { success: true as const };
  };

  const deleteSurvey = async (id: number) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/surveys/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false as const, error: errorData.message || errorData.error || 'Failed to delete survey' };
    }
    await fetchSurveys();
    return { success: true as const };
  };

  const fetchReport = useCallback(async () => {
    const token = (session as any)?.authToken;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/surveys/get-report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || errorData.error || 'Failed to fetch report');
        return;
      }
      const json = await res.json();
      if (json.success && json.data?.reportJson) {
        setReport(json.data.reportJson);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  }, [session]);

  return {
    surveys,
    isLoading,
    error,
    report,
    reportLoading,
    createSurvey,
    deleteSurvey,
    fetchSurveys,
    fetchReport,
  };
}
