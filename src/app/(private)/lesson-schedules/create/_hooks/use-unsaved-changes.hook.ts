'use client';

import { useCallback, useRef, useState } from 'react';

export function useUnsavedChanges(isDirty: boolean) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const confirmDiscard = useCallback(
    (onConfirm: () => void) => {
      if (isDirty) {
        pendingActionRef.current = onConfirm;
        setDiscardDialogOpen(true);
      } else {
        onConfirm();
      }
    },
    [isDirty],
  );

  const handleDiscardConfirm = useCallback(() => {
    setDiscardDialogOpen(false);
    pendingActionRef.current?.();
    pendingActionRef.current = null;
  }, []);

  const handleDiscardCancel = useCallback(() => {
    setDiscardDialogOpen(false);
    pendingActionRef.current = null;
  }, []);

  return { confirmDiscard, discardDialogOpen, handleDiscardConfirm, handleDiscardCancel };
}
