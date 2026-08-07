import type { Position } from '@/app/api/_schemas/position.schema';

export type PositionsType = {
  _rows: Position[];
  _seeded: boolean;
  _seed(): void;
  getList(): Position[];
  getById(id: number): Position | undefined;
};
