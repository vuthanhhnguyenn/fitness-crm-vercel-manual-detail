import type { TransferRow } from '../seeds/transfer.seed';

export type TransfersType = {
  _rows: TransferRow[];
  getAll(): TransferRow[];
  getById(id: string): TransferRow | undefined;
  create(input: {
    member_id: string;
    member_name: string;
    from_store_id: string;
    from_store_name: string;
    to_store_id: string;
    to_store_name: string;
    brand: string;
    reason?: string;
  }): TransferRow;
  approve(id: string, comment?: string): TransferRow | undefined;
  reject(id: string, comment?: string): TransferRow | undefined;
};
