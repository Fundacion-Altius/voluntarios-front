'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Survey } from './useSurveys';

interface SurveyFormProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  onSubmit: (nombre: string, departamento: string, minutos: number) => Promise<void>;
  formError: string;
  setFormError: (msg: string) => void;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
  t: any;
  tCommon: any;
}

export function SurveyForm({
  createOpen,
  setCreateOpen,
  onSubmit,
  formError,
  setFormError,
  successMsg,
  setSuccessMsg,
  t,
  tCommon,
}: SurveyFormProps) {
  const [newNombre, setNewNombre] = useState('');
  const [newDepartamento, setNewDepartamento] = useState('');
  const [newMinutos, setNewMinutos] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await onSubmit(newNombre, newDepartamento, Number(newMinutos));
      setNewNombre('');
      setNewDepartamento('');
      setNewMinutos('');
      setCreateOpen(false);
      showSuccess(t('encuestaCreada'));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <Button>{t('nuevaEncuesta')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('nuevaEncuesta')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">{tCommon('nombre')}</label>
            <Input
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder={t('nombrePlaceholder')}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('departamento')}</label>
            <Input
              value={newDepartamento}
              onChange={(e) => setNewDepartamento(e.target.value)}
              placeholder={t('departamento')}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('duracion')}</label>
            <Input
              type="number"
              value={newMinutos}
              onChange={(e) => setNewMinutos(e.target.value)}
              placeholder="10"
              required
              min={1}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('creando') : t('crearEncuesta')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}