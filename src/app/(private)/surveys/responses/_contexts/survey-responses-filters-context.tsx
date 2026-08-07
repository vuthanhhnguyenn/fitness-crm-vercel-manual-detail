'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useSurveyResponsesFilters } from '../_hooks/use-survey-responses-filters';

type SurveyResponsesFiltersHook = ReturnType<typeof useSurveyResponsesFilters>;

const SurveyResponsesFiltersContext = createContext<SurveyResponsesFiltersHook | null>(null);

export function SurveyResponsesFiltersProvider({
  value,
  children,
}: {
  value: SurveyResponsesFiltersHook;
  children: ReactNode;
}) {
  return (
    <SurveyResponsesFiltersContext.Provider value={value}>
      {children}
    </SurveyResponsesFiltersContext.Provider>
  );
}

export function useSurveyResponsesFiltersContext() {
  const context = useContext(SurveyResponsesFiltersContext);
  if (!context) {
    throw new Error(
      'useSurveyResponsesFiltersContext must be used within SurveyResponsesFiltersProvider',
    );
  }

  return context;
}
