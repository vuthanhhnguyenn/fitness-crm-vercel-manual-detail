// Needs window / beforeunload, so it is inherently client-only.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseUnsavedChangesReturn {
  /** Call on cancel/back-link. Runs `onConfirm` immediately when the form is clean. */
  confirmDiscard: (onConfirm: () => void) => void;
  /** Whether the discard-confirmation dialog is open. */
  discardDialogOpen: boolean;
  /** 「破棄する」 — close the dialog and run the parked navigation. */
  handleDiscardConfirm: () => void;
  /** 「編集を続ける」 / dismiss — close the dialog and keep the edits. */
  handleDiscardCancel: () => void;
}

/**
 * Guards a navigation away from a dirty form.
 *
 * | Exit path                          | Guard                                         |
 * | ---------------------------------- | --------------------------------------------- |
 * | In-page キャンセル / back link     | `confirmDiscard` → the app's discard dialog   |
 * | Reload, tab close, external URL    | `beforeunload` → the **browser's own** dialog |
 *
 * Wrap the navigation in `confirmDiscard`: when the form is clean it runs straight away,
 * otherwise it is parked until the user answers the discard dialog — render one with
 * `DiscardChangesDialog` driven by `discardDialogOpen` + the two handlers.
 *
 * `isDirty` stays owned by the caller (e.g. react-hook-form's `formState.isDirty`) so the
 * form remains the single source of truth: clear it by resetting the form, never through
 * a second flag held in here.
 *
 * Covers only the two exit paths above. A form that must also survive sidebar navigation
 * and the browser's Back button wants `useUnsavedChangesGuard` instead.
 */
export function useUnsavedChanges(isDirty: boolean): UseUnsavedChangesReturn {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Reload / tab close / external URL — the browser's own confirmation only, since the
  // HTML spec lets a page cancel an unload but not supply its own UI. Nothing is
  // subscribed while the form is clean.
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      if (!isDirty) {
        onConfirm();
        return;
      }
      // A dialog is already up: keep the navigation the user is being asked about
      // rather than silently swapping it for a newer one.
      if (pendingActionRef.current) return;
      pendingActionRef.current = onConfirm;
      setDiscardDialogOpen(true);
    },
    [isDirty],
  );

  const handleDiscardConfirm = useCallback(() => {
    setDiscardDialogOpen(false);
    // Detach before running, so a navigation that re-enters the hook starts clean.
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  const handleDiscardCancel = useCallback(() => {
    setDiscardDialogOpen(false);
    pendingActionRef.current = null;
  }, []);

  return { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel };
}
