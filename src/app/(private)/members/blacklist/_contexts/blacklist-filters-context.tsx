'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useBlacklistFilters } from '../_hooks/use-blacklist-filters';

export type BlacklistFiltersContextValue = ReturnType<typeof useBlacklistFilters>;

const BlacklistFiltersContext = createContext<BlacklistFiltersContextValue | undefined>(undefined);

export function BlacklistFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: BlacklistFiltersContextValue;
}) {
  return (
    <BlacklistFiltersContext.Provider value={value}>{children}</BlacklistFiltersContext.Provider>
  );
}

export function useBlacklistFiltersContext() {
  const context = useContext(BlacklistFiltersContext);
  if (!context) {
    throw new Error('useBlacklistFiltersContext must be used within BlacklistFiltersProvider');
  }
  return context;
}
