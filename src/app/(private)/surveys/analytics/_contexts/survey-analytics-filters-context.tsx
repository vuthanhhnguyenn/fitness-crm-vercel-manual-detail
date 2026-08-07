'use client';

import { type ReactNode, createContext, useContext } from 'react';

import type { useSurveyAnalyticsFilters } from '../_hooks/use-survey-analytics-filters';

type SurveyAnalyticsFiltersHook = ReturnType<typeof useSurveyAnalyticsFilters>;

const SurveyAnalyticsFiltersContext = createContext<SurveyAnalyticsFiltersHook | null>(null);

export function SurveyAnalyticsFiltersProvider({
  value,
  children,
}: {
  value: SurveyAnalyticsFiltersHook;
  children: ReactNode;
}) {
  return (
    <SurveyAnalyticsFiltersContext.Provider value={value}>
      {children}
    </SurveyAnalyticsFiltersContext.Provider>
  );
}

export function useSurveyAnalyticsFiltersContext() {
  const context = useContext(SurveyAnalyticsFiltersContext);
  if (!context) {
    throw new Error(
      'useSurveyAnalyticsFiltersContext must be used within SurveyAnalyticsFiltersProvider',
    );
  }

  return context;
}
