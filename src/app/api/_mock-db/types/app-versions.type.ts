import type {
  AppVersionRecord,
  CreateAppVersionBody,
  UpdateAppVersionBody,
} from '../../_schemas/app-version.schema';

export type AppVersionMockRow = AppVersionRecord & {
  deletedAt: string | null;
};

export type AppVersionsType = {
  _rows: AppVersionMockRow[];
  _seeded: boolean;
  _seed(): void;
  getList(): AppVersionRecord[];
  getById(id: string): AppVersionRecord | null;
  softDelete(id: string): boolean;
  create(data: CreateAppVersionBody): AppVersionRecord;
  update(id: string, data: UpdateAppVersionBody): AppVersionRecord | null;
};
