import type {
  BrandChangeHistoryItem,
  BrandDetail,
  BrandFeeGroup,
  BrandListItem,
  CreateBrandRequest,
  UpdateBrandFeeGroupRequest,
  UpdateBrandRequest,
} from '@/app/api/_schemas/brand.schema';
import type {
  CreateFranchiseCompanyBody,
  FranchiseCompanyDetail,
  FranchiseCompanyHistoryItem,
  UpdateFranchiseCompanyBody,
} from '@/app/api/_schemas/franchise-company.schema';

import {
  SEED_BRAND_CHANGE_HISTORIES,
  SEED_BRAND_FEE_GROUPS,
  SEED_BRAND_ROWS,
  cloneBrandFeeGroup,
  normalizeBrandIdentifier,
  toBrandListItem,
} from '../seeds/brand.seed';
import type { CorporateMasterRow } from '../seeds/franchise.seed';
import {
  SEED_CORPORATE_MASTERS,
  SEED_ENROLLMENT_FEE_MASTERS,
  SEED_FRANCHISE_COMPANIES,
  buildFranchiseCompanyDetail,
  buildFranchiseCompanyHistory,
} from '../seeds/franchise.seed';
import type { EnrollmentFeeMasterRow, FranchiseCompanyRow } from '../seeds/user.seed';
import { SEED_USERS } from '../seeds/user.seed';
import type { UserRow } from '../seeds/user.seed';

export function createFranchiseTables() {
  return {
    brands: {
      _rows: [] as BrandDetail[],
      _feeGroups: [] as BrandFeeGroup[],
      _changeHistories: [] as Array<BrandChangeHistoryItem & { brand_code: string }>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows.push(...SEED_BRAND_ROWS.map((b) => ({ ...b })));
        this._feeGroups.push(...SEED_BRAND_FEE_GROUPS.map(cloneBrandFeeGroup));
        this._changeHistories.push(...SEED_BRAND_CHANGE_HISTORIES.map((item) => ({ ...item })));
      },
      getList(): BrandListItem[] {
        this._seed();
        return this._rows.map(toBrandListItem);
      },
      getByCode(code: string): BrandDetail | undefined {
        this._seed();
        const normalizedCode = normalizeBrandIdentifier(code);
        return this._rows.find((row) => row.code === normalizedCode);
      },
      getByBrandId(brandId: string): BrandDetail | undefined {
        this._seed();
        const normalizedBrandId = normalizeBrandIdentifier(brandId);
        return this._rows.find((row) => row.brand_id === normalizedBrandId);
      },
      getFeesByCode(code: string): BrandFeeGroup[] {
        this._seed();
        const normalizedCode = normalizeBrandIdentifier(code);
        return this._feeGroups
          .filter((group) => group.parent_brand_code === normalizedCode)
          .map(cloneBrandFeeGroup);
      },
      getFeeGroup(code: string, subBrandCode: string): BrandFeeGroup | undefined {
        this._seed();
        const normalizedCode = normalizeBrandIdentifier(code);
        const normalizedSubBrandCode = normalizeBrandIdentifier(subBrandCode);
        const group = this._feeGroups.find(
          (item) =>
            item.parent_brand_code === normalizedCode &&
            item.sub_brand_code === normalizedSubBrandCode,
        );
        return group ? cloneBrandFeeGroup(group) : undefined;
      },
      getChangeHistoryByCode(code: string): BrandChangeHistoryItem[] {
        this._seed();
        const normalizedCode = normalizeBrandIdentifier(code);
        return this._changeHistories
          .filter((item) => item.brand_code === normalizedCode)
          .map((item) => ({
            changed_at: item.changed_at,
            changed_by: item.changed_by,
            target_display_name: item.target_display_name,
            changed_field: item.changed_field,
            before_value: item.before_value,
            after_value: item.after_value,
          }));
      },
      add(input: CreateBrandRequest): BrandDetail {
        this._seed();
        const normalizedBrandId = normalizeBrandIdentifier(input.brand_id);
        const now = new Date().toISOString();
        const row: BrandDetail = {
          brand_id: normalizedBrandId,
          code: normalizedBrandId,
          display_name: input.display_name.trim(),
          status: 'active',
          fee_group_count: 0,
          change_history_count: 0,
          created_at: now,
          updated_at: now,
          created_by: input.created_by ?? 'STF-001',
          updated_by: input.created_by ?? 'STF-001',
        };
        this._rows.push(row);
        return row;
      },
      update(code: string, patch: UpdateBrandRequest): BrandDetail | undefined {
        this._seed();
        const normalizedCode = normalizeBrandIdentifier(code);
        const idx = this._rows.findIndex((row) => row.code === normalizedCode);
        if (idx === -1) return undefined;
        const row = this._rows[idx]!;
        const next: BrandDetail = {
          ...row,
          display_name: patch.display_name?.trim() ?? row.display_name,
          brand_id: patch.brand_id ? normalizeBrandIdentifier(patch.brand_id) : row.brand_id,
          updated_by: patch.updated_by ?? row.updated_by,
          updated_at: new Date().toISOString(),
        };
        this._rows[idx] = next;
        return next;
      },
      updateFeeGroup(
        code: string,
        subBrandCode: string,
        patch: UpdateBrandFeeGroupRequest,
      ): BrandFeeGroup | undefined {
        this._seed();
        const normalizedCode = normalizeBrandIdentifier(code);
        const normalizedSubBrandCode = normalizeBrandIdentifier(subBrandCode);
        const groupIndex = this._feeGroups.findIndex(
          (item) =>
            item.parent_brand_code === normalizedCode &&
            item.sub_brand_code === normalizedSubBrandCode,
        );
        if (groupIndex === -1) return undefined;

        const group = this._feeGroups[groupIndex]!;
        const nextFeeItems = group.fee_items.map((item) => {
          const patchItem = patch.fee_items.find((entry) => entry.item_code === item.item_code);
          if (!patchItem) return item;
          return {
            ...item,
            item_name: patchItem.item_name.trim(),
            current_value_including_tax_yen: patchItem.current_value_including_tax_yen,
            effective_start_date: patchItem.effective_start_date,
          };
        });

        const nextGroup: BrandFeeGroup = { ...group, fee_items: nextFeeItems };
        this._feeGroups[groupIndex] = nextGroup;
        return cloneBrandFeeGroup(nextGroup);
      },
    },

    franchiseCompanies: {
      _rows: [] as FranchiseCompanyRow[],
      _historyById: {} as Record<string, FranchiseCompanyHistoryItem[]>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_FRANCHISE_COMPANIES.map((row) => ({ ...row }));
        this._historyById = Object.fromEntries(
          this._rows.map((row) => [row.id, buildFranchiseCompanyHistory(row)]),
        );
      },
      getList(): FranchiseCompanyRow[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): FranchiseCompanyRow | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      getHistory(id: string): FranchiseCompanyHistoryItem[] {
        this._seed();
        return [...(this._historyById[id] ?? [])];
      },
      create(input: CreateFranchiseCompanyBody): FranchiseCompanyDetail {
        this._seed();
        const maxNumericId = this._rows.reduce((max, row) => {
          const match = row.id.match(/(\d+)$/);
          const numericId = match ? Number.parseInt(match[1], 10) : Number.NaN;
          return Number.isNaN(numericId) ? max : Math.max(max, numericId);
        }, 0);
        const now = new Date().toISOString();
        const row: FranchiseCompanyRow = {
          id: `FC-${String(maxNumericId + 1).padStart(3, '0')}`,
          formal_name: input.formal_name,
          display_name: input.display_name,
          type: input.type,
          direct_owned_flag: input.direct_owned_flag,
          corporate_number: input.corporate_number ?? null,
          representative_name: input.representative_name ?? null,
          head_office_address: input.head_office_address ?? null,
          phone: input.phone ?? null,
          contact_person: input.contact_person ?? null,
          contact_phone: input.contact_phone ?? null,
          fc_contract_start_date: input.fc_contract_start_date ?? null,
          fc_contract_renewal_date: input.fc_contract_renewal_date ?? null,
          royalty_rate: input.royalty_rate ?? null,
          note: input.note ?? null,
          managed_store_count: 0,
          status: input.status,
          created_at: now,
          updated_at: now,
        };
        this._rows.unshift(row);
        this._historyById[row.id] = buildFranchiseCompanyHistory(row);
        return buildFranchiseCompanyDetail(row);
      },
      update(id: string, input: UpdateFranchiseCompanyBody): FranchiseCompanyDetail | undefined {
        this._seed();
        const current = this._rows.find((row) => row.id === id);
        if (!current) return undefined;
        const next: FranchiseCompanyRow = {
          ...current,
          formal_name:
            input.formal_name !== undefined ? input.formal_name.trim() : current.formal_name,
          display_name:
            input.display_name !== undefined ? input.display_name.trim() : current.display_name,
          type: input.type ?? current.type,
          direct_owned_flag: input.direct_owned_flag ?? current.direct_owned_flag,
          corporate_number:
            input.corporate_number !== undefined
              ? input.corporate_number
              : current.corporate_number,
          representative_name:
            input.representative_name !== undefined
              ? input.representative_name
              : current.representative_name,
          head_office_address:
            input.head_office_address !== undefined
              ? input.head_office_address
              : current.head_office_address,
          phone: input.phone !== undefined ? input.phone : current.phone,
          contact_person:
            input.contact_person !== undefined ? input.contact_person : current.contact_person,
          contact_phone:
            input.contact_phone !== undefined ? input.contact_phone : current.contact_phone,
          fc_contract_start_date:
            input.fc_contract_start_date !== undefined
              ? input.fc_contract_start_date
              : current.fc_contract_start_date,
          fc_contract_renewal_date:
            input.fc_contract_renewal_date !== undefined
              ? input.fc_contract_renewal_date
              : current.fc_contract_renewal_date,
          royalty_rate:
            input.royalty_rate !== undefined ? input.royalty_rate : current.royalty_rate,
          note: input.note !== undefined ? input.note : current.note,
          status: input.status ?? current.status,
          updated_at: new Date().toISOString(),
        };
        const nextIndex = this._rows.findIndex((row) => row.id === id);
        this._rows[nextIndex] = next;

        const changes: FranchiseCompanyHistoryItem[] = [];
        const now = next.updated_at;
        const pushChange = (changed_item: string, before: string | null, after: string | null) => {
          if (before === after) return;
          changes.unshift({ updated_at: now, operator: 'システム', changed_item, before, after });
        };
        pushChange('法人名（正式名称）', current.formal_name, next.formal_name);
        pushChange('法人名（表示名）', current.display_name, next.display_name);
        pushChange(
          '直営 / FC',
          current.type === 'fc' ? 'FC' : '直営',
          next.type === 'fc' ? 'FC' : '直営',
        );
        pushChange(
          '直営店フラグ',
          current.direct_owned_flag ? '有効' : '無効',
          next.direct_owned_flag ? '有効' : '無効',
        );
        pushChange(
          'ステータス',
          current.status === 'active' ? '有効' : '無効',
          next.status === 'active' ? '有効' : '無効',
        );
        if (input.note !== undefined) pushChange('備考', current.note, next.note);
        if (changes.length > 0)
          this._historyById[id] = [...changes, ...(this._historyById[id] ?? [])];
        return buildFranchiseCompanyDetail(next);
      },
      delete(id: string): boolean {
        this._seed();
        const currentIndex = this._rows.findIndex((row) => row.id === id);
        if (currentIndex === -1) return false;
        const current = this._rows[currentIndex]!;
        this._historyById[id] = [
          {
            updated_at: new Date().toISOString(),
            operator: 'システム',
            changed_item: '削除',
            before: current.display_name,
            after: null,
          },
          ...(this._historyById[id] ?? []),
        ];
        this._rows.splice(currentIndex, 1);
        return true;
      },
    },

    enrollmentFeeMasters: {
      _rows: [] as EnrollmentFeeMasterRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_ENROLLMENT_FEE_MASTERS];
      },
      getAll(): EnrollmentFeeMasterRow[] {
        this._seed();
        return [...this._rows];
      },
      getFiltered(brand?: string, applicationType?: string): EnrollmentFeeMasterRow[] {
        this._seed();
        return this._rows.filter((r) => {
          if (brand && r.brand !== brand && r.brand !== '共通') return false;
          if (applicationType && r.application_type !== applicationType) return false;
          return r.isActive;
        });
      },
    },

    corporateMasters: {
      _rows: [] as CorporateMasterRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_CORPORATE_MASTERS];
      },
      getAll(): CorporateMasterRow[] {
        this._seed();
        return [...this._rows];
      },
    },

    partnerCompanies: {
      _rows: [] as CorporateMasterRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_CORPORATE_MASTERS];
      },
      getAll(): CorporateMasterRow[] {
        this._seed();
        return [...this._rows];
      },
    },

    users: {
      _rows: [] as UserRow[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_USERS];
      },
      getByEmail(email: string): UserRow | undefined {
        this._seed();
        return this._rows.find((u) => u.email === email);
      },
      getById(id: string): UserRow | undefined {
        this._seed();
        return this._rows.find((u) => u.id === id);
      },
      getList(): UserRow[] {
        this._seed();
        return [...this._rows];
      },
    },
  };
}
