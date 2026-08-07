'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useStoresFilters } from '../_hooks/use-stores-filters';

export type StoresFiltersContextValue = ReturnType<typeof useStoresFilters>;

const StoresFiltersContext = createContext<StoresFiltersContextValue | undefined>(undefined);

export function StoresFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: StoresFiltersContextValue;
}) {
  return <StoresFiltersContext.Provider value={value}>{children}</StoresFiltersContext.Provider>;
}

export function useStoresFiltersContext() {
  const context = useContext(StoresFiltersContext);
  if (!context) {
    throw new Error('useStoresFiltersContext must be used within StoresFiltersProvider');
  }
  return context;
}
