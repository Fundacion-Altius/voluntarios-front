'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useForms, type FormQuestion, type CreateFormInput } from '@/app/[locale]/admin/formularios/useForms';
import {
  FormAlerts,
  FormEditorTabsList,
  FormGeneralInfoCard,
  FormPreviewCard,
  FormQuestionsCard,
  type GeneralInfoField,
} from '@/app/[locale]/admin/formularios/FormEditorPanels';
import { createFormWithQuestions } from '@/app/[locale]/admin/formularios/formPersist';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export default function NuevoFormularioPage() {
  const router = useRouter();
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  const tAdmin = useTranslations('admin');

  const {
    createForm,
    createFormQuestion,
    updateFormQuestion,
  } = useForms();

  const [formData, setFormData] = useState<CreateFormInput>({
    title: '',
    description: '',
    requiresContact: false,
    status: 'draft',
  });
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'builder' | 'preview');
  }, []);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);

  const handleSaveForm = async (publish = false) => {
    setError(null);
    setIsSaving(true);

    try {
      const formToSave: CreateFormInput = { ...formData, status: publish ? 'published' : 'draft' };
      const failure = await createFormWithQuestions(
        { createForm, createFormQuestion, updateFormQuestion },
        formToSave,
        questions,
        tCommon('error'),
        setSavedFormId,
      );
      if (failure) {
        setError(failure);
        return;
      }

      setSuccessMsg(publish ? t('formularioPublicado') : t('formularioCreado'));
      setTimeout(() => {
        setSuccessMsg(null);
        router.push('/admin/formularios');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || tCommon('error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionsChange = useCallback((newQuestions: FormQuestion[]) => {
    setQuestions(newQuestions);
  }, []);

  const handleFormDataChange = (field: GeneralInfoField, value: any) => {
    setFormData((prev: CreateFormInput) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('nuevoFormulario')}</h1>
            <p className="text-muted-foreground">{t('crearFormularioDesc') || 'Crea un nuevo formulario con preguntas y lógica condicional'}</p>
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
                title: formData.title,
                description: formData.description ?? '',
                requiresContact: formData.requiresContact ?? false,
                status: formData.status ?? 'draft',
              }}
              onFieldChange={handleFormDataChange}
              disabled={isSaving}
            />
            <FormQuestionsCard questions={questions} onChange={handleQuestionsChange} />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <FormPreviewCard
              title={formData.title}
              description={formData.description}
              requiresContact={formData.requiresContact ?? false}
              questions={questions}
              emptyMessage={t('sinPreguntasPreview') || 'Añade preguntas en la pestaña Constructor para ver la previsualización'}
            />
          </TabsContent>
        </Tabs>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 md:p-6">
          <div className="container mx-auto flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>
              {tCommon('cancelar')}
            </Button>
            <Button onClick={() => handleSaveForm(false)} disabled={isSaving || !formData.title.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('guardando')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('guardarCambios') || 'Guardar cambios'}
                </>
              )}
            </Button>
            <Button
              onClick={() => handleSaveForm(true)}
              disabled={isSaving || !formData.title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? tCommon('guardando') : (t('publicarFormulario') || 'Publicar')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}