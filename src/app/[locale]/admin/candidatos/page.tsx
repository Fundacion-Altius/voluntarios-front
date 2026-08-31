'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCandidates, type Candidate } from './useCandidates';

const statusBadge: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  candidate: 'secondary',
  'on-reserve': 'outline',
  active: 'default',
  inactive: 'destructive',
};

function formatDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString();
}

export default function CandidatosPage() {
  const t = useTranslations('admin.candidatos');
  const tCommon = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { candidates, isLoading, error, approveCandidate, reserveCandidate, deactivateUser, bulkImport, refetch } = useCandidates();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [bulkResult, setBulkResult] = useState<{ total: number; successCount: number } | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveCandidate(id); showSuccess(t('candidatoAprobado')); }
    catch { showSuccess(t('errorAprobar')); }
    finally { setActionLoading(null); }
  };

  const handleReserve = async (id: string) => {
    setActionLoading(id);
    try { await reserveCandidate(id); showSuccess(t('candidatoReserva')); }
    catch { showSuccess(t('errorReservar')); }
    finally { setActionLoading(null); }
  };

  const handleDeactivate = async (id: string) => {
    setActionLoading(id);
    try { await deactivateUser(id); showSuccess(t('usuarioDesactivado')); }
    catch { showSuccess(t('errorDesactivar')); }
    finally { setActionLoading(null); }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkResult(null);
    try {
      const result = await bulkImport(file);
      if (result.success && result.data) {
        setBulkResult(result.data);
        showSuccess(`${t('importacionCompletada')}: ${result.data.successCount} ${t('candidatosImportados')}`);
      } else if (!result.success) {
        showSuccess(result.error);
      }
    } catch (err: any) {
      showSuccess(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <div className="flex items-center gap-2">
          <input type="file" accept=".xlsx,.xls" onChange={handleBulkImport} className="hidden" id="bulk-upload" />
          <label htmlFor="bulk-upload">
            <Button variant="outline" size="sm" asChild>
              <span>{t('importarExcel')}</span>
            </Button>
          </label>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">{successMsg}</div>
      )}

      {bulkResult && (
        <div className="mb-4 rounded-md bg-blue-100 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {t('importacionCompletada')}: {bulkResult.successCount} {t('candidatosImportados')}.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('nombre')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('email')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('estado')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('fecha')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{tCommon('acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 5 }).map((_, j) => (<td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>))}
                </tr>
              ))
            ) : candidates.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t('noHayCandidatos')}</td></tr>
            ) : (
              candidates.map((c) => (
                <tr key={c.user_id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{c.display_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3"><Badge variant={statusBadge[c.status] || 'outline'}>{c.status}</Badge></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {c.status === 'candidate' && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(c.user_id)} disabled={actionLoading === c.user_id}>
                            {t('aprobar')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReserve(c.user_id)} disabled={actionLoading === c.user_id}>
                            {t('reserva')}
                          </Button>
                        </>
                      )}
                      {c.status === 'active' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">{t('desactivar')}</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('desactivarVoluntario')}</AlertDialogTitle>
                               <AlertDialogDescription>{t('desactivarVoluntarioDesc')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tCommon('cancelar')}</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeactivate(c.user_id)}>{t('desactivar')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
