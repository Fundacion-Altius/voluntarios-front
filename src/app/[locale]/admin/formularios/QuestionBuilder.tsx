'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GripVertical, Trash2, Plus, ChevronDown, ChevronUp, Copy, Eye, EyeOff,
  Star, Type, List, Hash, Calendar, Minus, CheckCircle, AlertTriangle,
  MessageSquare, Settings, ArrowUpDown
} from 'lucide-react';
import {
  DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot
} from '@hello-pangea/dnd';

type QuestionType =
  | 'estrellas'
  | 'opcionUnica'
  | 'opcionMultiple'
  | 'textoCorto'
  | 'textoLargo'
  | 'siNo'
  | 'numero'
  | 'fecha';

interface FormQuestion {
  id: string;
  formId: string;
  order: number;
  type: QuestionType;
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
}

interface QuestionBuilderProps {
  questions: FormQuestion[];
  onChange: (questions: FormQuestion[]) => void;
  isPreview?: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'textoCorto', label: 'Texto corto', icon: <Type className="h-4 w-4" />, description: 'Respuesta breve de una línea' },
  { value: 'textoLargo', label: 'Texto largo', icon: <MessageSquare className="h-4 w-4" />, description: 'Respuesta de varias líneas' },
  { value: 'opcionUnica', label: 'Opción única', icon: <CheckCircle className="h-4 w-4" />, description: 'Seleccionar una opción (radio)' },
  { value: 'opcionMultiple', label: 'Opción múltiple', icon: <List className="h-4 w-4" />, description: 'Seleccionar varias opciones (checkbox)' },
  { value: 'estrellas', label: 'Estrellas', icon: <Star className="h-4 w-4" />, description: 'Valoración de 1 a 5 estrellas' },
  { value: 'siNo', label: 'Sí / No', icon: <Hash className="h-4 w-4" />, description: 'Respuesta binaria' },
  { value: 'numero', label: 'Número', icon: <Minus className="h-4 w-4" />, description: 'Valor numérico' },
  { value: 'fecha', label: 'Fecha', icon: <Calendar className="h-4 w-4" />, description: 'Selector de fecha' },
];

const OPERATORS = [
  { value: 'equals', label: 'Es igual a' },
  { value: 'notEquals', label: 'No es igual a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'notContains', label: 'No contiene' },
  { value: 'greaterThan', label: 'Mayor que' },
  { value: 'lessThan', label: 'Menor que' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getDefaultOptions(type: QuestionType): string[] | null {
  if (type === 'opcionUnica' || type === 'opcionMultiple') {
    return ['Opción 1', 'Opción 2', 'Opción 3'];
  }
  return null;
}

function getDefaultValidation(type: QuestionType): Record<string, unknown> | null {
  switch (type) {
    case 'textoCorto':
      return { maxLength: 255 };
    case 'textoLargo':
      return { maxLength: 2000 };
    case 'numero':
      return { min: 0, max: 1000000 };
    default:
      return null;
  }
}

type UpdateQuestionFn = (updates: Partial<FormQuestion>) => void;
type TranslateFn = ReturnType<typeof useTranslations>;
type ConditionalLogic = NonNullable<FormQuestion['conditionalLogic']>;

const BADGE_BASE = 'px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1';

function QuestionBadges({
  question,
  typeLabel,
  index,
  t,
}: {
  question: FormQuestion;
  typeLabel?: string;
  index: number;
  t: TranslateFn;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
        {typeLabel}
      </span>
      {question.dejaFuera && (
        <span className={`${BADGE_BASE} bg-destructive/10 text-destructive`}>
          <AlertTriangle className="h-3 w-3" />
          {t('dejaFuera')}
        </span>
      )}
      {question.recomienda && (
        <span className={`${BADGE_BASE} bg-warning/10 text-warning`}>
          <Star className="h-3 w-3" />
          {t('recomienda')}
        </span>
      )}
      {question.conditionalLogic && (
        <span className={`${BADGE_BASE} bg-info/10 text-info`}>
          <Eye className="h-3 w-3" />
          Show/Hide
        </span>
      )}
    </div>
  );
}

function QuestionHeaderActions({
  isExpanded,
  onToggleExpanded,
  onDuplicate,
  onDelete,
  tCommon,
}: {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  tCommon: TranslateFn;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleExpanded}
        aria-label={isExpanded ? tCommon('cerrar') : tCommon('editar')}
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDuplicate}
        aria-label={tCommon('crear') + ' (copia)'}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={tCommon('eliminar')}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}

function OptionsEditor({
  question,
  onUpdate,
  isPreview,
  t,
  tCommon,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
  tCommon: TranslateFn;
}) {
  return (
    <div>
      <Label className="block text-sm font-medium mb-1">
        {t('opciones') || 'Opciones'} *
      </Label>
      <div className="space-y-2">
        {(question.options || []).map((option, optIndex) => (
          <div key={optIndex} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(e) => {
                const newOptions = [...(question.options || [])];
                newOptions[optIndex] = e.target.value;
                onUpdate({ options: newOptions });
              }}
              placeholder={`Opción ${optIndex + 1}`}
              disabled={isPreview}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newOptions = (question.options || []).filter((_, i) => i !== optIndex);
                onUpdate({ options: newOptions });
              }}
              disabled={isPreview || (question.options?.length || 0) <= 2}
              aria-label={tCommon('eliminar')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdate({ options: [...(question.options || []), ''] })}
          disabled={isPreview}
          className="w-full justify-start"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('anadirOpcion') || 'Añadir opción'}
        </Button>
      </div>
    </div>
  );
}

function StarsEditor({
  question,
  onUpdate,
  isPreview,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <Label className="block text-sm font-medium mb-1">Máximo de estrellas</Label>
        <Select
          value={String((question.validation?.maxStars as number) || 5)}
          onValueChange={(value) => onUpdate({
            validation: { ...(question.validation || {}), maxStars: Number(value) }
          })}
          disabled={isPreview}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 estrellas</SelectItem>
            <SelectItem value="10">10 estrellas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function NumberRangeEditor({
  question,
  onUpdate,
  isPreview,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="block text-sm font-medium mb-1">Valor mínimo</Label>
        <Input
          type="number"
          value={String((question.validation?.min as number) || 0)}
          onChange={(e) => onUpdate({
            validation: { ...(question.validation || {}), min: Number(e.target.value) }
          })}
          disabled={isPreview}
        />
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">Valor máximo</Label>
        <Input
          type="number"
          value={String((question.validation?.max as number) || 1000000)}
          onChange={(e) => onUpdate({
            validation: { ...(question.validation || {}), max: Number(e.target.value) }
          })}
          disabled={isPreview}
        />
      </div>
    </div>
  );
}

function QuestionTypeEditors({
  question,
  onUpdate,
  isPreview,
  t,
  tCommon,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
  tCommon: TranslateFn;
}) {
  switch (question.type) {
    case 'opcionUnica':
    case 'opcionMultiple':
      return <OptionsEditor question={question} onUpdate={onUpdate} isPreview={isPreview} t={t} tCommon={tCommon} />;
    case 'estrellas':
      return <StarsEditor question={question} onUpdate={onUpdate} isPreview={isPreview} />;
    case 'numero':
      return <NumberRangeEditor question={question} onUpdate={onUpdate} isPreview={isPreview} />;
    default:
      return null;
  }
}

function LogicToggles({
  question,
  onUpdate,
  isPreview,
  t,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
}) {
  const labelClass = 'flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors';
  return (
    <div>
      <Label className="block text-sm font-medium mb-2">
        {t('tipoLogica') || 'Tipo de lógica'}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <label className={labelClass}>
          <input
            type="checkbox"
            checked={!!question.conditionalLogic}
            onChange={(e) => onUpdate({
              conditionalLogic: e.target.checked
                ? { type: 'show_hide', targetQuestionId: question.id, condition: { sourceQuestionId: '', operator: 'equals', value: '' } }
                : null
            })}
            disabled={isPreview}
          />
          <span className="text-sm">
            <Eye className="h-4 w-4 mr-1" />
            {t('mostrarOcultar') || 'Mostrar/Ocultar'}
          </span>
        </label>
        <label className={labelClass}>
          <input
            type="checkbox"
            checked={question.dejaFuera}
            onChange={(e) => onUpdate({ dejaFuera: e.target.checked })}
            disabled={isPreview}
          />
          <span className="text-sm">
            <AlertTriangle className="h-4 w-4 mr-1 text-destructive" />
            {t('dejaFuera') || 'Deja fuera'}
          </span>
        </label>
        <label className={labelClass}>
          <input
            type="checkbox"
            checked={question.recomienda}
            onChange={(e) => onUpdate({ recomienda: e.target.checked })}
            disabled={isPreview}
          />
          <span className="text-sm">
            <Star className="h-4 w-4 mr-1 text-warning" />
            {t('recomienda') || 'Recomienda'}
          </span>
        </label>
      </div>
    </div>
  );
}

function ShowHideConfig({
  logic,
  otherQuestions,
  onUpdate,
  isPreview,
  t,
}: {
  logic: ConditionalLogic;
  otherQuestions: FormQuestion[];
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
}) {
  const updateCondition = (patch: Partial<ConditionalLogic['condition']>) =>
    onUpdate({
      conditionalLogic: {
        ...logic,
        condition: { ...logic.condition, ...patch },
      },
    });

  return (
    <div className="space-y-3 border-t pt-4">
      <Label className="block text-sm font-medium">
        {t('mostrarOcultarConfig') || 'Configurar Mostrar/Ocultar'}
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="block text-sm font-medium mb-1">
            {t('preguntaOrigen') || 'Pregunta de origen'}
          </Label>
          <Select
            value={logic.condition.sourceQuestionId}
            onValueChange={(value) => updateCondition({ sourceQuestionId: value })}
            disabled={isPreview}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('seleccionarPregunta') || 'Seleccionar pregunta'} />
            </SelectTrigger>
            <SelectContent>
              {otherQuestions.map(q => (
                <SelectItem key={q.id} value={q.id}>
                  {(q.text || 'Sin texto').slice(0, 50)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">
            {t('operador') || 'Operador'}
          </Label>
          <Select
            value={logic.condition.operator}
            onValueChange={(value) => updateCondition({ operator: value as ConditionalLogic['condition']['operator'] })}
            disabled={isPreview}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">
            {t('valor') || 'Valor'}
          </Label>
          <Input
            value={logic.condition.value}
            onChange={(e) => updateCondition({ value: e.target.value })}
            placeholder={t('valorEsperado') || 'Valor esperado'}
            disabled={isPreview}
          />
        </div>
      </div>
    </div>
  );
}

function DejaFueraConfig({
  question,
  onUpdate,
  isPreview,
  t,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
}) {
  return (
    <div className="space-y-3 border-t pt-4">
      <Label className="block text-sm font-medium">
        {t('dejaFueraConfig') || 'Configurar Deja Fuera'}
      </Label>
      <Alert className="border-destructive/50 bg-destructive/5">
        <AlertDescription className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {t('dejaFueraDesc') || 'Si el usuario responde este valor, el formulario termina y se marca como rechazado.'}
        </AlertDescription>
      </Alert>
      <div>
        <Label className="block text-sm font-medium mb-1">
          {t('valorDejaFuera') || 'Valor que activa "Deja Fuera"'}
        </Label>
        <Input
          value={question.dejaFueraValue || ''}
          onChange={(e) => onUpdate({ dejaFueraValue: e.target.value })}
          placeholder={t('valorEsperado') || 'Valor esperado (ej: "No")'}
          disabled={isPreview}
        />
      </div>
    </div>
  );
}

function RecomiendaConfig({
  question,
  onUpdate,
  isPreview,
  t,
}: {
  question: FormQuestion;
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
}) {
  return (
    <div className="space-y-3 border-t pt-4">
      <Label className="block text-sm font-medium">
        {t('recomiendaConfig') || 'Configurar Recomienda'}
      </Label>
      <Alert className="border-warning/50 bg-warning/5">
        <AlertDescription className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          {t('recomiendaDesc') || 'Si el usuario responde este valor, se muestra un mensaje de recomendación personalizado.'}
        </AlertDescription>
      </Alert>
      <div>
        <Label className="block text-sm font-medium mb-1">
          {t('valorRecomienda') || 'Valor que activa "Recomienda"'}
        </Label>
        <Input
          value={question.recomiendaValue || ''}
          onChange={(e) => onUpdate({ recomiendaValue: e.target.value })}
          placeholder={t('valorEsperado') || 'Valor esperado (ej: "Sí")'}
          disabled={isPreview}
        />
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">
          {t('mensajeRecomienda') || 'Mensaje de recomendación'}
        </Label>
        <Textarea
          value={question.recomiendaMessage || ''}
          onChange={(e) => onUpdate({ recomiendaMessage: e.target.value })}
          placeholder={t('mensajeRecomiendaPlaceholder') || 'Ej: "¡Gracias! Te recomendamos inscribirte en el voluntariado..."'}
          rows={2}
          disabled={isPreview}
        />
      </div>
    </div>
  );
}

function LogicPanel({
  question,
  otherQuestions,
  onUpdate,
  isPreview,
  t,
}: {
  question: FormQuestion;
  otherQuestions: FormQuestion[];
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  t: TranslateFn;
}) {
  const showHide = question.conditionalLogic && otherQuestions.length > 0
    ? question.conditionalLogic
    : null;
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <LogicToggles question={question} onUpdate={onUpdate} isPreview={isPreview} t={t} />
      {showHide && (
        <ShowHideConfig
          logic={showHide}
          otherQuestions={otherQuestions}
          onUpdate={onUpdate}
          isPreview={isPreview}
          t={t}
        />
      )}
      {question.dejaFuera && (
        <DejaFueraConfig question={question} onUpdate={onUpdate} isPreview={isPreview} t={t} />
      )}
      {question.recomienda && (
        <RecomiendaConfig question={question} onUpdate={onUpdate} isPreview={isPreview} t={t} />
      )}
    </div>
  );
}

function QuestionEditorContent({
  question,
  typeConfig,
  otherQuestions,
  onUpdate,
  isPreview,
  showLogic,
  onToggleLogic,
  t,
  tCommon,
}: {
  question: FormQuestion;
  typeConfig?: { description: string };
  otherQuestions: FormQuestion[];
  onUpdate: UpdateQuestionFn;
  isPreview?: boolean;
  showLogic: boolean;
  onToggleLogic: () => void;
  t: TranslateFn;
  tCommon: TranslateFn;
}) {
  return (
    <CardContent className="pt-0 pb-3">
      <div className="space-y-4">
        <div>
          <Label className="block text-sm font-medium mb-1">
            {t('textoPregunta')} *
          </Label>
          <Textarea
            value={question.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder={typeConfig?.description}
            rows={2}
            disabled={isPreview}
            className="font-medium"
          />
        </div>

        <QuestionTypeEditors
          question={question}
          onUpdate={onUpdate}
          isPreview={isPreview}
          t={t}
          tCommon={tCommon}
        />

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="font-medium">{t('logicaCondicional') || 'Lógica condicional'}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleLogic}
              className="h-auto px-2 py-1"
            >
              <Settings className="h-4 w-4 mr-1" />
              {showLogic ? tCommon('cerrar') : t('configurarLogica') || 'Configurar'}
            </Button>
          </div>

          {showLogic && (
            <LogicPanel
              question={question}
              otherQuestions={otherQuestions}
              onUpdate={onUpdate}
              isPreview={isPreview}
              t={t}
            />
          )}
        </div>
      </div>
    </CardContent>
  );
}

function QuestionCardBody({
  question,
  index,
  otherQuestions,
  provided,
  snapshot,
  onUpdate,
  onDelete,
  onDuplicate,
  isPreview,
}: {
  question: FormQuestion;
  index: number;
  otherQuestions: FormQuestion[];
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onUpdate: UpdateQuestionFn;
  onDelete: () => void;
  onDuplicate: () => void;
  isPreview?: boolean;
}) {
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLogic, setShowLogic] = useState(false);

  const typeConfig = QUESTION_TYPES.find(q => q.value === question.type);
  const { style, ...restDraggableProps } = provided.draggableProps;

  return (
    <div
      ref={provided.innerRef}
      {...restDraggableProps}
      style={style as React.CSSProperties}
      className={`transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
          <div className="flex items-center gap-2">
            <div
              {...provided.dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              aria-label={tCommon('orden')}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <QuestionBadges question={question} typeLabel={typeConfig?.label} index={index} t={t} />
          </div>
          <div className="flex items-center gap-1">
            {!isPreview && (
              <QuestionHeaderActions
                isExpanded={isExpanded}
                onToggleExpanded={() => setIsExpanded(!isExpanded)}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                tCommon={tCommon}
              />
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <QuestionEditorContent
            question={question}
            typeConfig={typeConfig}
            otherQuestions={otherQuestions}
            onUpdate={onUpdate}
            isPreview={isPreview}
            showLogic={showLogic}
            onToggleLogic={() => setShowLogic(!showLogic)}
            t={t}
            tCommon={tCommon}
          />
        )}
      </Card>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  allQuestions,
  onUpdate,
  onDelete,
  onDuplicate,
  isPreview,
}: {
  question: FormQuestion;
  index: number;
  allQuestions: FormQuestion[];
  onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isPreview?: boolean;
}) {
  const tCommon = useTranslations('common');

  const handleUpdate = useCallback((updates: Partial<FormQuestion>) => {
    onUpdate(question.id, updates);
  }, [onUpdate, question.id]);

  const handleDelete = useCallback(() => {
    if (window.confirm(tCommon('confirmDelete'))) {
      onDelete(question.id);
    }
  }, [onDelete, question.id, tCommon]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(question.id);
  }, [onDuplicate, question.id]);

  const otherQuestions = allQuestions.filter(q => q.id !== question.id);

  return (
    <Draggable draggableId={question.id} index={index}>
      {(provided, snapshot) => (
        <QuestionCardBody
          question={question}
          index={index}
          otherQuestions={otherQuestions}
          provided={provided}
          snapshot={snapshot}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          isPreview={isPreview}
        />
      )}
    </Draggable>
  );
}

export function QuestionBuilder({ questions, onChange, isPreview = false }: QuestionBuilderProps) {
  const t = useTranslations('admin.formularios');
  const tCommon = useTranslations('common');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedQuestions = items.map((q, index) => ({ ...q, order: index }));
    onChange(updatedQuestions);
  }, [questions, onChange]);

  const handleAddQuestion = useCallback((type: QuestionType) => {
    const newQuestion: FormQuestion = {
      id: generateId(),
      formId: '',
      order: questions.length,
      type,
      text: '',
      options: getDefaultOptions(type),
      validation: getDefaultValidation(type),
      conditionalLogic: null,
      dejaFuera: false,
      dejaFueraValue: null,
      recomienda: false,
      recomiendaValue: null,
      recomiendaMessage: null,
      tenantId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChange([...questions, newQuestion]);
    setShowAddMenu(false);
  }, [questions, onChange]);

  const handleUpdateQuestion = useCallback((id: string, updates: Partial<FormQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q));
  }, [questions, onChange]);

  const handleDeleteQuestion = useCallback((id: string) => {
    const updated = questions.filter(q => q.id !== id).map((q, index) => ({ ...q, order: index }));
    onChange(updated);
  }, [questions, onChange]);

  const handleDuplicateQuestion = useCallback((id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    const newQuestion: FormQuestion = {
      ...question,
      id: generateId(),
      order: questions.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChange([...questions, newQuestion]);
  }, [questions, onChange]);

  const addTypeMenu = !isPreview && showAddMenu ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('anadirPregunta') || 'Añadir pregunta'}</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowAddMenu(false)}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {QUESTION_TYPES.map((qt) => (
            <Button
              key={qt.value}
              variant="outline"
              className="h-auto w-full justify-start gap-3 px-3 py-4"
              onClick={() => handleAddQuestion(qt.value)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {qt.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{qt.label}</div>
                <div className="text-sm text-muted-foreground">{qt.description}</div>
              </div>
            </Button>
          ))}
        </div>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setShowAddMenu(false)}>
          {tCommon('cancelar')}
        </Button>
      </div>
    </div>
  ) : null;

  if (questions.length === 0 && !isPreview) {
    return (
      <>
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-medium">{t('sinPreguntas') || 'Sin preguntas aún'}</h3>
          <p className="mb-4 text-muted-foreground">
            {t('sinPreguntasDesc') || 'Añade tu primera pregunta para empezar a construir el formulario'}
          </p>
          <Button onClick={() => setShowAddMenu(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('anadirPregunta') || 'Añadir pregunta'}
          </Button>
        </div>
        {addTypeMenu}
      </>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="questions">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3"
          >
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                allQuestions={questions}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                onDuplicate={handleDuplicateQuestion}
                isPreview={isPreview}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {!isPreview && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => setShowAddMenu(true)} className="w-full max-w-md">
            <Plus className="h-4 w-4 mr-2" />
            {t('anadirPregunta') || 'Añadir pregunta'}
          </Button>
        </div>
      )}

      {addTypeMenu}
    </DragDropContext>
  );
}