import type { ToolType } from '@/app/api/_schemas/training-equipment.schema';

import type { ToolTypeMockRow } from '../seeds/training-equipment.seed';

export type ToolTypesType = {
  _rows: ToolTypeMockRow[];
  _seeded: boolean;
  _seed(): void;
  list(options?: { includeNone?: boolean; includeInactive?: boolean }): ToolType[];
  getByCode(code: string): ToolTypeMockRow | undefined;
};
