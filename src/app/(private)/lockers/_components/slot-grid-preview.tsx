'use client';

import { Grid3X3 } from 'lucide-react';

import type { LockerNumberingPattern, LockerShape } from '@/lib/api/types.gen';

import {
  LOCKER_SHAPE_DIMENSIONS,
  formatSlotId,
  getSlotNumber,
} from '../_utils/locker-slot-numbering.util';

type SlotGridPreviewProps = {
  shape: LockerShape;
  prefix: string;
  startNum: number;
  pattern: LockerNumberingPattern;
};

export function SlotGridPreview({ shape, prefix, startNum, pattern }: SlotGridPreviewProps) {
  const dimensions = LOCKER_SHAPE_DIMENSIONS[shape];
  if (!dimensions || !prefix) return null;

  const { rows, cols } = dimensions;
  if (rows === 0 || cols === 0) return null;

  const gridRows = [];
  for (let row = rows; row >= 1; row -= 1) {
    const cells = [];
    for (let col = 1; col <= cols; col += 1) {
      const slotNum = getSlotNumber(row, col, rows, cols, pattern, startNum);
      const slotId = formatSlotId(prefix, slotNum);
      cells.push(
        <div
          key={slotId}
          className="bg-background text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded border text-[9px] font-medium"
          title={slotId}
        >
          {String(slotNum).padStart(3, '0')}
        </div>,
      );
    }
    gridRows.push(
      <div key={row} className="flex items-center gap-2">
        <div className="text-muted-foreground w-16 shrink-0 pr-2 text-right text-[10px] font-medium">
          {row}段目
        </div>
        {cells}
      </div>,
    );
  }

  const totalSlots = rows * cols;
  const lastNum = startNum + totalSlots - 1;

  return (
    <div className="bg-muted/30 mt-4 rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Grid3X3 className="text-muted-foreground size-4" />
        <p className="text-muted-foreground text-xs font-semibold">スロット配置プレビュー</p>
        <span className="text-muted-foreground ml-auto text-xs">
          {formatSlotId(prefix, startNum)} 〜 {formatSlotId(prefix, lastNum)}（{totalSlots}
          スロット）
        </span>
      </div>
      <div className="mb-2 ml-[72px] flex gap-2">
        {Array.from({ length: cols }, (_, index) => (
          <div
            key={index}
            className="text-muted-foreground flex size-10 shrink-0 items-center justify-center text-[9px] font-medium"
          >
            {index + 1}列
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">{gridRows}</div>
    </div>
  );
}
