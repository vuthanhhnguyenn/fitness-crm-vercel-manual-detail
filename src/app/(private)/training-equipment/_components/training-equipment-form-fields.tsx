'use client';

import { useMemo, useState } from 'react';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import { formatISODateLocal } from '@/utils/date.util';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { parseISO } from 'date-fns';

import { useDebounce } from '@/hooks/use-debounce.hook';

import { RequiredMark } from '@/components/common/field-marker';
import { SearchableSelect } from '@/components/common/searchable-select';
import { TextWithTooltip } from '@/components/common/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmStoresInfiniteOptions,
  getCrmToolTypesOptions,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmStoresResponse, InstallationStatus, Store } from '@/lib/api/types.gen';

import {
  INSTALLATION_STATUS_LABELS,
  LOCATION_IN_GYM_OPTIONS,
  TRAINING_EQUIPMENT_MANUFACTURERS,
  TRAINING_EQUIPMENT_NAME_MAX_LENGTH,
  TRAINING_EQUIPMENT_NOTE_MAX_LENGTH,
} from '../_constants/training-equipment.constants';
import type {
  TrainingEquipmentFormSubmitValues,
  TrainingEquipmentFormValues,
} from '../_schemas/training-equipment-form.schema';
import {
  getInstallationStatusBadgeClass,
  getInstallationStatusDotClass,
} from '../_utils/training-equipment-display.util';

const STORE_PAGE_SIZE = 20;

type TrainingEquipmentFormFieldsProps = {
  control: Control<TrainingEquipmentFormValues, unknown, TrainingEquipmentFormSubmitValues>;
  isEdit?: boolean;
  currentStatus?: InstallationStatus;
  /** Installation store name, shown read-only while editing. */
  storeNameLabel?: string;
  /** Store code (`storeCode`) shown next to it while editing. `storeId` is an internal id and is never displayed. */
  storeCodeLabel?: string;
  onStoreChange?: (store: Store | null) => void;
};

export function TrainingEquipmentFormFields({
  control,
  isEdit = false,
  currentStatus,
  storeNameLabel,
  storeCodeLabel,
  onStoreChange,
}: TrainingEquipmentFormFieldsProps) {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [manufacturerSearch, setManufacturerSearch] = useState('');

  // Stores can span the whole company, so the search runs server-side and more rows load via infinite scroll.
  const debouncedStoreSearch = useDebounce(storeSearch, 300);
  const {
    data: storesRes,
    isFetching: isStoresLoading,
    isFetchingNextPage: isLoadingMoreStores,
    hasNextPage: hasMoreStores,
    fetchNextPage: fetchMoreStores,
  } = useInfiniteQuery({
    ...getCrmStoresInfiniteOptions({
      query: {
        limit: STORE_PAGE_SIZE,
        search: debouncedStoreSearch || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isStoreOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmStoresResponse, allPages) => {
      const currentPage = allPages.length;
      return currentPage < (lastPage.pagination?.total_pages ?? 0) ? currentPage + 1 : undefined;
    },
  });

  const { data: toolTypesRes } = useQuery({ ...getCrmToolTypesOptions() });
  const toolTypes = toolTypesRes?.items ?? [];
  const stores = useMemo(
    () => storesRes?.pages.flatMap((page) => page.stores ?? []) ?? [],
    [storesRes],
  );
  const storeId = useWatch({ control, name: 'storeId' });
  const manufacturerOptions = TRAINING_EQUIPMENT_MANUFACTURERS.filter((name) =>
    manufacturerSearch ? name.includes(manufacturerSearch) : true,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    機材名
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="機材名を入力"
                      className="h-8"
                      maxLength={TRAINING_EQUIPMENT_NAME_MAX_LENGTH}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="mstToolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    器具種別
                    <RequiredMark />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? (toolTypes.find((toolType) => toolType.id === field.value)?.name ??
                              field.value)
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {toolTypes.map((toolType) => (
                        <SelectItem key={toolType.id} value={toolType.id}>
                          {toolType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <p className="text-warning mt-2 flex items-start gap-1 text-xs">
                      <span className="mt-0.5">⚠</span>
                      <span>器具種別を変更するとエクササイズ紐づけがすべて解除されます</span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    数量
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      // No `max` attribute on purpose: it would trigger the browser's own constraint
                      // validation, which blocks the submit with a native tooltip instead of the
                      // inline message this form uses everywhere else. zod enforces the ceiling.
                      placeholder="数量を入力"
                      className="h-8"
                      // Keep a cleared field as an empty string (writing 0 back would block re-entry).
                      // zod then rejects it like a 0 and shows 「数量を入力してください」.
                      value={field.value == null ? '' : String(field.value)}
                      onChange={(event) => {
                        const { value } = event.target;
                        field.onChange(value === '' ? '' : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メーカー</FormLabel>
                  <FormControl>
                    <SearchableSelect<string>
                      value={field.value || null}
                      options={manufacturerOptions}
                      placeholder="メーカーを選択"
                      searchPlaceholder="メーカー名を検索..."
                      emptyMessage="該当なし"
                      clearLabel="選択をクリア"
                      onSearchChange={setManufacturerSearch}
                      onSelect={(manufacturer) => field.onChange(manufacturer)}
                      getOptionKey={(manufacturer) => manufacturer}
                      getOptionLabel={(manufacturer) => manufacturer}
                      triggerClassName="h-8 w-full justify-between"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>型番</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="型番を入力"
                      className="h-8"
                      maxLength={TRAINING_EQUIPMENT_NAME_MAX_LENGTH}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">設置情報</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="storeId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    設置店舗
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect<Store>
                      value={field.value || null}
                      valueLabel={
                        isEdit && storeId
                          ? `${storeNameLabel || storeId}${storeCodeLabel ? ` (${storeCodeLabel})` : ''}`
                          : undefined
                      }
                      options={stores}
                      placeholder="店舗を選択"
                      searchPlaceholder="店舗を検索..."
                      emptyMessage="該当する店舗がありません"
                      loadingMessage="店舗を読み込み中..."
                      clearLabel={isEdit ? undefined : '選択をクリア'}
                      disabled={isEdit}
                      open={isStoreOpen}
                      onOpenChange={setIsStoreOpen}
                      onSearchChange={setStoreSearch}
                      onSelect={(store) => {
                        // The API's `storeId` is the internal id (`stores.id`); the display code is `store_id`.
                        field.onChange(store?.id ?? '');
                        onStoreChange?.(store);
                      }}
                      getOptionKey={(store) => store.id}
                      getOptionLabel={(store) => `${store.name} (${store.store_id})`}
                      getOptionKeywords={(store) =>
                        [store.name, store.store_id, store.id, store.club_code]
                          .filter(Boolean)
                          .join(' ')
                      }
                      renderOption={(store) => (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <TextWithTooltip
                            text={store.name}
                            wrapperClassName="min-w-0 flex-1"
                            className="w-full"
                          />
                          <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                            {store.store_id}
                          </span>
                        </div>
                      )}
                      hasError={Boolean(fieldState.error)}
                      isLoading={isStoresLoading && !isLoadingMoreStores}
                      hasMore={hasMoreStores}
                      isLoadingMore={isLoadingMoreStores}
                      onLoadMore={() => void fetchMoreStores()}
                      triggerClassName="h-8 w-full justify-between"
                    />
                  </FormControl>
                  {isEdit && (
                    <p className="text-muted-foreground text-xs">
                      ※店舗間の移動は「撤去済みに変更 + 新店舗で新規登録」で対応します
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="locationInGym"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>設置エリア</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? LOCATION_IN_GYM_OPTIONS.find((area) => area.value === field.value)
                                ?.label
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATION_IN_GYM_OPTIONS.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="installedOn"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>設置日</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? parseISO(field.value) : undefined}
                      onDateChange={(date) =>
                        field.onChange(date ? formatISODateLocal(date) : null)
                      }
                      placeholder="日付を選択"
                      hasError={Boolean(fieldState.error)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>
                設置状態
                {!isEdit ? <RequiredMark /> : null}
              </FormLabel>
              {isEdit && currentStatus ? (
                <div className="flex h-8 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`gap-1 text-xs font-medium ${getInstallationStatusBadgeClass(currentStatus)}`}
                  >
                    <span
                      className={`size-2 rounded-full ${getInstallationStatusDotClass(currentStatus)}`}
                    />
                    {INSTALLATION_STATUS_LABELS[currentStatus]}
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    ※設置状態は詳細画面から変更できます
                  </p>
                </div>
              ) : (
                <FormField
                  control={control}
                  name="installationStatus"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="選択してください">
                              {field.value ? INSTALLATION_STATUS_LABELS[field.value] : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(INSTALLATION_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormItem>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">備考</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <p className="text-muted-foreground mb-3 text-xs">
            点検記録・修理連絡先・注意事項など任意のメモを記載してください。
          </p>
          <FormField
            control={control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-25 text-sm leading-relaxed"
                    placeholder="備考・メモを入力（任意）"
                    maxLength={TRAINING_EQUIPMENT_NOTE_MAX_LENGTH}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
