'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import type { Survey } from './useSurveys';

interface SurveyTableProps {
  surveys: Survey[];
  isLoading: boolean;
  deleteTarget: Survey | null;
  setDeleteTarget: (s: Survey | null) => void;
  onDelete: () => Promise<void>;
  t: any;
  tCommon: any;
}

export function SurveyTable({
  surveys,
  isLoading,
  deleteTarget,
  setDeleteTarget,
  onDelete,
  t,
  tCommon,
}: SurveyTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('nombre')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('departamento')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('duracion')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('creado')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{tCommon('acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b">
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="rounded-md border">
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                {t('sinEncuestas')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('nombre')}</th>
            <th className="px-4 py-3 text-left text-sm font-medium">{t('departamento')}</th>
            <th className="px-4 py-3 text-left text-sm font-medium">{t('duracion')}</th>
            <th className="px-4 py-3 text-left text-sm font-medium">{t('creado')}</th>
            <th className="px-4 py-3 text-right text-sm font-medium">{tCommon('acciones')}</th>
          </tr>
        </thead>
        <tbody>
          {surveys.map((s) => (
            <tr key={s.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3 text-sm">{s.nombre}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{s.departamento}</td>
              <td className="px-4 py-3 text-sm">
                <Badge variant="outline">{s.minutos} min</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(s.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <AlertDialog
                  open={deleteTarget?.id === s.id}
                  onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(s)}
                    >
                      {tCommon('eliminar')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('eliminarEncuesta')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('eliminarEncuestaDesc')}{' '}
                        <strong>{deleteTarget?.nombre}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tCommon('cancelar')}</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>
                        {tCommon('eliminar')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}