'use client';

import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

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

import { getCrmStoresOptions, getCrmToolTypesOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Store, TrainingEquipmentItem } from '@/lib/api/types.gen';

import {
  TRAINING_EQUIPMENT_INSTALLATION_AREA_OPTIONS,
  TRAINING_EQUIPMENT_STATUS_LABELS,
} from '../_constants/training-equipment.constants';
import type {
  TrainingEquipmentFormSubmitValues,
  TrainingEquipmentFormValues,
} from '../_schemas/training-equipment-form.schema';
import {
  getTrainingEquipmentStatusBadgeClass,
  getTrainingEquipmentStatusDotClass,
} from '../_utils/training-equipment-display.util';

function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

type TrainingEquipmentFormFieldsProps = {
  control: Control<TrainingEquipmentFormValues, unknown, TrainingEquipmentFormSubmitValues>;
  isEdit?: boolean;
  currentStatus?: TrainingEquipmentItem['status'];
  showToolTypeWarning?: boolean;
  onStoreChange?: (store: Store | null) => void;
};

export function TrainingEquipmentFormFields({
  control,
  isEdit = false,
  currentStatus,
  showToolTypeWarning = false,
  onStoreChange,
}: TrainingEquipmentFormFieldsProps) {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');

  const { data: storesRes, isFetching: isStoresLoading } = useQuery({
    ...getCrmStoresOptions({
      query: {
        page: 1,
        limit: 20,
        search: storeSearch || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      },
    }),
    enabled: isStoreOpen,
  });

  const { data: toolTypesRes } = useQuery({ ...getCrmToolTypesOptions() });
  const toolTypes = (toolTypesRes?.items ?? []).filter((item) => item.code !== 'none');
  const stores = storesRes?.stores ?? [];
  const storeId = useWatch({ control, name: 'store_id' });
  const storeName = useWatch({ control, name: 'store_name' });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-xs font-medium">
                    機材名
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="機材名を入力" className="h-8" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="tool_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    器具種別
                    <RequiredMark />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? (toolTypes.find((toolType) => toolType.code === field.value)?.name ??
                              field.value)
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {toolTypes.map((toolType) => (
                        <SelectItem key={toolType.id} value={toolType.code}>
                          {toolType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEdit && showToolTypeWarning && (
                    <p className="text-warning mt-2 flex items-start gap-1 text-xs">
                      <span className="mt-0.5">⚠</span>
                      <span>器具種別を変更するとエクササイズ紐づけに影響する可能性があります</span>
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
                      placeholder="数量を入力"
                      className="h-8"
                      value={field.value as number}
                      onChange={(event) => field.onChange(Number(event.target.value))}
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
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="メーカーを入力"
                      className="h-8"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="model_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>型番</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="型番を入力"
                      className="h-8"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="store_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    設置店舗
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect<Store>
                      value={field.value || null}
                      valueLabel={
                        isEdit && storeId ? `${storeName || storeId} (${storeId})` : undefined
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
                        field.onChange(store?.store_id ?? '');
                        onStoreChange?.(store);
                      }}
                      getOptionKey={(store) => store.store_id}
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
                      isLoading={isStoresLoading}
                      triggerClassName="h-8 w-full justify-between"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="installation_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium">設置エリア</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) => field.onChange(value || null)}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="選択してください">
                          {field.value
                            ? TRAINING_EQUIPMENT_INSTALLATION_AREA_OPTIONS.find(
                                (area) => area.value === field.value,
                              )?.label
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRAINING_EQUIPMENT_INSTALLATION_AREA_OPTIONS.map((area) => (
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
              name="installed_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>設置日</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) =>
                        field.onChange(date ? date.toISOString().slice(0, 10) : null)
                      }
                      placeholder="日付を選択"
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
                    className={`gap-1 text-xs font-medium ${getTrainingEquipmentStatusBadgeClass(currentStatus)}`}
                  >
                    <span
                      className={`size-2 rounded-full ${getTrainingEquipmentStatusDotClass(currentStatus)}`}
                    />
                    {TRAINING_EQUIPMENT_STATUS_LABELS[currentStatus]}
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    ※設置状態は詳細画面から変更できます
                  </p>
                </div>
              ) : (
                <FormField
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="選択してください">
                              {field.value
                                ? TRAINING_EQUIPMENT_STATUS_LABELS[field.value]
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TRAINING_EQUIPMENT_STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ),
                          )}
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
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    className="min-h-[100px] text-sm leading-relaxed"
                    placeholder="備考・メモを入力（任意）"
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
