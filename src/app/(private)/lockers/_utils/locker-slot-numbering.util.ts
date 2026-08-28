import type { LockerNumberingPattern, LockerShape } from '@/lib/api/types.gen';

/** E-01 shape definitions: only 4 shapes — 3 rows × 9 / 7 / 5 / 2 columns */
export const LOCKER_SHAPE_DIMENSIONS: Record<LockerShape, { rows: number; cols: number }> = {
  '3x9': { rows: 3, cols: 9 },
  '3x7': { rows: 3, cols: 7 },
  '3x5': { rows: 3, cols: 5 },
  '3x2': { rows: 3, cols: 2 },
};

/**
 * E-01 FR-003: slot numbers are auto-assigned from the shape and numbering pattern.
 * Manual numbering is not allowed, so numbering always starts at 1.
 */
export const LOCKER_SLOT_START_NUMBER = 1;

/** row/col are 1-based; row 1 = bottom row in the visual grid */
export function getSlotNumber(
  row: number,
  col: number,
  rows: number,
  cols: number,
  pattern: LockerNumberingPattern,
  startNum: number,
): number {
  switch (pattern) {
    case 'top_left_to_right':
      return (rows - row) * cols + (col - 1) + startNum;
    case 'bottom_left_to_right':
      return (row - 1) * cols + (col - 1) + startNum;
    case 'top_left_to_bottom':
      return (col - 1) * rows + (rows - row) + startNum;
    case 'top_right_to_left':
      return (rows - row) * cols + (cols - col) + startNum;
    default:
      return (rows - row) * cols + (col - 1) + startNum;
  }
}

export function formatSlotId(prefix: string, num: number): string {
  return `${prefix}-${String(num).padStart(3, '0')}`;
}

export type LockerSlotPosition = {
  slot_number: string;
  row_number: number;
  column_number: number;
  is_bottom_row: boolean;
};

export function buildLockerSlotPositions(
  prefix: string,
  shape: LockerShape,
  pattern: LockerNumberingPattern,
  startNum: number,
): LockerSlotPosition[] {
  const { rows, cols } = LOCKER_SHAPE_DIMENSIONS[shape];
  const slots: LockerSlotPosition[] = [];

  for (let row = rows; row >= 1; row -= 1) {
    for (let col = 1; col <= cols; col += 1) {
      const num = getSlotNumber(row, col, rows, cols, pattern, startNum);
      slots.push({
        slot_number: formatSlotId(prefix, num),
        row_number: row,
        column_number: col,
        is_bottom_row: row === 1,
      });
    }
  }

  return slots;
}
