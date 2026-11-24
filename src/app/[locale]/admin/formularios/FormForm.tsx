'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CreateFormInput, UpdateFormInput, Form } from './useForms';

interface FormFormProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  editingForm: Form | null;
  setEditingForm: (form: Form | null) => void;
  onSubmit: (form: CreateFormInput | UpdateFormInput) => Promise<{ success: boolean; error?: string }>;
  formError: string;
  setFormError: (error: string) => void;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}

export function FormForm({
  createOpen,
  setCreateOpen,
  editingForm,
  setEditingForm,
  onSubmit,
  formError,
  setFormError,
  setSuccessMsg,
  t,
  tCommon,
}: FormFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiresContact, setRequiresContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingForm;

  useEffect(() => {
    if (editingForm) {
      setTitle(editingForm.title);
      setDescription(editingForm.description || '');
      setRequiresContact(editingForm.requiresContact);
    } else if (!createOpen) {
      setTitle('');
      setDescription('');
      setRequiresContact(false);
    }
  }, [editingForm, createOpen]);

  const handleOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setEditingForm(null);
      setFormError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    const formData = { title, description, requiresContact };
    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMsg(isEditing ? t('formularioActualizado') : t('formularioCreado'));
      setTimeout(() => setSuccessMsg(''), 3000);
      setCreateOpen(false);
      setEditingForm(null);
      setTitle('');
      setDescription('');
      setRequiresContact(false);
    } else {
      setFormError(result.error || tCommon('error'));
    }
  };

  return (
    <Dialog open={createOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{t('nuevoFormulario')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editarFormulario') : t('nuevoFormulario')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('editarFormularioDesc') : t('nuevoFormularioDescripcion')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div>
            <Label htmlFor="title" className="mb-1 block text-sm font-medium">
              {t('nombre')} *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('tituloPlaceholder')}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="description" className="mb-1 block text-sm font-medium">
              {t('descripcion')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descripcionPlaceholder')}
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresContact"
              checked={requiresContact}
              onChange={(e) => setRequiresContact(e.target.checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="requiresContact" className="cursor-pointer text-sm">
              {t('requiereContacto')}
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancelar')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting
                ? tCommon('guardando')
                : isEditing
                  ? tCommon('actualizar')
                  : tCommon('crear')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
