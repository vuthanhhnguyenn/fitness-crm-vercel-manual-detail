import type { MutationFunction } from '@tanstack/react-query';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeManualNotificationError(error: unknown): unknown {
  if (!isRecord(error) || typeof error.userMessage !== 'string' || !error.userMessage) {
    return error;
  }
  return {
    ...error,
    detail: {
      ...(isRecord(error.detail) ? error.detail : {}),
      message: error.userMessage,
    },
  };
}

export function withManualNotificationError<TData, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
): MutationFunction<TData, TVariables> {
  return async (variables, context) => {
    try {
      return await mutationFn(variables, context);
    } catch (error) {
      throw normalizeManualNotificationError(error);
    }
  };
}
