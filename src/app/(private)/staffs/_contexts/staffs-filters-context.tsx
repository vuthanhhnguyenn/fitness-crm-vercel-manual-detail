'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useStaffsFilters } from '../_hooks/use-staffs-filters';

export type StaffsFiltersContextValue = ReturnType<typeof useStaffsFilters>;

const StaffsFiltersContext = createContext<StaffsFiltersContextValue | undefined>(undefined);

export function StaffsFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: StaffsFiltersContextValue;
}) {
  return <StaffsFiltersContext.Provider value={value}>{children}</StaffsFiltersContext.Provider>;
}

export function useStaffsFiltersContext() {
  const context = useContext(StaffsFiltersContext);
  if (!context) {
    throw new Error('useStaffsFiltersContext must be used within StaffsFiltersProvider');
  }
  return context;
}
