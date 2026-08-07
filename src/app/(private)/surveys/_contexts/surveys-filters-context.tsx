'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useSurveysFilters } from '../_hooks/use-surveys-filters';

export type SurveysFiltersContextValue = ReturnType<typeof useSurveysFilters>;

const SurveysFiltersContext = createContext<SurveysFiltersContextValue | undefined>(undefined);

export function SurveysFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: SurveysFiltersContextValue;
}) {
  return <SurveysFiltersContext.Provider value={value}>{children}</SurveysFiltersContext.Provider>;
}

export function useSurveysFiltersContext() {
  const context = useContext(SurveysFiltersContext);
  if (!context) {
    throw new Error('useSurveysFiltersContext must be used within SurveysFiltersProvider');
  }
  return context;
}
