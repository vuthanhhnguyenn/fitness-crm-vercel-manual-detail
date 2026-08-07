import type { UserRow } from '../seeds/user.seed';

export type UsersType = {
  _rows: UserRow[];
  _seeded: boolean;
  _seed(): void;
  getByEmail(email: string): UserRow | undefined;
  getById(id: string): UserRow | undefined;
  getList(): UserRow[];
};
