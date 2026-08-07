'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useCampaignsFilters } from '../_hooks/use-campaigns-filters';

export type CampaignsFiltersContextValue = ReturnType<typeof useCampaignsFilters>;

const CampaignsFiltersContext = createContext<CampaignsFiltersContextValue | undefined>(undefined);

export function CampaignsFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: CampaignsFiltersContextValue;
}) {
  return (
    <CampaignsFiltersContext.Provider value={value}>{children}</CampaignsFiltersContext.Provider>
  );
}

export function useCampaignsFiltersContext() {
  const context = useContext(CampaignsFiltersContext);
  if (!context) {
    throw new Error('useCampaignsFiltersContext must be used within CampaignsFiltersProvider');
  }
  return context;
}
