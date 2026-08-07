import type {
  OptionMasterChangeHistoryItem,
  OptionMasterDetail,
  OptionMasterListItem,
  UpsertOptionMasterBody,
} from '@/app/api/_schemas/option-master.schema';

export type OptionMastersType = {
  _rows: OptionMasterDetail[];
  _changeHistory: Record<string, OptionMasterChangeHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): OptionMasterListItem[];
  getById(id: string): OptionMasterDetail | undefined;
  getByCode(code: string): OptionMasterDetail | undefined;
  getChangeHistory(id: string): OptionMasterChangeHistoryItem[];
  delete(id: string): boolean;
  add(data: UpsertOptionMasterBody): OptionMasterDetail;
  update(id: string, data: UpsertOptionMasterBody): OptionMasterDetail | undefined;
};
