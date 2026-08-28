// Needs window.history / beforeunload, so it is inherently client-only.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigationBlocker } from '@/contexts/navigation-blocker.context';

/**
 * Guards a dirty form against every exit path a browser lets JS observe.
 *
 * | Exit path                          | Guard                                                |
 * | ---------------------------------- | ---------------------------------------------------- |
 * | In-page キャンセル / back link     | `confirmDiscard` → the app's discard dialog          |
 * | Sidebar / header navigation        | navigation-blocker registry → the app's dialog       |
 * | Browser back / forward             | sentinel history entry + `popstate` → the app's dialog |
 * | Reload, tab close, external URL    | `beforeunload` → the **browser's own** dialog         |
 *
 * The last row is the one limit that cannot be lifted: the HTML spec lets a page
 * cancel an unload but not supply its own UI, so no custom dialog is possible there.
 * Back/forward is reachable only via the sentinel entry below, because
 * `beforeunload` is spec'd not to fire for same-document history traversal and
 * Next's App Router exposes no navigation-blocking API.
 *
 * Drop-in compatible with `useUnsavedChanges`.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const { setBlocker } = useNavigationBlocker();

  /** True while a duplicate history entry of our own is sitting on top of the stack. */
  const sentinelArmedRef = useRef(false);
  /** Set while we move through history ourselves, so our listener ignores that pop. */
  const selfPopRef = useRef(false);

  /**
   * Drops our sentinel entry (if armed) before running an intentional navigation, so
   * leaving the form never strands a duplicate entry in the user's back stack. The
   * pop targets the same URL as the current entry, so it changes history depth
   * without changing the rendered route.
   */
  const runAfterDisarm = useCallback((action: () => void) => {
    if (!sentinelArmedRef.current) {
      action();
      return;
    }
    sentinelArmedRef.current = false;
    selfPopRef.current = true;
    const handleSelfPop = () => {
      window.removeEventListener('popstate', handleSelfPop);
      selfPopRef.current = false;
      action();
    };
    window.addEventListener('popstate', handleSelfPop);
    window.history.back();
  }, []);

  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      if (isDirty) {
        pendingActionRef.current = onConfirm;
        setDiscardDialogOpen(true);
      } else {
        runAfterDisarm(onConfirm);
      }
    },
    [isDirty, runAfterDisarm],
  );

  const handleDiscardConfirm = useCallback(() => {
    setDiscardDialogOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) runAfterDisarm(action);
  }, [runAfterDisarm]);

  const handleDiscardCancel = useCallback(() => {
    setDiscardDialogOpen(false);
    pendingActionRef.current = null;
  }, []);

  // Sidebar / header navigation, which goes through `guardedPush`.
  useEffect(() => {
    if (!isDirty) {
      setBlocker(null);
      return;
    }
    setBlocker((proceed) => {
      pendingActionRef.current = proceed;
      setDiscardDialogOpen(true);
    });
    return () => setBlocker(null);
  }, [isDirty, setBlocker]);

  // Reload / tab close / external URL — the browser's own confirmation only.
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Arm the sentinel on the first edit: a duplicate of the current entry, so the
  // first Back press pops that instead of leaving the page.
  useEffect(() => {
    if (!isDirty || sentinelArmedRef.current) return;
    sentinelArmedRef.current = true;
    window.history.pushState(null, '', window.location.href);
  }, [isDirty]);

  useEffect(() => {
    const handlePopState = () => {
      // Our own history.back() from runAfterDisarm — already accounted for.
      if (selfPopRef.current) {
        selfPopRef.current = false;
        return;
      }
      if (!sentinelArmedRef.current) return;

      if (!isDirty) {
        // The form was edited and then reverted: nothing to warn about, so let the
        // Back press the sentinel absorbed carry through to the real entry.
        sentinelArmedRef.current = false;
        selfPopRef.current = true;
        window.history.back();
        return;
      }

      // Re-arm so the stack depth stays constant however many times Back is pressed.
      window.history.pushState(null, '', window.location.href);
      pendingActionRef.current = () => window.history.back();
      setDiscardDialogOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);

  return {
    confirmDiscard,
    discardDialogOpen,
    handleDiscardConfirm,
    handleDiscardCancel,
    // For post-save navigation: nothing to discard, so this skips the dirty
    // check/dialog entirely but still drops the sentinel before navigating.
    navigateAfterSave: runAfterDisarm,
  };
}
