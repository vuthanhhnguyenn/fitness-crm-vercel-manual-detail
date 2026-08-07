'use client';

import { useCallback, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getCrmOptionsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';

import { ReleaseConfirmDialog } from '../../_components/release-confirm-dialog';
import { LOCKER_CONTRACT_STATUS_LABELS } from '../../_constants/constants';
import { useLockerSlotsCsvExport } from '../../_hooks/use-locker-csv-export.hook';
import { collectReleaseSlotNumbers } from '../../_utils/locker-slot-release.util';
import { LOCKER_SLOT_STATUS_CELL_CLASSES } from '../_constants/constants';
import { useLockerSlotMutations } from '../_hooks/use-locker-slot-mutations.hook';
import { SlotContractsTable } from './slot-contracts-table';
import { SlotDetailSheet } from './slot-detail-sheet';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

interface SlotManagementTabProps {
  locker: LockerDetail;
}

export function SlotManagementTab({ locker }: SlotManagementTabProps) {
  const { releaseSlots, updateSlot, sendReminder, isReleasing, isUpdatingSlot, isSendingReminder } =
    useLockerSlotMutations(locker.id);
  const { data: lockerOptionMastersData } = useQuery({
    ...getCrmOptionsOptions({
      query: { page: 1, limit: 200, status: 'active', category: 'locker_option' },
    }),
  });
  const lockerOptionMasters = lockerOptionMastersData?.options ?? [];
  const { mutate: exportCsv, isPending: isExportingCsv } = useLockerSlotsCsvExport(
    locker.locker_id,
    lockerOptionMasters.map((item) => ({ code: item.code, name: item.name })),
  );

  const [pendingOnly, setPendingOnly] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [checkedSlots, setCheckedSlots] = useState<Set<string>>(new Set());
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseTargets, setReleaseTargets] = useState<string[]>([]);

  const slots = locker.slot_items;

  const rowNumbers = useMemo(
    () => [...new Set(slots.map((slot) => slot.row_number))].sort((a, b) => b - a),
    [slots],
  );
  const columnCount = useMemo(
    () => Math.max(...slots.map((slot) => slot.column_number), 1),
    [slots],
  );
  const slotPrefix = slots[0]?.slot_number.split('-')[0] ?? 'A';

  const pendingSlots = useMemo(
    () => slots.filter((slot) => slot.status === 'pending_release'),
    [slots],
  );

  const displayedSlots = useMemo(() => {
    const occupied = slots.filter((slot) => slot.status !== 'available');
    if (pendingOnly) return pendingSlots;
    return occupied;
  }, [slots, pendingOnly, pendingSlots]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );
  const selectedContractDetailId = useMemo(() => {
    if (!selectedSlot) return null;

    const contractByDisplayId = locker.contracts.find(
      (contract) => contract.contract_id === selectedSlot.contract_id,
    );
    if (contractByDisplayId) return contractByDisplayId.id;

    const contractBySlot = locker.contracts.find(
      (contract) =>
        contract.locker_number === selectedSlot.slot_number &&
        contract.status === selectedSlot.status,
    );
    return contractBySlot?.id ?? null;
  }, [locker.contracts, selectedSlot]);

  const summary = useMemo(() => {
    const total = slots.length;
    const available = slots.filter((slot) => slot.status === 'available').length;
    const inUse = slots.filter((slot) => slot.status === 'in_use').length;
    const pending = slots.filter((slot) => slot.status === 'pending_release').length;
    return { total, available, inUse, pending };
  }, [slots]);

  const handleContractTypeChange = useCallback(
    (slotId: string, code: string) => {
      updateSlot(slotId, { contract_type_code: code });
    },
    [updateSlot],
  );

  const toggleCheck = useCallback((slotId: string) => {
    setCheckedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }, []);

  const handleBulkRelease = useCallback(() => {
    const targets = collectReleaseSlotNumbers(
      checkedSlots,
      slots,
      (slot) => slot.status === 'pending_release',
    );
    setReleaseTargets(targets);
    setReleaseDialogOpen(true);
  }, [checkedSlots, slots]);

  const handleSingleRelease = useCallback((slotNumber: string) => {
    setReleaseTargets([slotNumber]);
    setReleaseDialogOpen(true);
  }, []);

  const handleConfirmRelease = useCallback(() => {
    releaseSlots(releaseTargets, {
      onSuccess: () => {
        setReleaseDialogOpen(false);
        setCheckedSlots(new Set());
        setSelectedSlotId(null);
      },
    });
  }, [releaseSlots, releaseTargets]);

  const handlePendingOnlyChange = useCallback((value: boolean) => {
    setPendingOnly(value);
    setCheckedSlots(new Set());
  }, []);

  const colLabels = useMemo(
    () => Array.from({ length: columnCount }, (_, index) => `${index + 1}列`),
    [columnCount],
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        <Card className="pb-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">スロット配置図</CardTitle>
              <p className="text-muted-foreground text-xs">クリックでスロット詳細を表示</p>
            </div>
          </CardHeader>
          <CardContent className="px-4">
            <div className="overflow-x-auto">
              <div className="mx-auto w-fit">
                <div className="mx-[136px] mb-2 flex gap-2">
                  {colLabels.map((col) => (
                    <div
                      key={col}
                      className="text-muted-foreground flex size-12 shrink-0 items-center justify-center text-xs font-medium"
                    >
                      {col}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {rowNumbers.map((rowNumber) => {
                    const rowSlots = slots
                      .filter((slot) => slot.row_number === rowNumber)
                      .sort((a, b) => a.column_number - b.column_number);
                    const isBottomRow = rowSlots.some((slot) => slot.is_bottom_row);

                    return (
                      <div key={rowNumber} className="flex items-center gap-2">
                        <div className="flex w-32 shrink-0 items-center justify-end gap-2 pr-2">
                          <Badge
                            variant="outline"
                            className={`bg-info/15 text-info border-info/20 px-1 py-0 text-[10px] font-medium ${isBottomRow ? '' : 'invisible'}`}
                          >
                            個別会費対象
                          </Badge>
                          <div className="w-6 text-center text-xs font-medium">{rowNumber}段</div>
                        </div>
                        {rowSlots.map((slot) => {
                          const statusLabel = LOCKER_CONTRACT_STATUS_LABELS[slot.status];
                          const hidden = pendingOnly && slot.status !== 'pending_release';

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              title={`${slot.slot_number} — ${statusLabel}`}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`relative flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-[10px] font-medium transition-colors ${LOCKER_SLOT_STATUS_CELL_CLASSES[slot.status]} ${slot.is_bottom_row ? 'border-t-info/60 border-t-2' : ''} ${selectedSlotId === slot.id ? 'ring-primary ring-2' : ''} ${hidden ? 'opacity-25' : ''}`}
                            >
                              {slot.slot_number.replace(`${slotPrefix}-`, '')}
                              {slot.individual_fee !== null ? (
                                <span className="bg-foreground text-background absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-[3px] text-[8px] leading-none font-bold">
                                  ¥
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                        <div className="w-32 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>

          <div className="bg-muted/50 text-muted-foreground rounded-b-xl border-t px-4 py-3 text-[10px]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-3">
                <span className="text-foreground font-medium">状態:</span>
                <div className="flex items-center gap-1">
                  <div className="border-border bg-background size-3 rounded border" /> 利用可能
                </div>
                <div className="flex items-center gap-1">
                  <div className="border-info/20 bg-info/15 size-3 rounded border" /> 利用中
                </div>
                <div className="flex items-center gap-1">
                  <div className="border-warning/20 bg-warning/15 size-3 rounded border" /> 開放待ち
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-foreground font-medium">属性:</span>
                <div className="flex items-center gap-1">
                  <div className="border-border border-t-info/60 bg-background size-3 rounded border border-t-2" />
                  <span>個別会費対象（最下段・上部 info色ライン）</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-foreground text-background flex size-3 items-center justify-center rounded-[3px] text-[8px] leading-none font-bold">
                    ¥
                  </span>
                  <span>個別会費設定済み</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="bg-card flex items-center gap-6 rounded-lg border px-4 py-3">
          <div className="text-muted-foreground text-xs">
            総スロット: <span className="text-foreground font-semibold">{summary.total}</span>
          </div>
          <div className="bg-border h-4 w-px" />
          <div className="text-muted-foreground text-xs">
            利用可能: <span className="text-success font-semibold">{summary.available}</span>
          </div>
          <div className="bg-border h-4 w-px" />
          <div className="text-muted-foreground text-xs">
            利用中: <span className="text-info font-semibold">{summary.inUse}</span>
          </div>
          <div className="bg-border h-4 w-px" />
          <div className="text-muted-foreground text-xs">
            開放待ち: <span className="text-warning font-semibold">{summary.pending}</span>
          </div>
        </div>

        <SlotContractsTable
          lockerOptionMasters={lockerOptionMasters}
          pendingSlots={pendingSlots}
          displayedSlots={displayedSlots}
          pendingOnly={pendingOnly}
          onExportCsv={() =>
            exportCsv({
              path: { id: locker.id },
              body: { pending_only: pendingOnly || undefined },
            })
          }
          isExportingCsv={isExportingCsv}
          onPendingOnlyChange={handlePendingOnlyChange}
          checkedSlots={checkedSlots}
          onToggleCheck={toggleCheck}
          onBulkRelease={handleBulkRelease}
          onSingleRelease={handleSingleRelease}
          onSelectSlot={setSelectedSlotId}
          onContractTypeChange={handleContractTypeChange}
          isUpdatingSlot={isUpdatingSlot}
        />
      </div>

      <SlotDetailSheet
        open={selectedSlotId !== null}
        onClose={() => setSelectedSlotId(null)}
        slot={selectedSlot}
        contractDetailId={selectedContractDetailId}
        lockerArea={locker.area}
        lockerOptionMasters={lockerOptionMasters}
        isUpdating={isUpdatingSlot}
        isSendingReminder={isSendingReminder}
        onContractTypeSave={handleContractTypeChange}
        onRelease={(slotNumber) => {
          setSelectedSlotId(null);
          handleSingleRelease(slotNumber);
        }}
        onUpdateSlot={updateSlot}
        onSendReminder={sendReminder}
      />

      <ReleaseConfirmDialog
        open={releaseDialogOpen}
        onOpenChange={setReleaseDialogOpen}
        targetSlots={releaseTargets}
        onConfirm={handleConfirmRelease}
        isPending={isReleasing}
      />
    </>
  );
}
