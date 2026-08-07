import type {
  CreateLockerContractRequest,
  LockerContractChangeHistoryItem,
  LockerContractDetail,
  LockerContractListItem,
  UpdateLockerContractRequest,
} from '@/app/api/_schemas/locker.schema';

export type LockerContractsType = {
  _rows: LockerContractListItem[];
  _seeded: boolean;
  _detailMetaById: Record<
    string,
    {
      member_phone: string;
      member_email: string;
      termination_date: string | null;
      password_updated_at: string | null;
      created_at: string;
      updated_at: string;
    }
  >;
  _changeHistoryById: Record<string, LockerContractChangeHistoryItem[]>;
  _seed(): void;
  getList(): LockerContractListItem[];
  getById(id: string): LockerContractDetail | undefined;
  getChangeHistory(id: string): LockerContractChangeHistoryItem[];
  cancel(
    id: string,
    terminationDate: string,
  ): { termination_date: string; status: LockerContractListItem['status'] } | null;
  listByLockerId(lockerId: string): LockerContractListItem[];
  deleteByLockerId(lockerId: string): void;
  releaseByLockerNumber(lockerId: string, lockerNumber: string): boolean;
  create(
    input: CreateLockerContractRequest,
  ): { ok: true; contract: LockerContractDetail } | { ok: false; error: string; status: number };
  update(
    id: string,
    patch: UpdateLockerContractRequest,
  ): { ok: true; contract: LockerContractDetail } | { ok: false; error: string; status: number };
};
