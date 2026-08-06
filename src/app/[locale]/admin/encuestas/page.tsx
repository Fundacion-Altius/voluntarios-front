'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiClient, apiUrl } from '@/lib/apiClient';
import { useSurveys, type Survey } from './useSurveys';
import { SurveyForm } from './SurveyForm';
import { SurveyTable } from './SurveyTable';
import { ReportView } from './ReportView';

export default function EncuestasPage() {
  const t = useTranslations('admin.encuestas');
  const tCommon = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    surveys,
    isLoading,
    error,
    report,
    reportLoading,
    createSurvey,
    deleteSurvey,
    fetchReport,
  } = useSurveys();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSurvey(deleteTarget.id);
      setDeleteTarget(null);
      setSuccessMsg(t('encuestaEliminada'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setShowReport(true); fetchReport(); }}>
            {t('verResultados')}
          </Button>
          <SurveyForm
            createOpen={createOpen}
            setCreateOpen={setCreateOpen}
            onSubmit={async (nombre, departamento, minutos) => {
              await createSurvey({ nombre, departamento, minutos });
            }}
            formError={formError}
            setFormError={setFormError}
            successMsg={successMsg}
            setSuccessMsg={setSuccessMsg}
            t={t}
            tCommon={tCommon}
          />
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showReport ? (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowReport(false)}>
              ← {t('volverLista')}
            </Button>
            <h3 className="text-lg font-semibold">{t('resultados')}</h3>
          </div>
          <ReportView report={report} reportLoading={reportLoading} onBack={() => setShowReport(false)} t={t} />
        </div>
      ) : (
        <SurveyTable
          surveys={surveys}
          isLoading={isLoading}
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          onDelete={handleDelete}
          t={t}
          tCommon={tCommon}
        />
      )}
    </div>
  );
}