'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionBuilder } from '@/app/[locale]/admin/formularios/QuestionBuilder';
import type { FormQuestion } from '@/app/[locale]/admin/formularios/useForms';
import { StarRating } from '@/components/ratings/star-rating';
import { AlertCircle, CheckCircle, Eye, Settings, Star } from 'lucide-react';

type TranslateFn = ReturnType<typeof useTranslations>;

export function FormAlerts({ successMsg, error }: { successMsg: string | null; error: string | null }) {
  if (!successMsg && !error) return null;
  return (
    <div className="mb-6">
      {successMsg && (
        <Alert className="border-green-500/50 bg-green-500/5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function FormEditorTabsList() {
  const t = useTranslations('admin.formularios');
  return (
    <TabsList className="grid w-full max-w-2xl grid-cols-2">
      <TabsTrigger value="builder">
        <Settings className="h-4 w-4 mr-2" />
        {t('modoEdicion') || 'Constructor'}
      </TabsTrigger>
      <TabsTrigger value="preview">
        <Eye className="h-4 w-4 mr-2" />
        {t('modoPrevisualizacion') || 'Previsualización'}
      </TabsTrigger>
    </TabsList>
  );
}

export interface GeneralInfoValues {
  title: string;
  description: string;
  requiresContact: boolean;
  status: string;
}

export type GeneralInfoField = keyof GeneralInfoValues;

export function FormGeneralInfoCard({
  values,
  onFieldChange,
  disabled,
  statusBadge,
}: {
  values: GeneralInfoValues;
  onFieldChange: (field: GeneralInfoField, value: any) => void;
  disabled: boolean;
  statusBadge?: ReactNode;
}) {
  const t = useTranslations('admin.formularios');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('informacionGeneral') || 'Información general'}</CardTitle>
        <CardDescription>{t('informacionGeneralDesc') || 'Configura los datos básicos del formulario'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="block text-sm font-medium mb-1">
            {t('nombre')} *
          </Label>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            placeholder={t('tituloPlaceholder')}
            required
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="description" className="block text-sm font-medium mb-1">
            {t('descripcion')}
          </Label>
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder={t('descripcionPlaceholder')}
            rows={3}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="requiresContact"
              checked={values.requiresContact}
              onCheckedChange={(checked) => onFieldChange('requiresContact', checked)}
              disabled={disabled}
            />
            <Label htmlFor="requiresContact" className="text-sm cursor-pointer">
              {t('requiereContacto')}
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Label className="text-sm font-medium">{t('estado') || 'Estado'}</Label>
          <Select value={values.status} onValueChange={(value) => onFieldChange('status', value)} disabled={disabled}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t('formularioBorrador') || 'Borrador'}</SelectItem>
              <SelectItem value="published">{t('formularioPublicadoEstado') || 'Publicado'}</SelectItem>
              <SelectItem value="archived">{t('formularioArchivado') || 'Archivado'}</SelectItem>
            </SelectContent>
          </Select>
          {statusBadge}
        </div>
      </CardContent>
    </Card>
  );
}

export function FormStatusBadge({ status }: { status?: string }) {
  const t = useTranslations('admin.formularios');
  const isPublished = status === 'published';
  const isArchived = status === 'archived';
  let colorClass = 'bg-yellow-100 text-yellow-800';
  let label = t('formularioBorrador');
  if (isPublished) {
    colorClass = 'bg-green-100 text-green-800';
    label = t('formularioPublicadoEstado');
  } else if (isArchived) {
    colorClass = 'bg-gray-100 text-gray-800';
    label = t('formularioArchivado');
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

export function FormQuestionsCard({
  questions,
  onChange,
}: {
  questions: FormQuestion[];
  onChange: (questions: FormQuestion[]) => void;
}) {
  const t = useTranslations('admin.formularios');
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('preguntas') || 'Preguntas'}</CardTitle>
          <CardDescription>{t('preguntasDesc') || 'Arrastra para reordenar. Haz clic en cada pregunta para configurar lógica condicional.'}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <QuestionBuilder questions={questions} onChange={onChange} isPreview={false} />
      </CardContent>
    </Card>
  );
}

function PreviewOptionList({ question, inputType }: { question: FormQuestion; inputType: 'radio' | 'checkbox' }) {
  if (!question.options) return null;
  return (
    <div className="space-y-2">
      {question.options.map((opt, i) => (
        <label key={i} className="flex items-center gap-2 cursor-pointer">
          <input
            type={inputType}
            {...(inputType === 'radio' ? { name: `preview-${question.id}` } : {})}
            disabled
          />
          <span className="text-sm">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function PreviewYesNo({ question, t }: { question: FormQuestion; t: TranslateFn }) {
  return (
    <div className="flex gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={`preview-${question.id}`} disabled />
        <span>{t('si') || 'Sí'}</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={`preview-${question.id}`} disabled />
        <span>{t('no') || 'No'}</span>
      </label>
    </div>
  );
}

function PreviewQuestionInput({ question, tCommon }: { question: FormQuestion; tCommon: TranslateFn }) {
  switch (question.type) {
    case 'textoCorto':
      return <Input placeholder="Respuesta corta..." disabled />;
    case 'textoLargo':
      return <Textarea placeholder="Respuesta larga..." rows={3} disabled />;
    case 'opcionUnica':
      return <PreviewOptionList question={question} inputType="radio" />;
    case 'opcionMultiple':
      return <PreviewOptionList question={question} inputType="checkbox" />;
    case 'estrellas':
      return <StarRating value={0} onChange={() => {}} maxRating={5} size="w-6 h-6" readOnly />;
    case 'siNo':
      return <PreviewYesNo question={question} t={tCommon} />;
    case 'numero':
      return <Input type="number" placeholder="Número..." disabled />;
    case 'fecha':
      return <Input type="date" disabled />;
    default:
      return null;
  }
}

function PreviewQuestionItem({
  question,
  index,
  t,
  tCommon,
}: {
  question: FormQuestion;
  index: number;
  t: TranslateFn;
  tCommon: TranslateFn;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {index + 1}. {question.text} {question.type !== 'siNo' && <span className="text-muted-foreground">*</span>}
      </label>
      <PreviewQuestionInput question={question} tCommon={tCommon} />
      {question.dejaFuera && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {t('dejaFueraPreview') || 'Esta pregunta puede terminar el formulario'}
        </div>
      )}
      {question.recomienda && (
        <div className="text-xs text-warning flex items-center gap-1">
          <Star className="h-3 w-3" />
          {t('recomiendaPreview') || 'Esta pregunta puede mostrar una recomendación'}
        </div>
      )}
    </div>
  );
}

function PreviewContactSection({ t, tCommon }: { t: TranslateFn; tCommon: TranslateFn }) {
  return (
    <div className="border-t pt-6 space-y-4">
      <h3 className="text-lg font-medium">{t('datosContacto') || 'Datos de contacto'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="block text-sm font-medium mb-1">{tCommon('nombre') || 'Nombre'} *</Label>
          <Input placeholder="Tu nombre" disabled />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">{tCommon('email') || 'Email'} *</Label>
          <Input type="email" placeholder="tu@email.com" disabled />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="privacy" disabled />
        <Label htmlFor="privacy" className="text-sm text-muted-foreground mt-1">
          {t('aceptoPrivacidad') || 'Acepto la política de privacidad'} *
        </Label>
      </div>
    </div>
  );
}

export function FormPreviewCard({
  title,
  description,
  requiresContact,
  questions,
  emptyMessage,
}: {
  title: string;
  description: string | null | undefined;
  requiresContact: boolean;
  questions: FormQuestion[];
  emptyMessage: string;
}) {
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('previsualizacion') || 'Previsualización'}</CardTitle>
        <CardDescription>{t('previsualizacionDesc') || 'Así se verá el formulario para los usuarios'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-2xl mx-auto p-6 border rounded-lg bg-card">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold mb-2">{title || t('tituloPlaceholder')}</h2>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {questions.map((q, index) => (
                <PreviewQuestionItem key={q.id} question={q} index={index} t={t} tCommon={tCommon} />
              ))}
              {requiresContact && <PreviewContactSection t={t} tCommon={tCommon} />}
              <Button type="submit" className="w-full" disabled>
                {t('enviar') || 'Enviar'}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
