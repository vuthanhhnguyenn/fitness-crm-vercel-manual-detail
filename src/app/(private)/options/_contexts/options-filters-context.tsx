'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useOptionsFilters } from '../_hooks/use-options-filters';

export type OptionsFiltersContextValue = ReturnType<typeof useOptionsFilters>;

const OptionsFiltersContext = createContext<OptionsFiltersContextValue | undefined>(undefined);

export function OptionsFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: OptionsFiltersContextValue;
}) {
  return <OptionsFiltersContext.Provider value={value}>{children}</OptionsFiltersContext.Provider>;
}

export function useOptionsFiltersContext() {
  const context = useContext(OptionsFiltersContext);
  if (!context) {
    throw new Error('useOptionsFiltersContext must be used within OptionsFiltersProvider');
  }
  return context;
}
