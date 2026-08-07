import type { BlacklistRow } from '../seeds/transfer.seed';

export type MemberBlacklistType = {
  _rows: BlacklistRow[];
  _seeded: boolean;
  _seed(): void;
  getList(): BlacklistRow[];
  getById(id: string): BlacklistRow | undefined;
  create(input: Omit<BlacklistRow, 'id' | 'registeredAt'>): BlacklistRow;
};
