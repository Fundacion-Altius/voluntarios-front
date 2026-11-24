'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { StarRating } from '@/components/ratings/star-rating';
import { useForms, type FormSubmission } from '@/app/[locale]/admin/formularios/useForms';

/** Same tenant branding path as `/encuesta` and contracts (NEXT_PUBLIC_IMAGE_PREFIX + logo.png). */
const TENANT_LOGO_SRC = `${(process.env.NEXT_PUBLIC_IMAGE_PREFIX || '/').replace(/\/$/, '')}/logo.png`;

function TenantLogoHeader() {
  return (
    <div className="mb-6 flex w-full justify-center">
      <Image
        alt="logo"
        src={TENANT_LOGO_SRC}
        width={280}
        height={70}
        className="logo h-auto w-auto max-h-16 object-contain"
        priority
      />
    </div>
  );
}

type FormQuestion = {
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
};

type Form = {
  id: string;
  title: string;
  description: string | null;
  requiresContact: boolean;
  status: 'draft' | 'published' | 'archived';
};

type RenderPayload = {
  id: string;
  text: string;
  type: FormQuestion['type'];
  isRequired: boolean;
  placeholder: string;
  options: string[];
  min?: number | string;
  max?: number | string;
  answer: any;
  isSubmitting: boolean;
  onChange: (questionId: string, value: any) => void;
  t?: ReturnType<typeof useTranslations>;
};

function TextInput({ id, text, isRequired, placeholder, answer, onChange, isSubmitting }: RenderPayload) {
  return (
    <div key={id} className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        value={answer || ''}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
      />
    </div>
  );
}

function LongTextInput({ id, text, isRequired, placeholder, answer, onChange, isSubmitting }: RenderPayload) {
  return (
    <div key={id} className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={id}
        value={answer || ''}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={isSubmitting}
      />
    </div>
  );
}

function NumberInput({ id, text, isRequired, placeholder, min, max, answer, onChange, isSubmitting }: RenderPayload) {
  return (
    <div key={id} className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type="number"
        value={answer || ''}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        min={min as number | undefined}
        max={max as number | undefined}
      />
    </div>
  );
}

function YesNoInput({ id, text, isRequired, answer, onChange, isSubmitting, t }: RenderPayload) {
  return (
    <div key={id} className="space-y-2">
      <Label className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={answer || ''}
        onValueChange={(value) => onChange(id, value)}
        disabled={isSubmitting}
      >
        <div className="flex items-center space-x-2 py-1">
          <RadioGroupItem value="si" id={`${id}-si`} />
          <Label htmlFor={`${id}-si`} className="text-sm cursor-pointer">
            {t?.('si') ?? 'Sí'}
          </Label>
        </div>
        <div className="flex items-center space-x-2 py-1">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="text-sm cursor-pointer">
            {t?.('no') ?? 'No'}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

function SingleChoiceInput({ id, text, isRequired, options, answer, onChange, isSubmitting }: RenderPayload) {
  return (
    <div key={id} className="space-y-2">
      <Label className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={answer || ''}
        onValueChange={(value) => onChange(id, value)}
        disabled={isSubmitting}
      >
        {options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center space-x-2 py-1">
            <RadioGroupItem value={opt} id={`${id}-${i}`} />
            <Label htmlFor={`${id}-${i}`} className="text-sm cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function MultiChoiceInput({ id, text, isRequired, options, answer, onChange, isSubmitting }: RenderPayload) {
  const current = Array.isArray(answer) ? answer : [];
  return (
    <div key={id} className="space-y-2">
      <Label className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <div className="space-y-1">
        {options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-${i}`}
              checked={current.includes(opt)}
              onCheckedChange={(checked) => {
                onChange(
                  id,
                  checked ? [...current, opt] : current.filter((o) => o !== opt)
                );
              }}
              disabled={isSubmitting}
            />
            <Label htmlFor={`${id}-${i}`} className="text-sm cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarsInput({ id, text, isRequired, answer, onChange, isSubmitting, max }: RenderPayload) {
  const maxRating = typeof max === 'number' && max > 0 ? max : 5;
  return (
    <div key={id} className="space-y-2">
      <Label className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <StarRating
        aria-label={text}
        value={typeof answer === 'number' ? answer : 0}
        onChange={(rating) => onChange(id, rating)}
        maxRating={maxRating}
        size="w-8 h-8"
        readOnly={isSubmitting}
      />
    </div>
  );
}

function DateInput({ id, text, isRequired, min, max, answer, onChange, isSubmitting }: RenderPayload) {
  return (
    <div key={id} className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {text} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type="date"
        value={answer || ''}
        onChange={(e) => onChange(id, e.target.value)}
        disabled={isSubmitting}
        min={min as string | undefined}
        max={max as string | undefined}
      />
    </div>
  );
}

function buildPayload(q: FormQuestion, answer: any, isSubmitting: boolean, onChange: (questionId: string, value: any) => void, t?: ReturnType<typeof useTranslations>): RenderPayload {
  const validation = q.validation || {};
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    isRequired: !!validation.required,
    placeholder: (validation.placeholder as string) || '',
    options: q.options || [],
    min: validation.min as number | string | undefined,
    max: validation.max as number | string | undefined,
    answer,
    isSubmitting,
    onChange,
    t,
  };
}

function QuestionRenderer({ question, answer, isSubmitting, onChange, t }: { question: FormQuestion; answer: any; isSubmitting: boolean; onChange: (questionId: string, value: any) => void; t: ReturnType<typeof useTranslations> }) {
  const payload = buildPayload(question, answer, isSubmitting, onChange, t);
  
  switch (question.type) {
    case 'textoCorto':
      return <TextInput {...payload} />;
    case 'textoLargo':
      return <LongTextInput {...payload} />;
    case 'numero':
      return <NumberInput {...payload} />;
    case 'siNo':
      return <YesNoInput {...payload} />;
    case 'opcionUnica':
      return <SingleChoiceInput {...payload} />;
    case 'opcionMultiple':
      return <MultiChoiceInput {...payload} />;
    case 'estrellas':
      return <StarsInput {...payload} />;
    case 'fecha':
      return <DateInput {...payload} />;
    default:
      return null;
  }
}

type TranslateFn = ReturnType<typeof useTranslations>;
type AnswerMap = Record<string, any>;
type ContactData = { name: string; email: string; phone: string };
type PublicFormData = { form: Form; questions: FormQuestion[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUESTIONS_PER_STEP = 5;

function compareCondition(operator: string, answerStr: string, valueStr: string): boolean {
  switch (operator) {
    case 'equals':
      return answerStr === valueStr;
    case 'notEquals':
      return answerStr !== valueStr;
    case 'contains':
      return answerStr.includes(valueStr);
    case 'notContains':
      return !answerStr.includes(valueStr);
    case 'greaterThan':
      return Number(answerStr) > Number(valueStr);
    case 'lessThan':
      return Number(answerStr) < Number(valueStr);
    default:
      return true;
  }
}

function evaluateVisibility(question: FormQuestion, currentAnswers: AnswerMap): boolean {
  const logic = question.conditionalLogic;
  if (!logic || logic.type !== 'show_hide') return true;

  const { condition } = logic;
  const answerValue = currentAnswers[condition.sourceQuestionId];
  if (answerValue === undefined || answerValue === null || answerValue === '') {
    return false;
  }
  return compareCondition(condition.operator, String(answerValue), String(condition.value));
}

function isRequiredAndMissing(question: FormQuestion, answers: AnswerMap): boolean {
  return Boolean(question.validation?.required) && (!answers[question.id] || answers[question.id] === '');
}

function answerMatches(answers: AnswerMap, questionId: string, expected: string | null): boolean {
  return expected != null && answers[questionId] !== undefined && String(answers[questionId]) === String(expected);
}

function isBlockedByDejaFuera(questions: FormQuestion[], answers: AnswerMap): boolean {
  return questions.some((q) => q.dejaFuera && answerMatches(answers, q.id, q.dejaFueraValue));
}

function getActiveRecommendations(questions: FormQuestion[], answers: AnswerMap): string[] {
  return questions
    .filter((q) => q.recomienda && answerMatches(answers, q.id, q.recomiendaValue) && q.recomiendaMessage)
    .map((q) => q.recomiendaMessage as string);
}

function validateContact(contact: ContactData, t: TranslateFn): string | null {
  if (!contact.name || !contact.email) return t('completarDatosContacto');
  if (!EMAIL_PATTERN.test(contact.email)) return t('emailInvalido');
  return null;
}

function validateSubmission(args: {
  blockedByDejaFuera: boolean;
  visibleQuestions: FormQuestion[];
  answers: AnswerMap;
  showContact: boolean;
  contact: ContactData;
  t: TranslateFn;
}): string | null {
  const { blockedByDejaFuera, visibleQuestions, answers, showContact, contact, t } = args;

  // dejaFuera still submits: backend marks status=rechazado (spec).
  if (!blockedByDejaFuera && visibleQuestions.some((q) => isRequiredAndMissing(q, answers))) {
    return t('completarCamposRequeridos');
  }
  return showContact ? validateContact(contact, t) : null;
}

function humanMotivoRechazo(
  motivoRechazo: string | null | undefined,
  questions: FormQuestion[],
  answers: AnswerMap,
): string | undefined {
  if (!motivoRechazo) return undefined;
  // Backend stores preguntaId (uuid) for admin/reporting — never show that to the respondent.
  const question = questions.find((q) => q.id === motivoRechazo);
  if (!question) return undefined;
  const raw = answers[question.id];
  const answerLabel =
    raw === 'si' || raw === true
      ? 'Sí'
      : raw === 'no' || raw === false
        ? 'No'
        : raw != null && raw !== ''
          ? String(raw)
          : null;
  if (answerLabel) return `${question.text}: ${answerLabel}`;
  return question.text;
}

function buildConfirmationParams(
  data: FormSubmission | undefined,
  blockedByDejaFuera: boolean,
  recommendation: string | undefined,
  questions: FormQuestion[],
  answers: AnswerMap,
): URLSearchParams {
  const status = data?.status || (blockedByDejaFuera ? 'rechazado' : 'completado');
  const params = new URLSearchParams({ status });
  const motivo = humanMotivoRechazo(data?.motivoRechazo, questions, answers);
  if (motivo) params.set('motivo', motivo);
  if (!blockedByDejaFuera && recommendation) params.set('recomendacion', recommendation);
  return params;
}

async function loadPublicForm(
  fetchPublicForm: ReturnType<typeof useForms>['fetchPublicForm'],
  formId: string,
  t: TranslateFn,
  tCommon: TranslateFn,
): Promise<{ data: PublicFormData; error: null } | { data: null; error: string }> {
  try {
    const result = await fetchPublicForm(formId);
    if (!result.success) {
      return { data: null, error: result.error || t('formularioNoEncontrado') };
    }
    if (!result.data) {
      return { data: null, error: t('formularioNoPublicado') };
    }
    return { data: result.data as PublicFormData, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || tCommon('error') };
  }
}

function StepProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  if (totalSteps <= 1) return null;
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex gap-2" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-16 transition-colors ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{currentStep + 1} / {totalSteps}</span>
    </div>
  );
}

function FormNotices({
  blockedByDejaFuera,
  recommendation,
  t,
}: {
  blockedByDejaFuera: boolean;
  recommendation: string | undefined;
  t: TranslateFn;
}) {
  return (
    <>
      {blockedByDejaFuera && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('dejaFueraAviso')}</AlertDescription>
        </Alert>
      )}

      {recommendation && !blockedByDejaFuera && (
        <Alert className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{recommendation}</AlertDescription>
        </Alert>
      )}
    </>
  );
}

function ContactSection({
  contact,
  onChange,
  disabled,
  t,
}: {
  contact: ContactData;
  onChange: (field: keyof ContactData, value: string) => void;
  disabled: boolean;
  t: TranslateFn;
}) {
  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="text-lg font-semibold mb-4">{t('datosContacto')}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName" className="text-sm font-medium">
            {t('nombre')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contactName"
            value={contact.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={t('tuNombre')}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="text-sm font-medium">
            {t('email')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contactEmail"
            type="email"
            value={contact.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder={t('tuEmail')}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="contactPhone" className="text-sm font-medium">
            {t('telefono')}
          </Label>
          <Input
            id="contactPhone"
            value={contact.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder={t('tuTelefono')}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ isSubmitting, t }: { isSubmitting: boolean; t: TranslateFn }) {
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
      {isSubmitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('enviando')}
        </>
      ) : (
        t('enviar')
      )}
    </Button>
  );
}

function StepNavigation({
  currentStep,
  isLastStep,
  canGoNext,
  isSubmitting,
  onPrev,
  onNext,
  t,
  tCommon,
}: {
  currentStep: number;
  isLastStep: boolean;
  canGoNext: boolean;
  isSubmitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  t: TranslateFn;
  tCommon: TranslateFn;
}) {
  return (
    <div className="mt-6 flex justify-between">
      {currentStep > 0 && (
        <Button type="button" variant="outline" onClick={onPrev} disabled={isSubmitting}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          {tCommon('anterior')}
        </Button>
      )}
      <div className="flex gap-2">
        {isLastStep ? (
          <SubmitButton isSubmitting={isSubmitting} t={t} />
        ) : (
          <Button type="button" onClick={onNext} disabled={!canGoNext || isSubmitting}>
            {tCommon('siguiente')}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function PublicFormError({ error, t }: { error: string | null; t: TranslateFn }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <TenantLogoHeader />
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('formularioNoDisponible')}</h2>
            <p className="text-muted-foreground">{error || t('formularioNoPublicado')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PublicFormPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;
  const t = useTranslations('formularios');
  const tCommon = useTranslations('common');

  const { fetchPublicForm, submitForm } = useForms();

  const [form, setForm] = useState<PublicFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [contact, setContact] = useState<ContactData>({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  const allQuestions = form?.questions ?? [];
  const visibleQuestions = allQuestions.filter((q) => evaluateVisibility(q, answers));
  const blockedByDejaFuera = isBlockedByDejaFuera(allQuestions, answers);
  const activeRecommendations = getActiveRecommendations(allQuestions, answers);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleContactChange = (field: keyof ContactData, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
  };

  const stepQuestions = visibleQuestions.slice(currentStep * QUESTIONS_PER_STEP, (currentStep + 1) * QUESTIONS_PER_STEP);
  const totalSteps = Math.ceil(visibleQuestions.length / QUESTIONS_PER_STEP);
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = !stepQuestions.some((q) => isRequiredAndMissing(q, answers));

  useEffect(() => {
    const loadForm = async () => {
      setIsLoading(true);
      const loaded = await loadPublicForm(fetchPublicForm, formId, t, tCommon);
      if (loaded.data) {
        setForm(loaded.data);
        setShowContact(loaded.data.form.requiresContact || false);
      } else {
        setError(loaded.error);
      }
      setIsLoading(false);
    };
    loadForm();
  }, [formId, fetchPublicForm, t, tCommon]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationError = validateSubmission({
      blockedByDejaFuera,
      visibleQuestions,
      answers,
      showContact,
      contact,
      t,
    });
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitForm(formId, answers, showContact ? contact : undefined);
      if (!result.success) {
        setSubmitError(result.error || tCommon('error'));
        return;
      }
      const query = buildConfirmationParams(
        result.data,
        blockedByDejaFuera,
        activeRecommendations[0],
        form?.questions ?? [],
        answers,
      );
      router.push(`/formulario/${formId}/confirmacion?${query.toString()}`);
    } catch (err: any) {
      setSubmitError(err.message || tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <TenantLogoHeader />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !form) {
    return <PublicFormError error={error} t={t} />;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <TenantLogoHeader />
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{form.form.title}</CardTitle>
            {form.form.description && <CardDescription className="text-muted-foreground mt-2">{form.form.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <StepProgress currentStep={currentStep} totalSteps={totalSteps} />

              <div className="space-y-6">
                {stepQuestions.map((q) => (
                  <QuestionRenderer
                    key={q.id}
                    question={q}
                    answer={answers[q.id]}
                    isSubmitting={isSubmitting}
                    onChange={handleAnswerChange}
                    t={t}
                  />
                ))}
              </div>

              <FormNotices
                blockedByDejaFuera={blockedByDejaFuera}
                recommendation={activeRecommendations[0]}
                t={t}
              />

              {showContact && isLastStep && (
                <ContactSection contact={contact} onChange={handleContactChange} disabled={isSubmitting} t={t} />
              )}

              {submitError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <StepNavigation
                currentStep={currentStep}
                isLastStep={isLastStep}
                canGoNext={canGoNext}
                isSubmitting={isSubmitting}
                onPrev={handlePrev}
                onNext={handleNext}
                t={t}
                tCommon={tCommon}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
