import type {
  AppVersionRecord,
  CreateAppVersionBody,
  UpdateAppVersionBody,
} from '../../_schemas/app-version.schema';
import { SEED_APP_VERSIONS } from '../seeds/app-version.seed';
import type { AppVersionMockRow } from '../types/app-versions.type';

// Same placeholder staff id used throughout app-version.seed.ts's createdBy/updatedBy fields
const MOCK_CURRENT_STAFF_ID = '01912d4e-8b4c-7d9e-af1a-2b3c4d5e6f01';

function toRecord(row: AppVersionMockRow): AppVersionRecord {
  return {
    id: row.id,
    brandEnum: row.brandEnum,
    iosVersionName: row.iosVersionName,
    iosBuildNumber: row.iosBuildNumber,
    androidVersionName: row.androidVersionName,
    androidBuildNumber: row.androidBuildNumber,
    releaseDate: row.releaseDate,
    remarks: row.remarks,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createAppVersionTables() {
  return {
    appVersions: {
      _rows: [] as AppVersionMockRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_APP_VERSIONS.map((row) => ({ ...row }));
      },
      getList(): AppVersionRecord[] {
        this._seed();
        return this._rows.filter((row) => row.deletedAt === null).map(toRecord);
      },
      getById(id: string): AppVersionRecord | null {
        this._seed();
        const row = this._rows.find((row) => row.id === id && row.deletedAt === null);
        return row ? toRecord(row) : null;
      },
      softDelete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id && row.deletedAt === null);
        if (index === -1) return false;
        this._rows[index] = {
          ...this._rows[index],
          deletedAt: new Date().toISOString(),
        };
        return true;
      },
      create(data: CreateAppVersionBody): AppVersionRecord {
        this._seed();
        const now = new Date().toISOString();
        const row: AppVersionMockRow = {
          id: crypto.randomUUID(),
          brandEnum: data.brandEnum,
          iosVersionName: data.iosVersionName,
          iosBuildNumber: data.iosBuildNumber,
          androidVersionName: data.androidVersionName,
          androidBuildNumber: data.androidBuildNumber,
          releaseDate: data.releaseDate,
          remarks: data.remarks ?? null,
          createdBy: MOCK_CURRENT_STAFF_ID,
          updatedBy: null,
          createdAt: now,
          updatedAt: null,
          deletedAt: null,
        };
        this._rows.push(row);
        return toRecord(row);
      },
      update(id: string, data: UpdateAppVersionBody): AppVersionRecord | null {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id && row.deletedAt === null);
        if (index === -1) return null;
        const current = this._rows[index];
        this._rows[index] = {
          ...current,
          ...(data.brandEnum !== undefined && { brandEnum: data.brandEnum }),
          ...(data.iosVersionName !== undefined && { iosVersionName: data.iosVersionName }),
          ...(data.iosBuildNumber !== undefined && { iosBuildNumber: data.iosBuildNumber }),
          ...(data.androidVersionName !== undefined && {
            androidVersionName: data.androidVersionName,
          }),
          ...(data.androidBuildNumber !== undefined && {
            androidBuildNumber: data.androidBuildNumber,
          }),
          ...(data.releaseDate !== undefined && { releaseDate: data.releaseDate }),
          ...(data.remarks !== undefined && { remarks: data.remarks }),
          updatedBy: MOCK_CURRENT_STAFF_ID,
          updatedAt: new Date().toISOString(),
        };
        return toRecord(this._rows[index]);
      },
    },
  };
}
