/** Message of an Error instance, or the provided fallback for any other thrown value. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Best-effort message from a failed fetch Response (`message`, then `error`, then the fallback). */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  const errorData = await res.json().catch(() => ({}));
  return errorData.message || errorData.error || fallback;
}
