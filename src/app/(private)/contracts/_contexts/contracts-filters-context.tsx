'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useContractsFilters } from '../_hooks/use-contracts-filters';

export type ContractsFiltersContextValue = ReturnType<typeof useContractsFilters>;

const ContractsFiltersContext = createContext<ContractsFiltersContextValue | undefined>(undefined);

export function ContractsFiltersProvider({
  children,
  value,
}: Readonly<{
  children: ReactNode;
  value: ContractsFiltersContextValue;
}>) {
  return (
    <ContractsFiltersContext.Provider value={value}>{children}</ContractsFiltersContext.Provider>
  );
}

export function useContractsFiltersContext() {
  const context = useContext(ContractsFiltersContext);
  if (!context) {
    throw new Error('useContractsFiltersContext must be used within ContractsFiltersProvider');
  }
  return context;
}
