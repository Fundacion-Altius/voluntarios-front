'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useForms, type Form, type FormQuestion } from '@/app/[locale]/admin/formularios/useForms';
import {
  FormAlerts,
  FormEditorTabsList,
  FormGeneralInfoCard,
  FormPreviewCard,
  FormQuestionsCard,
  FormStatusBadge,
  type GeneralInfoField,
} from '@/app/[locale]/admin/formularios/FormEditorPanels';
import { saveExistingForm, type SaveMode } from '@/app/[locale]/admin/formularios/formPersist';
import { Loader2, Save, Trash2, ArrowLeft } from 'lucide-react';

const SUCCESS_MESSAGE_KEYS: Record<SaveMode, 'formularioActualizado' | 'formularioPublicado' | 'formularioDespublicado'> = {
  save: 'formularioActualizado',
  publish: 'formularioPublicado',
  unpublish: 'formularioDespublicado',
};

function SaveButtonContent({ isSaving }: { isSaving: boolean }) {
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  if (isSaving) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {tCommon('guardando')}
      </>
    );
  }
  return (
    <>
      <Save className="mr-2 h-4 w-4" />
      {t('guardarCambios') || 'Guardar cambios'}
    </>
  );
}

function PublishToggleButton({
  isPublished,
  isSaving,
  hasTitle,
  onSave,
}: {
  isPublished: boolean;
  isSaving: boolean;
  hasTitle: boolean;
  onSave: (publish?: boolean, unpublish?: boolean) => void;
}) {
  const t = useTranslations('admin.formularios');
  if (isPublished) {
    return (
      <Button
        variant="outline"
        onClick={() => onSave(false, true)}
        disabled={isSaving}
        className="border-yellow-500/50 text-yellow-700 hover:bg-yellow-500/10"
      >
        {t('despublicarFormulario') || 'Despublicar'}
      </Button>
    );
  }
  return (
    <Button
      onClick={() => onSave(true)}
      disabled={isSaving || !hasTitle}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {t('publicarFormulario') || 'Publicar'}
    </Button>
  );
}

function EditFormFooter({
  isSaving,
  isPublished,
  hasTitle,
  onDelete,
  onCancel,
  onSave,
}: {
  isSaving: boolean;
  isPublished: boolean;
  hasTitle: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onSave: (publish?: boolean, unpublish?: boolean) => void;
}) {
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 md:p-6">
      <div className="container mx-auto flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDelete} disabled={isSaving} className="text-destructive border-destructive/50 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('eliminarFormulario')}
          </Button>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            {tCommon('cancelar')}
          </Button>
          <Button onClick={() => onSave(false)} disabled={isSaving || !hasTitle}>
            <SaveButtonContent isSaving={isSaving} />
          </Button>
          <PublishToggleButton isPublished={isPublished} isSaving={isSaving} hasTitle={hasTitle} onSave={onSave} />
        </div>
      </div>
    </div>
  );
}

export default function EditarFormularioPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  const tAdmin = useTranslations('admin');

  const {
    fetchFormWithQuestions,
    updateForm,
    updateFormQuestion,
    deleteFormQuestion,
    reorderFormQuestions,
    publishForm,
    unpublishForm,
  } = useForms();

  const [formData, setFormData] = useState<Partial<Form> & { status?: string }>({
    title: '',
    description: '',
    requiresContact: false,
    status: 'draft',
  });
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'builder' | 'preview');
  }, []);

  const loadForm = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchFormWithQuestions(formId);
      if (!result.success) {
        setError(result.error || tCommon('errorCargarDatos'));
        return;
      }
      const form = result.data!;
      setFormData({
        title: form.title,
        description: form.description || '',
        requiresContact: form.requiresContact,
        status: form.status,
      });
      setQuestions(form.questions || []);
    } catch (err: any) {
      setError(err.message || tCommon('errorCargarDatos'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFormWithQuestions, formId, tCommon]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleSaveForm = async (publish = false, unpublish = false) => {
    setError(null);
    setIsSaving(true);

    try {
      const mode: SaveMode = unpublish ? 'unpublish' : publish ? 'publish' : 'save';
      const failure = await saveExistingForm(
        { updateForm, updateFormQuestion, reorderFormQuestions, publishForm, unpublishForm },
        formId,
        {
          title: formData.title as string,
          description: formData.description as string | null,
          requiresContact: formData.requiresContact as boolean,
        },
        questions,
        mode,
        tCommon('error'),
      );
      if (failure) {
        setError(failure);
        return;
      }

      setSuccessMsg(t(SUCCESS_MESSAGE_KEYS[mode]));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || tCommon('error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm(tCommon('confirmDelete'))) return;
    setError(null);
    try {
      const result = await deleteFormQuestion(formId, questionId);
      if (!result.success) {
        setError(result.error || tCommon('error'));
        return;
      }
      setQuestions(prev => prev.filter(q => q.id !== questionId).map((q, index) => ({ ...q, order: index })));
    } catch (err: any) {
      setError(err.message || tCommon('error'));
    }
  };

  const handleQuestionsChange = useCallback((newQuestions: FormQuestion[]) => {
    setQuestions(newQuestions);
  }, []);

  const handleFormDataChange = (field: GeneralInfoField, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteForm = async () => {
    if (!window.confirm(t('confirmarEliminacionDescripcion')?.replace('{titulo}', formData.title as string) || tCommon('confirmDelete'))) return;
    // We'd need to add deleteForm to useForms hook
    router.push('/admin/formularios');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPublished = formData.status === 'published';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('editarFormulario')}</h1>
            <p className="text-muted-foreground">{t('editarFormularioDesc') || 'Modifica el formulario y sus preguntas'}</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('volver')}
          </Button>
        </div>

        <FormAlerts successMsg={successMsg} error={error} />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <FormEditorTabsList />

          <TabsContent value="builder" className="space-y-6">
            <FormGeneralInfoCard
              values={{
                title: formData.title as string,
                description: formData.description as string,
                requiresContact: formData.requiresContact as boolean,
                status: formData.status as string,
              }}
              onFieldChange={handleFormDataChange}
              disabled={isSaving}
              statusBadge={<FormStatusBadge status={formData.status} />}
            />
            <FormQuestionsCard questions={questions} onChange={handleQuestionsChange} />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <FormPreviewCard
              title={formData.title as string}
              description={formData.description}
              requiresContact={formData.requiresContact as boolean}
              questions={questions}
              emptyMessage={t('sinPreguntasPreview') || 'No hay preguntas para previsualizar'}
            />
          </TabsContent>
        </Tabs>

        <EditFormFooter
          isSaving={isSaving}
          isPublished={isPublished}
          hasTitle={!!formData.title}
          onDelete={handleDeleteForm}
          onCancel={() => router.back()}
          onSave={handleSaveForm}
        />
      </div>
    </div>
  );
}