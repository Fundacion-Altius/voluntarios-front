'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useForms, type Form } from './useForms';
import { FormTable } from './FormTable';
import { ReportView } from './ReportView';

export default function FormulariosPage() {
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    forms,
    isLoading,
    error,
    report,
    reportLoading,
    deleteForm,
    publishForm,
    unpublishForm,
    fetchReport,
  } = useForms();

  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteForm(deleteTarget.id);
      if (!result.success) {
        setFormError(result.error || tCommon('error'));
        return;
      }
      setDeleteTarget(null);
      setSuccessMsg(t('formularioEliminado'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handlePublish = async (form: Form) => {
    try {
      const result = form.status === 'published'
        ? await unpublishForm(form.id)
        : await publishForm(form.id);
      if (!result.success) {
        setFormError(result.error || tCommon('error'));
        return;
      }
      setSuccessMsg(form.status === 'published' ? t('formularioDespublicado') : t('formularioPublicado'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleViewReport = (form: Form) => {
    setShowReport(true);
    fetchReport(form.id);
  };

  const handleEdit = (form: Form) => {
    router.push(`/admin/formularios/${form.id}/editar`);
  };

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <Button onClick={() => router.push('/admin/formularios/nuevo')}>
          {t('nuevoFormulario')}
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {(error || formError) && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error || formError}
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
        <FormTable
          forms={forms}
          isLoading={isLoading}
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onViewReport={handleViewReport}
          onPublish={handlePublish}
          t={t}
          tCommon={tCommon}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmarEliminacion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmarEliminacionDescripcion', { titulo: deleteTarget?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancelar')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{tCommon('eliminar')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
