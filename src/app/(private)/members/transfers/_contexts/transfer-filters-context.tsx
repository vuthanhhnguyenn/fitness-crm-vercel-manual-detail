'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useTransferFilters } from '../_hooks/use-transfer-filters';

export type TransferFiltersContextValue = ReturnType<typeof useTransferFilters>;

const TransferFiltersContext = createContext<TransferFiltersContextValue | undefined>(undefined);

export function TransferFiltersProvider({
  children,
  value,
}: Readonly<{
  children: ReactNode;
  value: TransferFiltersContextValue;
}>) {
  return (
    <TransferFiltersContext.Provider value={value}>{children}</TransferFiltersContext.Provider>
  );
}

export function useTransferFiltersContext() {
  const context = useContext(TransferFiltersContext);
  if (!context) {
    throw new Error('useTransferFiltersContext must be used within TransferFiltersProvider');
  }
  return context;
}
