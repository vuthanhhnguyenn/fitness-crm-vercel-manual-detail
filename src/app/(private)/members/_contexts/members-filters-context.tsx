'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useMembersFilters } from '../_hooks/use-members-filters';

export type MembersFiltersContextValue = ReturnType<typeof useMembersFilters>;

const MembersFiltersContext = createContext<MembersFiltersContextValue | undefined>(undefined);

export function MembersFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MembersFiltersContextValue;
}) {
  return <MembersFiltersContext.Provider value={value}>{children}</MembersFiltersContext.Provider>;
}

export function useMembersFiltersContext() {
  const context = useContext(MembersFiltersContext);
  if (!context) {
    throw new Error('useMembersFiltersContext must be used within MembersFiltersProvider');
  }
  return context;
}
