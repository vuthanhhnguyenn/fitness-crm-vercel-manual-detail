/**
 * Reading HTTP status off a failed API call.
 *
 * The generated client throws the *parsed response body* — not an `Error`, not the
 * `Response` — so the HTTP status is lost by the time a screen sees the rejection
 * (`src/lib/api/client/client.gen.ts`). The app's error interceptor
 * (`src/hooks/useClientRequest.ts`) puts it back under `status`; these helpers are the
 * supported way to read it, so no screen has to guess the error's shape again.
 *
 * Lives outside `src/lib/api/` on purpose: that directory is regenerated wholesale by
 * `npm run generate-api`, which would delete anything hand-written inside it.
 */

/** An error body enriched by the interceptor. */
export interface ApiErrorWithStatus {
  /** HTTP status of the failed response. */
  status: number;
  [key: string]: unknown;
}

export function isApiErrorWithStatus(error: unknown): error is ApiErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { status?: unknown }).status === 'number'
  );
}

/** HTTP status of a failed call, or `undefined` when the rejection carries none. */
export function getApiErrorStatus(error: unknown): number | undefined {
  return isApiErrorWithStatus(error) ? error.status : undefined;
}

/** Default when the rejection carries nothing an operator could act on. */
export const API_ERROR_FALLBACK_MESSAGE = 'エラーが発生しました。後で再試行してください。';

/**
 * The server's user-facing message for a failed call.
 *
 * Newer route handlers use `{ error }`, while older feature routes still return
 * `{ code, message, userMessage }`; a real backend may also answer with
 * `{ detail: { message } }`. Keep all three structured shapes readable so a
 * feature migration does not turn useful validation messages into generic toasts.
 */
export function getApiErrorMessage(error: unknown, fallback = API_ERROR_FALLBACK_MESSAGE): string {
  if (typeof error === 'object' && error !== null) {
    const body = error as {
      error?: unknown;
      detail?: { message?: unknown };
      userMessage?: unknown;
    };

    if (typeof body.error === 'string' && body.error.length > 0) {
      return body.error;
    }
    if (typeof body.detail?.message === 'string' && body.detail.message.length > 0) {
      return body.detail.message;
    }
    if (typeof body.userMessage === 'string' && body.userMessage.length > 0) {
      return body.userMessage;
    }
  }
  return fallback;
}

/**
 * Attaches the response status to an error body. Only plain objects are enriched: a
 * non-JSON body arrives as a string and is left untouched, so nothing that reads the raw
 * body changes shape. Applied by the error interceptor, not called by screens.
 */
export function withApiErrorStatus(error: unknown, status: number): unknown {
  if (typeof error !== 'object' || error === null || Array.isArray(error)) {
    return error;
  }
  return { ...error, status };
}
