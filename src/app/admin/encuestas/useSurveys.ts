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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      if (!res.ok) throw new Error('Failed to fetch surveys');
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
    if (!res.ok) throw new Error('Failed to create survey');
    await fetchSurveys();
  };

  const deleteSurvey = async (id: number) => {
    const token = (session as any)?.authToken;
    const res = await fetch(`${API_URL}/api/surveys/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete survey');
    await fetchSurveys();
  };

  const fetchReport = useCallback(async () => {
    const token = (session as any)?.authToken;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/surveys/get-report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch report');
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
