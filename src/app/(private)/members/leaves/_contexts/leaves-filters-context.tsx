'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useLeavesFilters } from '../_hooks/use-leaves-filters';

export type LeavesFiltersContextValue = ReturnType<typeof useLeavesFilters>;

const LeavesFiltersContext = createContext<LeavesFiltersContextValue | undefined>(undefined);

export function LeavesFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: LeavesFiltersContextValue;
}) {
  return <LeavesFiltersContext.Provider value={value}>{children}</LeavesFiltersContext.Provider>;
}

export function useLeavesFiltersContext() {
  const context = useContext(LeavesFiltersContext);
  if (!context) {
    throw new Error('useLeavesFiltersContext must be used within LeavesFiltersProvider');
  }
  return context;
}
