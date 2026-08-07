'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useMembershipApplicationsFilters } from '../_hooks/use-membership-applications-filters';

export type MembershipApplicationsFiltersContextValue = ReturnType<
  typeof useMembershipApplicationsFilters
>;

const MembershipApplicationsFiltersContext = createContext<
  MembershipApplicationsFiltersContextValue | undefined
>(undefined);

export function MembershipApplicationsFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MembershipApplicationsFiltersContextValue;
}) {
  return (
    <MembershipApplicationsFiltersContext.Provider value={value}>
      {children}
    </MembershipApplicationsFiltersContext.Provider>
  );
}

export function useMembershipApplicationsFiltersContext() {
  const context = useContext(MembershipApplicationsFiltersContext);
  if (!context) {
    throw new Error(
      'useMembershipApplicationsFiltersContext must be used within MembershipApplicationsFiltersProvider',
    );
  }
  return context;
}
