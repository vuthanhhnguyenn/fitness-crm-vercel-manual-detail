'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useOptionDiscountFilters } from '../_hooks/use-option-discount-filters';

export type OptionDiscountFiltersContextValue = ReturnType<typeof useOptionDiscountFilters>;

const OptionDiscountFiltersContext = createContext<OptionDiscountFiltersContextValue | undefined>(
  undefined,
);

export function OptionDiscountFiltersProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: OptionDiscountFiltersContextValue;
}) {
  return (
    <OptionDiscountFiltersContext.Provider value={value}>
      {children}
    </OptionDiscountFiltersContext.Provider>
  );
}

export function useOptionDiscountFiltersContext() {
  const context = useContext(OptionDiscountFiltersContext);

  if (!context) {
    throw new Error(
      'useOptionDiscountFiltersContext must be used within OptionDiscountFiltersProvider',
    );
  }

  return context;
}
