'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmLockersOptions } from '@/lib/api/@tanstack/react-query.gen';
import {
  type GetCrmLockersByIdResponse,
  type GetCrmLockersResponse,
  LockerContractStatus,
} from '@/lib/api/types.gen';

import { LOCKER_LOCK_TYPE_LABELS, LOCKER_SHAPE_LABELS } from '../../_constants/constants';
import type { LockerContractFormValues } from '../_schemas/locker-contract-form.schema';
import { formatLockerLabel, getSlotSelectLabel } from '../_utils/locker-contract-form.util';
import { LockerContractSlotGrid } from './locker-contract-slot-grid';

type LockerListItem = NonNullable<GetCrmLockersResponse>['lockers'][number];

const LOCKER_SEARCH_LIMIT = 20;

type LockerContractAssignmentSectionProps = {
  locker?: NonNullable<GetCrmLockersByIdResponse>['locker'];
  currentSlotNumber?: string;
};

export function LockerContractAssignmentSection({
  locker,
  currentSlotNumber,
}: LockerContractAssignmentSectionProps) {
  const form = useFormContext<LockerContractFormValues>();
  const lockerId = useWatch({ control: form.control, name: 'locker_id' });
  const slotNumber = useWatch({ control: form.control, name: 'slot_number' });
  const [isLockerPopoverOpen, setIsLockerPopoverOpen] = useState(false);
  const [lockerSearchQuery, setLockerSearchQuery] = useState('');

  // Fetch candidates via server-side search so they are never truncated as lockers grow across stores.
  const { data: lockersData, isFetching: isLockersFetching } = useQuery({
    ...getCrmLockersOptions({
      query: {
        page: 1,
        limit: LOCKER_SEARCH_LIMIT,
        search: lockerSearchQuery || undefined,
        sort_by: 'locker_id',
        sort_order: 'asc',
      },
    }),
    enabled: isLockerPopoverOpen,
  });

  const lockers = useMemo(() => lockersData?.lockers ?? [], [lockersData?.lockers]);
  const slots = useMemo(() => locker?.slot_items ?? [], [locker?.slot_items]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.slot_number === slotNumber) ?? null,
    [slots, slotNumber],
  );

  const selectedLockerLabel = useMemo(() => {
    if (!lockerId) return undefined;

    const fromList = lockers.find((item) => item.id === lockerId);
    if (fromList) {
      return formatLockerLabel(
        fromList.locker_id,
        fromList.area,
        LOCKER_SHAPE_LABELS[fromList.shape],
      );
    }

    if (locker?.id === lockerId) {
      return formatLockerLabel(locker.locker_id, locker.area, LOCKER_SHAPE_LABELS[locker.shape]);
    }

    return undefined;
  }, [locker, lockerId, lockers]);

  const selectedSlotLabel = useMemo(() => {
    if (!slotNumber) return undefined;
    if (!selectedSlot) return slotNumber;

    return getSlotSelectLabel(
      selectedSlot.slot_number,
      selectedSlot.status,
      selectedSlot.member_name,
      currentSlotNumber,
    );
  }, [currentSlotNumber, selectedSlot, slotNumber]);

  const occupiedContract = useMemo(() => {
    if (!locker || !slotNumber || slotNumber === currentSlotNumber) return null;
    const slot = slots.find((item) => item.slot_number === slotNumber);
    if (!slot || slot.status !== LockerContractStatus.IN_USE) return null;
    return slot.member_name;
  }, [currentSlotNumber, locker, slotNumber, slots]);

  useEffect(() => {
    if (!lockerId || !slotNumber) return;
    // Wait until the locker detail for the selected locker has finished loading.
    // Otherwise the slot list is still empty and we would wrongly clear a valid slot_number.
    if (locker?.id !== lockerId) return;
    const exists = slots.some((slot) => slot.slot_number === slotNumber);
    if (!exists) {
      form.setValue('slot_number', '', { shouldDirty: true });
    }
  }, [form, locker?.id, lockerId, slotNumber, slots]);

  const handleLockerChange = (nextLockerId: string | null) => {
    if (!nextLockerId) return;
    form.setValue('locker_id', nextLockerId, { shouldDirty: true });
    form.setValue('slot_number', '', { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ロッカー割当</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="locker_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ロッカー設備<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <FormControl>
                  <SearchableSelect<LockerListItem>
                    value={field.value || null}
                    valueLabel={selectedLockerLabel}
                    options={lockers}
                    placeholder="選択してください"
                    searchPlaceholder="ロッカーID・エリア名で検索"
                    emptyMessage="該当するロッカーがありません"
                    loadingMessage="ロッカーを読み込み中..."
                    isLoading={isLockersFetching}
                    open={isLockerPopoverOpen}
                    onOpenChange={setIsLockerPopoverOpen}
                    onSearchChange={setLockerSearchQuery}
                    onSelect={(item) => handleLockerChange(item?.id ?? null)}
                    getOptionKey={(item) => item.id}
                    getOptionLabel={(item) =>
                      formatLockerLabel(item.locker_id, item.area, LOCKER_SHAPE_LABELS[item.shape])
                    }
                    getOptionKeywords={(item) => [item.locker_id, item.area].join(' ')}
                    triggerClassName="h-8 w-full text-sm font-normal"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slot_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  スロット番号<span className="text-destructive ml-0.5">*</span>
                </FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={!lockerId}
                >
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="選択してください">{selectedSlotLabel}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slots.map((slot) => (
                      <SelectItem
                        key={slot.id}
                        value={slot.slot_number}
                        // FR-005: 「利用可」状態のスロットのみ選択可能とする. 開放待ち is still
                        // awaiting cleaning, so only the contract's own slot escapes the rule.
                        disabled={
                          slot.status !== LockerContractStatus.AVAILABLE &&
                          slot.slot_number !== currentSlotNumber
                        }
                      >
                        {getSlotSelectLabel(
                          slot.slot_number,
                          slot.status,
                          slot.member_name,
                          currentSlotNumber,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {occupiedContract ? (
                  <Alert className="border-destructive/50 bg-destructive/10 mt-2">
                    <AlertTriangle className="text-destructive size-4" />
                    <AlertDescription className="text-destructive text-xs">
                      このスロットは既に契約されています（{occupiedContract}{' '}
                      さん）。別のスロットを選択してください。
                    </AlertDescription>
                  </Alert>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {locker ? (
          <LockerContractSlotGrid
            slots={slots}
            selectedSlotNumber={slotNumber}
            currentSlotNumber={currentSlotNumber}
            onSelectSlot={(nextSlotNumber) => {
              const slot = slots.find((item) => item.slot_number === nextSlotNumber);
              // FR-005: only 「利用可」 slots may be assigned — 開放待ち is not cleaned yet.
              const isSelectable =
                slot &&
                (slot.status === LockerContractStatus.AVAILABLE ||
                  nextSlotNumber === currentSlotNumber);
              if (isSelectable) {
                form.setValue('slot_number', nextSlotNumber, { shouldDirty: true });
              }
            }}
          />
        ) : null}

        {selectedSlot ? (
          <div className="bg-muted/50 mt-4 rounded-lg border px-4 py-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <p className="text-muted-foreground text-xs">サイズ</p>
                <p className="text-sm">
                  L（W{selectedSlot.width_cm} × D{selectedSlot.depth_cm} × H{selectedSlot.height_cm}{' '}
                  cm）
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">エリア</p>
                <p className="text-sm">{locker?.area ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">施錠方法</p>
                <p className="text-sm">{LOCKER_LOCK_TYPE_LABELS[selectedSlot.lock_type]}</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
