'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { apiClient, type Result } from '@/lib/apiClient';

export interface FormQuestion {
  id: string;
  formId: string;
  order: number;
  type:
    | 'estrellas'
    | 'opcionUnica'
    | 'opcionMultiple'
    | 'textoCorto'
    | 'textoLargo'
    | 'siNo'
    | 'numero'
    | 'fecha';
  text: string;
  options: string[] | null;
  validation: Record<string, unknown> | null;
  conditionalLogic: {
    type: 'show_hide';
    targetQuestionId: string;
    condition: {
      sourceQuestionId: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';
      value: string;
    };
  } | null;
  dejaFuera: boolean;
  dejaFueraValue: string | null;
  recomienda: boolean;
  recomiendaValue: string | null;
  recomiendaMessage: string | null;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormLogicRule {
  id: string;
  formId: string;
  type: 'show_hide' | 'deja_fuera' | 'recomienda';
  targetQuestionId: string;
  condition: Record<string, unknown>;
  createdAt: string;
  tenantId: string | null;
}

export interface Form {
  id: string;
  title: string;
  description: string | null;
  requiresContact: boolean;
  status: 'draft' | 'published' | 'archived';
  version: number;
  currentVersionId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  tenantId: string | null;
  questions?: FormQuestion[];
  logicRules?: FormLogicRule[];
}

export interface FormSubmission {
  id: string;
  formId: string;
  formVersionId: string | null;
  status: 'completado' | 'rechazado';
  motivoRechazo: string | null;
  contactName: string | null;
  contactEmail: string | null;
  privacyAccepted: boolean;
  idempotencyKey: string | null;
  createdAt: string;
  tenantId: string | null;
}

export interface FormAnswer {
  id: string;
  submissionId: string;
  questionId: string;
  value: unknown;
  createdAt: string;
  tenantId: string | null;
}

export interface FormReport {
  title: string;
  generated_at: string;
  data: Array<{
    questionId: string;
    questionText: string;
    type: string;
    count: number;
    averageRating?: number;
    distribution?: Record<string, number>;
  }>;
  total: number;
}

export interface CreateFormInput {
  title: string;
  description?: string | null;
  requiresContact?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateFormInput {
  title?: string;
  description?: string | null;
  requiresContact?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export interface CreateFormQuestionInput {
  formId: string;
  order: number;
  type: FormQuestion['type'];
  text: string;
  options?: string[] | null;
  validation?: Record<string, unknown> | null;
  conditionalLogic?: FormQuestion['conditionalLogic'];
  dejaFuera?: boolean;
  dejaFueraValue?: string | null;
  recomienda?: boolean;
  recomiendaValue?: string | null;
  recomiendaMessage?: string | null;
}

export interface UpdateFormQuestionInput {
  order?: number;
  text?: string;
  options?: string[] | null;
  validation?: Record<string, unknown> | null;
  conditionalLogic?: FormQuestion['conditionalLogic'];
  dejaFuera?: boolean;
  dejaFueraValue?: string | null;
  recomienda?: boolean;
  recomiendaValue?: string | null;
  recomiendaMessage?: string | null;
}

function asErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Request failed';
    }
  }
  return 'Request failed';
}

export function useForms() {
  const { data: session } = useSession();
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FormReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const fetchIdRef = useRef(0);

  const fetchForms = useCallback(async () => {
    const token = (session as any)?.authToken;
    const thisFetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient<Form[]>(`${getApiBaseUrl()}/api/forms/forms`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.success) {
        setError(asErrorMessage(res.error));
        if (thisFetchId === fetchIdRef.current) setIsLoading(false);
        return;
      }
      if (thisFetchId === fetchIdRef.current) {
        setForms(res.data);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (thisFetchId === fetchIdRef.current) {
        setError(asErrorMessage(err));
        setIsLoading(false);
      }
    }
  }, [session]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const createForm = async (form: CreateFormInput) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<{ id?: string; formId?: string } & Partial<Form>>(`${getApiBaseUrl()}/api/forms/forms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    const id = res.data.id ?? res.data.formId;
    await fetchForms();
    return {
      success: true as const,
      data: { ...(res.data as Form), id: id ?? res.data.id ?? '' },
    };
  };

  const updateForm = async (id: string, form: UpdateFormInput) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<Form>(`${getApiBaseUrl()}/api/forms/forms/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    await fetchForms();
    return { success: true as const };
  };

  const deleteForm = async (id: string) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<void>(`${getApiBaseUrl()}/api/forms/forms/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    await fetchForms();
    return { success: true as const };
  };

  const publishForm = async (id: string) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<void>(`${getApiBaseUrl()}/api/forms/forms/${id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    await fetchForms();
    return { success: true as const };
  };

  const unpublishForm = async (id: string) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<void>(`${getApiBaseUrl()}/api/forms/forms/${id}/unpublish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    await fetchForms();
    return { success: true as const };
  };

  const fetchFormWithQuestions = useCallback(async (formId: string) => {
    const token = (session as any)?.authToken;
    try {
      const res = await apiClient<Form>(`${getApiBaseUrl()}/api/forms/forms/${formId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.success) {
        return { success: false as const, error: asErrorMessage(res.error) };
      }
      return { success: true as const, data: res.data };
    } catch (err: any) {
      return { success: false as const, error: err.message };
    }
  }, [session]);

  const createFormQuestion = async (formId: string, question: CreateFormQuestionInput) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<FormQuestion>(`${getApiBaseUrl()}/api/forms/forms/${formId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(question),
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    return { success: true as const, data: res.data };
  };

  const updateFormQuestion = async (formId: string, questionId: string, question: UpdateFormQuestionInput) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<FormQuestion>(`${getApiBaseUrl()}/api/forms/forms/${formId}/questions/${questionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(question),
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    return { success: true as const, data: res.data };
  };

  const deleteFormQuestion = async (formId: string, questionId: string) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<void>(`${getApiBaseUrl()}/api/forms/forms/${formId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    return { success: true as const };
  };

  const reorderFormQuestions = async (formId: string, questionIds: string[]) => {
    const token = (session as any)?.authToken;
    const res = await apiClient<void>(`${getApiBaseUrl()}/api/forms/forms/${formId}/questions/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ questionIds }),
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    return { success: true as const };
  };

  const fetchPublicForm = useCallback(async (formId: string) => {
    const res = await apiClient<{ form: Form; questions: FormQuestion[] }>(`${getApiBaseUrl()}/api/forms/forms/public/${formId}`);
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    return { success: true as const, data: res.data };
  }, []);

  const submitForm = useCallback(async (
    formId: string,
    answers: Record<string, unknown>,
    contact?: { name: string; email: string; phone?: string },
    privacyAccepted = true,
  ) => {
    const payload = {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      contactName: contact?.name ?? null,
      contactEmail: contact?.email ?? null,
      privacyAccepted,
    };
    const res = await apiClient<FormSubmission>(`${getApiBaseUrl()}/api/forms/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.success) {
      return { success: false as const, error: asErrorMessage(res.error) };
    }
    return { success: true as const, data: res.data };
  }, []);

  const fetchReport = useCallback(async (formId: string) => {
    const token = (session as any)?.authToken;
    setReportLoading(true);
    try {
      const res = await apiClient<FormReport>(`${getApiBaseUrl()}/api/forms/forms/${formId}/report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.success) {
        setError(asErrorMessage(res.error));
        return;
      }
      setReport(res.data);
    } catch (err: any) {
      setError(asErrorMessage(err));
    } finally {
      setReportLoading(false);
    }
  }, [session]);

  return {
    forms,
    isLoading,
    error,
    report,
    reportLoading,
    createForm,
    updateForm,
    deleteForm,
    publishForm,
    unpublishForm,
    fetchForms,
    fetchReport,
    fetchFormWithQuestions,
    fetchPublicForm,
    submitForm,
    createFormQuestion,
    updateFormQuestion,
    deleteFormQuestion,
    reorderFormQuestions,
  };
}