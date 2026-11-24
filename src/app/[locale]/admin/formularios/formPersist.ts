import type {
  CreateFormInput,
  CreateFormQuestionInput,
  Form,
  FormQuestion,
  UpdateFormInput,
  UpdateFormQuestionInput,
} from '@/app/[locale]/admin/formularios/useForms';

type PersistResult = { success: true } | { success: false; error: string };

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

export interface CreatePersistDeps {
  createFormQuestion: (formId: string, input: CreateFormQuestionInput) => Promise<ApiResult<FormQuestion>>;
  updateFormQuestion: (
    formId: string,
    questionId: string,
    input: UpdateFormQuestionInput,
  ) => Promise<ApiResult<FormQuestion>>;
}

export interface UpdatePersistDeps {
  updateFormQuestion: CreatePersistDeps['updateFormQuestion'];
  reorderFormQuestions: (formId: string, questionIds: string[]) => Promise<unknown>;
}

function toCreateInput(formId: string, q: FormQuestion, order: number): CreateFormQuestionInput {
  return {
    formId,
    order,
    type: q.type,
    text: q.text,
    options: q.options,
    validation: q.validation,
    conditionalLogic: null,
    dejaFuera: q.dejaFuera,
    dejaFueraValue: q.dejaFueraValue,
    recomienda: q.recomienda,
    recomiendaValue: q.recomiendaValue,
    recomiendaMessage: q.recomiendaMessage,
  };
}

function toUpdateInput(q: FormQuestion, order: number): UpdateFormQuestionInput {
  return {
    order,
    text: q.text,
    options: q.options,
    validation: q.validation,
    conditionalLogic: q.conditionalLogic,
    dejaFuera: q.dejaFuera,
    dejaFueraValue: q.dejaFueraValue,
    recomienda: q.recomienda,
    recomiendaValue: q.recomiendaValue,
    recomiendaMessage: q.recomiendaMessage,
  };
}

async function createQuestionsInOrder(
  deps: CreatePersistDeps,
  formId: string,
  questions: FormQuestion[],
  fallbackError: string,
): Promise<{ success: true; idMap: Map<string, string> } | { success: false; error: string }> {
  const idMap = new Map<string, string>();
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const created = await deps.createFormQuestion(formId, toCreateInput(formId, q, i));
    if (!created.success) return { success: false, error: created.error };
    if (!created.data) return { success: false, error: fallbackError };
    idMap.set(q.id, created.data.id);
  }
  return { success: true, idMap };
}

async function linkConditionalLogic(
  deps: CreatePersistDeps,
  formId: string,
  questions: FormQuestion[],
  idMap: Map<string, string>,
): Promise<PersistResult> {
  for (const q of questions) {
    if (!q.conditionalLogic) continue;
    const serverId = idMap.get(q.id);
    const sourceId = idMap.get(q.conditionalLogic.condition.sourceQuestionId);
    if (!serverId || !sourceId) continue;
    const updated = await deps.updateFormQuestion(formId, serverId, {
      conditionalLogic: {
        type: 'show_hide',
        targetQuestionId: serverId,
        condition: {
          sourceQuestionId: sourceId,
          operator: q.conditionalLogic.condition.operator,
          value: q.conditionalLogic.condition.value,
        },
      },
    });
    if (!updated.success) return { success: false, error: updated.error };
  }
  return { success: true };
}

/** Creates all questions of a freshly-created form, then wires conditional logic with server ids. */
export async function persistNewFormQuestions(
  deps: CreatePersistDeps,
  formId: string,
  questions: FormQuestion[],
  fallbackError: string,
): Promise<PersistResult> {
  const created = await createQuestionsInOrder(deps, formId, questions, fallbackError);
  if (!created.success) return created;
  return linkConditionalLogic(deps, formId, questions, created.idMap);
}

/** Patches every existing question and then persists the final ordering. */
export async function persistExistingFormQuestions(
  deps: UpdatePersistDeps,
  formId: string,
  questions: FormQuestion[],
): Promise<void> {
  if (questions.length === 0) return;
  for (let i = 0; i < questions.length; i++) {
    await deps.updateFormQuestion(formId, questions[i].id, toUpdateInput(questions[i], i));
  }
  await deps.reorderFormQuestions(formId, questions.map(q => q.id));
}

export interface CreateFormDeps extends CreatePersistDeps {
  createForm: (input: CreateFormInput) => Promise<ApiResult<Form>>;
}

/**
 * Creates the form, reports the new id via `onCreated`, then persists its questions.
 * Resolves to `null` on success or the error message to display.
 */
export async function createFormWithQuestions(
  deps: CreateFormDeps,
  input: CreateFormInput,
  questions: FormQuestion[],
  fallbackError: string,
  onCreated: (formId: string | null) => void,
): Promise<string | null> {
  const result = await deps.createForm(input);
  if (!result.success) return result.error || fallbackError;

  const createdId = result.data?.id ?? (result.data as { formId?: string } | undefined)?.formId ?? null;
  onCreated(createdId);

  if (questions.length === 0 || !createdId) return null;
  const persisted = await persistNewFormQuestions(deps, createdId, questions, fallbackError);
  return persisted.success ? null : persisted.error;
}

export type SaveMode = 'save' | 'publish' | 'unpublish';

export interface SaveExistingFormDeps extends UpdatePersistDeps {
  updateForm: (formId: string, input: UpdateFormInput) => Promise<{ success: boolean; error?: string }>;
  publishForm: (formId: string) => Promise<unknown>;
  unpublishForm: (formId: string) => Promise<unknown>;
}

const MODE_STATUS: Record<SaveMode, UpdateFormInput['status']> = {
  save: undefined,
  publish: 'published',
  unpublish: 'draft',
};

/**
 * Updates the form, persists its questions and applies publish/unpublish.
 * Resolves to `null` on success or the error message to display.
 */
export async function saveExistingForm(
  deps: SaveExistingFormDeps,
  formId: string,
  base: UpdateFormInput,
  questions: FormQuestion[],
  mode: SaveMode,
  fallbackError: string,
): Promise<string | null> {
  const status = MODE_STATUS[mode];
  const input: UpdateFormInput = status ? { ...base, status } : base;

  const result = await deps.updateForm(formId, input);
  if (!result.success) return result.error || fallbackError;

  await persistExistingFormQuestions(deps, formId, questions);

  if (mode === 'publish') await deps.publishForm(formId);
  if (mode === 'unpublish') await deps.unpublishForm(formId);
  return null;
}
