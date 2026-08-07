import { useCallback } from 'react';

/**
 * Returns a callback to scroll & focus the first invalid form field.
 * Pass as the second argument to `form.handleSubmit(onValid, onInvalid)`.
 *
 * @example
 * const scrollToFirstError = useScrollToFirstError();
 * form.handleSubmit(onSubmit, scrollToFirstError)
 */
export function useScrollToFirstError() {
  return useCallback(() => {
    requestAnimationFrame(() => {
      const firstError = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus({ preventScroll: true });
      }
    });
  }, []);
}
