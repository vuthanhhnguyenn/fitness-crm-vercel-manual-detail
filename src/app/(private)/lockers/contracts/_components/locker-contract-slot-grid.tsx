'use client';

import { useMemo } from 'react';

import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';
import { LockerContractStatus } from '@/lib/api/types.gen';

import { LOCKER_CONTRACT_STATUS_LABELS } from '../../_constants/constants';

type LockerSlot = NonNullable<GetCrmLockersByIdResponse>['locker']['slot_items'][number];

type LockerContractSlotGridProps = {
  slots: LockerSlot[];
  selectedSlotNumber?: string;
  currentSlotNumber?: string;
  onSelectSlot: (slotNumber: string) => void;
};

const SLOT_CELL_CLASSES: Record<string, string> = {
  available: 'bg-success/15 text-success border-success/20 hover:bg-success/25 cursor-pointer',
  in_use: 'bg-muted text-muted-foreground cursor-not-allowed',
  pending_release:
    'bg-warning/20 text-warning border-warning/30 hover:bg-warning/30 cursor-pointer',
};

export function LockerContractSlotGrid({
  slots,
  selectedSlotNumber,
  currentSlotNumber,
  onSelectSlot,
}: LockerContractSlotGridProps) {
  const rowNumbers = useMemo(
    () => [...new Set(slots.map((slot) => slot.row_number))].sort((a, b) => b - a),
    [slots],
  );
  const columnCount = useMemo(
    () => Math.max(...slots.map((slot) => slot.column_number), 1),
    [slots],
  );
  const slotPrefix = slots[0]?.slot_number.split('-')[0] ?? 'A';

  const summary = useMemo(() => {
    const available = slots.filter((slot) => slot.status === 'available').length;
    return { total: slots.length, available };
  }, [slots]);

  if (slots.length === 0) return null;

  return (
    <div className="bg-muted/30 mt-4 rounded-lg border px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium">スロット空き状況</p>
        <p className="text-muted-foreground text-xs">
          利用可能: {summary.available} / {summary.total}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="mx-auto w-fit p-1.5">
          <div className="mx-[136px] mb-2 flex gap-1">
            {Array.from({ length: columnCount }, (_, index) => (
              <div
                key={index}
                className="text-muted-foreground flex h-9 w-11 shrink-0 items-center justify-center text-[10px]"
              >
                {index + 1}列
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 overflow-visible">
            {rowNumbers.map((rowNumber) => {
              const rowSlots = slots
                .filter((slot) => slot.row_number === rowNumber)
                .sort((a, b) => a.column_number - b.column_number);
              const rowLabel =
                rowNumber === rowNumbers[0]
                  ? `${rowNumber}段(上)`
                  : rowNumber === rowNumbers[rowNumbers.length - 1]
                    ? `${rowNumber}段(下)`
                    : `${rowNumber}段(中)`;

              return (
                <div key={rowNumber} className="flex items-center gap-1 overflow-visible">
                  <div className="text-muted-foreground flex w-24 shrink-0 items-center justify-end pr-2 text-[10px]">
                    {rowLabel}
                  </div>
                  {rowSlots.map((slot) => {
                    const isCurrent = slot.slot_number === currentSlotNumber;
                    const isSelected = slot.slot_number === selectedSlotNumber;
                    const isUsed = slot.status === LockerContractStatus.IN_USE && !isCurrent;
                    const isSelectable =
                      slot.status === 'available' || slot.status === 'pending_release' || isCurrent;

                    return (
                      <div
                        key={slot.id}
                        className="flex h-9 w-11 shrink-0 items-center justify-center"
                      >
                        <button
                          type="button"
                          title={`${slot.slot_number} — ${LOCKER_CONTRACT_STATUS_LABELS[slot.status]}`}
                          disabled={isUsed}
                          onClick={() => {
                            if (isSelectable) onSelectSlot(slot.slot_number);
                          }}
                          className={`h-7 w-10 rounded border text-[10px] font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground ring-primary ring-offset-background ring-2 ring-offset-1'
                              : isCurrent
                                ? 'bg-primary/80 text-primary-foreground'
                                : SLOT_CELL_CLASSES[slot.status]
                          }`}
                        >
                          {slot.slot_number.replace(`${slotPrefix}-`, '')}
                        </button>
                      </div>
                    );
                  })}
                  <div className="w-24 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="bg-success/30 size-2.5 rounded-sm" />
          <span className="text-muted-foreground text-[10px]">利用可能</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-muted size-2.5 rounded-sm" />
          <span className="text-muted-foreground text-[10px]">利用中</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-warning/30 size-2.5 rounded-sm" />
          <span className="text-muted-foreground text-[10px]">開放待ち</span>
        </div>
        {currentSlotNumber ? (
          <div className="flex items-center gap-1">
            <span className="bg-primary size-2.5 rounded-sm" />
            <span className="text-muted-foreground text-[10px]">現在の割当</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
