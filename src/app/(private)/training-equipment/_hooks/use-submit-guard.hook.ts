import { useCallback, useEffect, useRef } from 'react';

/**
 * Blocks repeated submits of the same action. A mutation's `isPending` only disables the button on
 * the next render, so clicks fired within the same tick still reach the handler — the ref closes
 * that window synchronously.
 *
 * The guard stays closed once a submit went through and is released only when the request **failed**
 * (so the still-open dialog/form can be retried) or when the caller resets it explicitly, e.g. when
 * a dialog is reopened. Releasing it on every settled request would not be enough: react-hook-form
 * validates asynchronously, so a queued second click can arrive after a fast request has already
 * succeeded — which is exactly how a duplicate record gets created.
 *
 * Wrap only the call that performs the request: validation that runs before it must stay outside,
 * otherwise a rejected submit would leave the guard closed.
 */
export function useSubmitGuard(isPending: boolean, isError = false) {
  const submittedRef = useRef(false);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;
      return;
    }
    if (!wasPendingRef.current) return;

    wasPendingRef.current = false;
    if (isError) submittedRef.current = false;
  }, [isPending, isError]);

  const submitOnce = useCallback((action: () => void) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    action();
  }, []);

  const resetSubmitGuard = useCallback(() => {
    submittedRef.current = false;
  }, []);

  return { submitOnce, resetSubmitGuard };
}
