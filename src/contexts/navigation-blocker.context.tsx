// Holds ephemeral UI state (the currently-mounted form's discard guard) that has to
// be shared between a form page and the chrome that navigates away from it.
'use client';

import { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { useRouter } from 'next/navigation';

/** Receives the navigation the guard intercepted; call `proceed` to let it happen. */
type NavigationBlocker = (proceed: () => void) => void;

interface NavigationBlockerContextValue {
  /**
   * Registers the blocker consulted before any `guardedPush`. Pass `null` to clear
   * it. Only one blocker can be active at a time — a single form page is ever
   * mounted, so there is nothing to stack.
   */
  setBlocker: (blocker: NavigationBlocker | null) => void;
  /**
   * Navigates like `router.push`, unless a blocker is registered — then the blocker
   * decides (typically by opening a discard-changes dialog).
   *
   * App-chrome navigation (sidebar, header) must go through this instead of
   * `router.push`: Next's App Router exposes no navigation-blocking API, so an
   * unsaved-changes guard is only possible if the navigators opt in.
   */
  guardedPush: (href: string) => void;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextValue | null>(null);

export function NavigationBlockerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const blockerRef = useRef<NavigationBlocker | null>(null);

  const setBlocker = useCallback((blocker: NavigationBlocker | null) => {
    blockerRef.current = blocker;
  }, []);

  // Reads blockerRef from a click handler, never during render.
  const guardedPush = useCallback(
    (href: string) => {
      const proceed = () => router.push(href);
      const blocker = blockerRef.current;
      if (blocker) {
        blocker(proceed);
      } else {
        proceed();
      }
    },
    [router],
  );

  const value = useMemo(() => ({ setBlocker, guardedPush }), [setBlocker, guardedPush]);

  return (
    <NavigationBlockerContext.Provider value={value}>{children}</NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker(): NavigationBlockerContextValue {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error('useNavigationBlocker must be used within a NavigationBlockerProvider');
  }
  return context;
}
