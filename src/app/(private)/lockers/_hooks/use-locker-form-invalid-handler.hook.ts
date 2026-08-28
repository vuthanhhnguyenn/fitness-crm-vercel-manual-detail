'use client';

import { useCallback } from 'react';
import type { SubmitErrorHandler } from 'react-hook-form';

import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import type { LockerFormValues } from '../_schemas/locker-form.schema';

/**
 * Invalid-submit handler for the locker form.
 *
 * The per-slot lock settings are rendered by a plain table rather than `FormField`, so an
 * error on `slot_lock_settings.*.password` (E-01 FR-009: anything other than 4 digits) has
 * no `FormMessage` to surface it — pressing save would look like nothing happened. Toast it,
 * then hand over to the scroll helper, which finds the offending input by `aria-invalid`.
 */
export function useLockerFormInvalidHandler(): SubmitErrorHandler<LockerFormValues> {
  const scrollToFirstError = useScrollToFirstError();

  return useCallback(
    (errors) => {
      if (errors.slot_lock_settings) {
        toast.error('スロットの暗証番号は4桁の数字で入力してください');
      }
      scrollToFirstError();
    },
    [scrollToFirstError],
  );
}
