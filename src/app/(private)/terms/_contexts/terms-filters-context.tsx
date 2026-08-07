'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useTermsFilters } from '../_hooks/use-terms-filters';

export type TermsFiltersContextValue = ReturnType<typeof useTermsFilters> & {
  readonly totalAllItems: number;
};

const TermsFiltersContext = createContext<TermsFiltersContextValue | undefined>(undefined);

export function TermsFiltersProvider({
  children,
  value,
}: Readonly<{
  children: ReactNode;
  value: TermsFiltersContextValue;
}>) {
  return <TermsFiltersContext.Provider value={value}>{children}</TermsFiltersContext.Provider>;
}

export function useTermsFiltersContext() {
  const context = useContext(TermsFiltersContext);
  if (!context) {
    throw new Error('useTermsFiltersContext must be used within TermsFiltersProvider');
  }
  return context;
}
