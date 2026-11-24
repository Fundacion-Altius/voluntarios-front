import { errorMessage } from '@/lib/errorMessage';

export type ApiResult = { success: boolean; data?: unknown; error?: string };

type AttemptOptions<R extends ApiResult> = {
  fallback: string;
  onSuccess: (result: R) => void | Promise<void>;
  onError: (message: string) => void;
  /** When true, a successful response without `data` is treated as a failure. */
  requireData?: boolean;
};

/** Runs an API call and routes its outcome (ok / api error / thrown error) to the given callbacks. */
export async function attemptApi<R extends ApiResult>(
  call: () => Promise<R>,
  { fallback, onSuccess, onError, requireData = false }: AttemptOptions<R>,
): Promise<void> {
  try {
    const result = await call();
    const ok = result.success && (!requireData || Boolean(result.data));
    if (ok) await onSuccess(result);
    else onError(result.error || fallback);
  } catch (err) {
    onError(errorMessage(err, fallback));
  }
}
