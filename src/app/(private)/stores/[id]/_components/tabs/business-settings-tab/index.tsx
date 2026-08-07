'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';

import {
  getCrmStoresByIdBusinessHoursOptions,
  getCrmStoresByIdBusinessHoursQueryKey,
  patchCrmStoresByIdBusinessHoursMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { BusinessCalendar } from './business-calendar';
import { type BusinessHoursPatchVars, BusinessHoursSettings } from './business-hours-settings';
import type { BusinessHours } from './business-hours-shared';
import { BusinessSettingsTabSkeleton } from './business-settings-tab-skeleton';
import {
  ExceptionHoursSettings,
  type ExceptionHoursSettingsHandle,
} from './exception-hours-settings';
import {
  TemporaryClosureDaysSettings,
  type TemporaryClosureDaysSettingsHandle,
} from './temporary-closure-days-settings';

type Props = { storeId: string };

export function BusinessSettingsTab({ storeId }: Props) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [defaultHoursPreview, setDefaultHoursPreview] = useState<
    BusinessHours['default_hours'] | null
  >(null);
  const [exceptionPreview, setExceptionPreview] = useState<BusinessHours['exception_hours'] | null>(
    null,
  );
  const [closurePreview, setClosurePreview] = useState<BusinessHours['temporary_closures'] | null>(
    null,
  );

  const exceptionRef = useRef<ExceptionHoursSettingsHandle>(null);
  const closureRef = useRef<TemporaryClosureDaysSettingsHandle>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    ...getCrmStoresByIdBusinessHoursOptions({ path: { id: storeId } }),
    enabled: Boolean(storeId),
  });

  const updateMutation = useMutation({
    ...patchCrmStoresByIdBusinessHoursMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getCrmStoresByIdBusinessHoursQueryKey({ path: { id: storeId } }),
      });
      toast.success('営業時間を更新しました');
    },
    onError: () => {
      toast.error('営業時間の更新に失敗しました');
    },
  });

  const businessHours = data?.business_hours;

  const mergedBusinessHours = useMemo((): BusinessHours | null => {
    if (!businessHours) return null;
    return {
      ...businessHours,
      default_hours: defaultHoursPreview ?? businessHours.default_hours,
      exception_hours: exceptionPreview ?? businessHours.exception_hours,
      temporary_closures: closurePreview ?? businessHours.temporary_closures,
    };
  }, [businessHours, defaultHoursPreview, exceptionPreview, closurePreview]);

  const source = mergedBusinessHours;

  const defaultHoursMap = useMemo(() => {
    if (!source) return {};
    return source.default_hours.reduce<Record<string, (typeof source.default_hours)[number]>>(
      (acc, item) => {
        acc[item.day] = item;
        return acc;
      },
      {},
    );
  }, [source]);

  const exceptionMap = useMemo(() => {
    if (!source) return new Set<string>();
    return new Set(source.exception_hours.map((entry) => entry.date));
  }, [source]);

  const closureMap = useMemo(() => {
    if (!source) return new Set<string>();
    return new Set(source.temporary_closures.map((entry) => entry.date));
  }, [source]);

  const mutatePatch = useCallback(
    (vars: BusinessHoursPatchVars, opts?: { onSuccess?: () => void }) => {
      updateMutation.mutate(vars, opts);
    },
    [updateMutation],
  );

  const onDefaultPreviewChange = useCallback((draft: BusinessHours['default_hours'] | null) => {
    setDefaultHoursPreview(draft);
  }, []);
  const onExceptionPreviewChange = useCallback((draft: BusinessHours['exception_hours'] | null) => {
    setExceptionPreview(draft);
  }, []);
  const onClosurePreviewChange = useCallback(
    (draft: BusinessHours['temporary_closures'] | null) => {
      setClosurePreview(draft);
    },
    [],
  );

  if (isLoading) {
    return <BusinessSettingsTabSkeleton />;
  }

  if (isError || !source || !businessHours) {
    return (
      <div className="bg-card mt-6 flex min-h-60 items-center justify-center rounded-xl border">
        <p className="text-muted-foreground text-sm">営業時間情報の取得に失敗しました。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="w-full lg:w-3/5">
        <BusinessCalendar
          monthDate={monthDate}
          onMonthDateChange={setMonthDate}
          defaultHoursMap={defaultHoursMap}
          exceptionMap={exceptionMap}
          closureMap={closureMap}
        />
      </div>

      <div className="w-full lg:w-2/5">
        <Card className="sticky top-6 gap-4 py-4">
          <BusinessHoursSettings
            storeId={storeId}
            serverBusinessHours={businessHours}
            mutate={mutatePatch}
            isPending={updateMutation.isPending}
            onPreviewChange={onDefaultPreviewChange}
          />
          <ExceptionHoursSettings
            ref={exceptionRef}
            storeId={storeId}
            serverBusinessHours={businessHours}
            mutate={mutatePatch}
            isPending={updateMutation.isPending}
            onPreviewChange={onExceptionPreviewChange}
            onInteraction={() => closureRef.current?.clearRowEdit()}
          />
          <TemporaryClosureDaysSettings
            ref={closureRef}
            storeId={storeId}
            serverBusinessHours={businessHours}
            mutate={mutatePatch}
            isPending={updateMutation.isPending}
            onPreviewChange={onClosurePreviewChange}
            onInteraction={() => exceptionRef.current?.clearRowEdit()}
          />
        </Card>
      </div>
    </div>
  );
}
