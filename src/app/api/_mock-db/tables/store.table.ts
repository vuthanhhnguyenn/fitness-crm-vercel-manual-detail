import type { StoreHolidaysResponse } from '@/app/api/_schemas/lesson-schedule.schema';
import type { StoreAccessSettings } from '@/app/api/_schemas/store-access-settings.schema';
import type {
  StoreLinkedMainContract,
  StoreLinkedOption,
} from '@/app/api/_schemas/store-sales-settings.schema';
import type { Store, StoreBusinessHours } from '@/app/api/_schemas/store.schema';

import type { DbType } from '../_db.types';

export function createStoreTables(getDb: () => DbType) {
  return {
    storeMainContracts: {
      _rows: [] as Array<{ store_id: string; main_contract_id: string; linked_at: string }>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();
        getDb().mainContracts._seed();
        const seeds = [
          { store_id: 'store-001', ids: ['MC001', 'MC002', 'MC003'] },
          { store_id: 'store-002', ids: ['MC001', 'MC001-A'] },
          { store_id: 'store-006', ids: ['MC001', 'MC005'] },
        ];
        for (const seed of seeds) {
          for (const id of seed.ids) {
            this._rows.push({
              store_id: seed.store_id,
              main_contract_id: id,
              linked_at: '2024/04/01',
            });
          }
        }
      },
      listByStoreId(storeId: string): StoreLinkedMainContract[] {
        this._seed();
        getDb().mainContracts._seed();
        const masterMap = new Map(
          getDb()
            .mainContracts.getList()
            .map((item) => [item.id, item]),
        );
        return this._rows
          .filter((row) => row.store_id === storeId)
          .map((row) => {
            const master = masterMap.get(row.main_contract_id);
            if (!master) return undefined;
            return {
              id: master.id,
              name: master.name,
              contract_type: master.contract_type,
              price_including_tax: master.price_including_tax,
              linked_at: row.linked_at,
            };
          })
          .filter((item): item is StoreLinkedMainContract => Boolean(item));
      },
      addByStoreId(storeId: string, mainContractIds: string[]): StoreLinkedMainContract[] {
        this._seed();
        const current = new Set(
          this._rows.filter((row) => row.store_id === storeId).map((row) => row.main_contract_id),
        );
        const today = new Date().toLocaleDateString('ja-JP').replaceAll('-', '/');
        for (const id of mainContractIds) {
          if (current.has(id)) continue;
          this._rows.push({ store_id: storeId, main_contract_id: id, linked_at: today });
        }
        return this.listByStoreId(storeId);
      },
      removeByStoreId(storeId: string, mainContractId: string): boolean {
        this._seed();
        const before = this._rows.length;
        this._rows = this._rows.filter(
          (row) => !(row.store_id === storeId && row.main_contract_id === mainContractId),
        );
        return this._rows.length < before;
      },
    },

    storeOptions: {
      _rows: [] as Array<{ store_id: string; option_id: string; linked_at: string }>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();
        getDb().optionMasters._seed();
        const seeds = [
          { store_id: 'store-001', ids: ['OP002', 'OP003', 'OP006'] },
          { store_id: 'store-002', ids: ['OP001', 'OP007'] },
          { store_id: 'store-006', ids: ['OP021'] },
        ];
        for (const seed of seeds) {
          for (const id of seed.ids) {
            this._rows.push({ store_id: seed.store_id, option_id: id, linked_at: '2024/04/01' });
          }
        }
      },
      listByStoreId(storeId: string): StoreLinkedOption[] {
        this._seed();
        getDb().optionMasters._seed();
        const masterMap = new Map(
          getDb()
            .optionMasters.getList()
            .map((item) => [item.id, item]),
        );
        return this._rows
          .filter((row) => row.store_id === storeId)
          .map((row) => {
            const master = masterMap.get(row.option_id);
            if (!master) return undefined;
            return {
              id: master.id,
              name: master.name,
              related_option_name:
                master.option_type === 'metered'
                  ? 'パーソナル'
                  : master.option_type === 'auto_attached'
                    ? '自動付与'
                    : null,
              price_including_tax: master.price_including_tax,
            };
          })
          .filter((item): item is StoreLinkedOption => Boolean(item));
      },
      addByStoreId(storeId: string, optionIds: string[]): StoreLinkedOption[] {
        this._seed();
        const current = new Set(
          this._rows.filter((row) => row.store_id === storeId).map((row) => row.option_id),
        );
        const today = new Date().toLocaleDateString('ja-JP').replaceAll('-', '/');
        for (const id of optionIds) {
          if (current.has(id)) continue;
          this._rows.push({ store_id: storeId, option_id: id, linked_at: today });
        }
        return this.listByStoreId(storeId);
      },
      removeByStoreId(storeId: string, optionId: string): boolean {
        this._seed();
        const before = this._rows.length;
        this._rows = this._rows.filter(
          (row) => !(row.store_id === storeId && row.option_id === optionId),
        );
        return this._rows.length < before;
      },
    },

    stores: {
      _rows: [] as Store[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;

        type StoreSeedSpec = {
          name: string;
          brand: Store['brand'];
          code: string;
          pass: number;
          mutualOn: boolean;
          mutualType: Store['mutual_use_type'];
          fc?: string | null;
          contract?: NonNullable<Store['main_contract_status']>;
          closing?: string | null;
          area: Store['area'];
          operating_company_name: string;
          status: Store['status'];
        };

        const STORE_SEED_META: { c: string; u: string; cb: string; ub: string }[] = [
          { c: '2024-01-10T09:00:00Z', u: '2026-03-01T12:00:00Z', cb: 'STF-001', ub: 'STF-001' },
          { c: '2024-01-11T09:00:00Z', u: '2026-02-15T10:00:00Z', cb: 'STF-001', ub: 'STF-002' },
          { c: '2024-01-12T09:00:00Z', u: '2026-01-20T11:00:00Z', cb: 'STF-002', ub: 'STF-002' },
          { c: '2024-02-01T09:00:00Z', u: '2026-03-10T09:30:00Z', cb: 'STF-003', ub: 'STF-003' },
          { c: '2024-02-05T09:00:00Z', u: '2026-02-28T08:00:00Z', cb: 'STF-004', ub: 'STF-004' },
          { c: '2024-03-01T09:00:00Z', u: '2026-03-05T12:00:00Z', cb: 'STF-001', ub: 'STF-001' },
          { c: '2024-03-10T09:00:00Z', u: '2026-02-10T09:00:00Z', cb: 'STF-002', ub: 'STF-002' },
          { c: '2024-04-01T09:00:00Z', u: '2026-01-15T10:00:00Z', cb: 'STF-003', ub: 'STF-003' },
          { c: '2025-01-10T09:00:00Z', u: '2026-04-01T15:00:00Z', cb: 'STF-001', ub: 'STF-001' },
          { c: '2020-06-01T09:00:00Z', u: '2025-12-01T10:00:00Z', cb: 'STF-004', ub: 'STF-004' },
        ];

        const STORE_SEED_SPECS: StoreSeedSpec[] = [
          {
            name: 'Fit365八潮店',
            brand: 'fit365',
            code: 'STR-00001',
            pass: 800,
            mutualOn: true,
            mutualType: 'within_brand',
            area: 'kanto',
            operating_company_name: '株式会社ウェルネスフロンティア',
            status: 'operating',
          },
          {
            name: 'Fit365新宿店',
            brand: 'fit365',
            code: 'STR-00002',
            pass: 900,
            mutualOn: true,
            mutualType: 'cross_brand',
            area: 'kanto',
            operating_company_name: '株式会社ウェルネスフロンティア',
            status: 'operating',
          },
          {
            name: 'Fit365渋谷店',
            brand: 'fit365',
            code: 'STR-00003',
            pass: 850,
            mutualOn: false,
            mutualType: 'none',
            area: 'kanto',
            operating_company_name: '株式会社フィット365',
            status: 'operating',
          },
          {
            name: 'JOYFIT池袋店',
            brand: 'joyfit',
            code: 'STR-10004',
            pass: 1000,
            mutualOn: true,
            mutualType: 'within_brand',
            area: 'kanto',
            operating_company_name: '株式会社ジェイフィット',
            status: 'operating',
          },
          {
            name: 'JOYFIT池袋店',
            brand: 'joyfit',
            code: 'STR-10005',
            pass: 950,
            mutualOn: true,
            mutualType: 'custom',
            fc: 'fc-001',
            area: 'kanto',
            operating_company_name: 'FCワーカーズ株式会社',
            status: 'operating',
          },
          {
            name: 'JOYFIT24 新宿店',
            brand: 'joyfit24',
            code: 'TK-006',
            pass: 900,
            mutualOn: true,
            mutualType: 'within_brand',
            area: 'kanto',
            operating_company_name: '株式会社ウェルネスフロンティア',
            fc: 'fc-002',
            status: 'operating',
          },
          {
            name: 'JOYFIT YOGA 心斎橋店',
            brand: 'joyfit_yoga',
            code: 'YG-007',
            pass: 1100,
            mutualOn: true,
            mutualType: 'none',
            area: 'kansai',
            operating_company_name: '株式会社ウェルネスフロンティア',
            fc: 'fc-002',
            status: 'operating',
          },
          {
            name: 'JOYFIT+ 名古屋駅前店',
            brand: 'joyfit_plus',
            code: 'JP-008',
            pass: 950,
            mutualOn: false,
            mutualType: 'none',
            contract: 'suspended',
            fc: 'fc-002',
            area: 'chubu',
            operating_company_name: '株式会社JOYFITプラス',
            status: 'closed_temp',
          },
          {
            name: 'Fit365梅田店',
            brand: 'fit365',
            code: 'TK-009',
            pass: 850,
            mutualOn: true,
            mutualType: 'cross_brand',
            contract: 'draft',
            fc: 'fc-002',
            area: 'kansai',
            operating_company_name: '株式会社フィット365',
            status: 'preparing',
          },
          {
            name: 'ジョイフィット静岡店',
            brand: 'joyfit',
            code: 'STR-10010',
            pass: 1000,
            mutualOn: false,
            mutualType: 'none',
            contract: 'terminated',
            fc: 'fc-002',
            closing: '2025-12-31',
            area: 'other',
            operating_company_name: '株式会社ジェイフィット',
            status: 'closed_perm',
          },
        ];

        if (STORE_SEED_SPECS.length !== STORE_SEED_META.length) {
          throw new Error('STORE_SEED_SPECS and STORE_SEED_META must have the same length');
        }

        for (let i = 0; i < STORE_SEED_SPECS.length; i++) {
          const spec = STORE_SEED_SPECS[i]!;
          const meta = STORE_SEED_META[i]!;
          const n = i + 1;
          const storeKey = `store-${String(n).padStart(3, '0')}`;
          const contract = spec.contract ?? 'active';
          this._rows.push({
            id: storeKey,
            store_id: `S-${String(n).padStart(3, '0')}`,
            club_code: spec.code,
            name: spec.name,
            brand: spec.brand,
            area: spec.area,
            operating_company_name: spec.operating_company_name,
            status: spec.status,
            fc_company_id: spec.fc ?? null,
            manager_staff_id: null,
            main_contract_id: `ctr-store-${String(n).padStart(3, '0')}`,
            main_contract_status: contract,
            option_pass_price: spec.pass,
            mutual_use_enabled: spec.mutualOn,
            mutual_use_type: spec.mutualType,
            closing_date: spec.closing ?? null,
            locker_map_id: `locker-map-${String(n).padStart(3, '0')}`,
            asset_id: null,
            created_by: meta.cb,
            created_at: meta.c,
            updated_by: meta.ub,
            updated_at: meta.u,
          });
        }
      },
      getList(): Store[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): Store | undefined {
        this._seed();
        return this._rows.find((s) => s.id === id);
      },
      create(input: Omit<Store, 'id' | 'store_id' | 'created_at' | 'updated_at'>): Store {
        this._seed();
        const nextNumber = this._rows.length + 1;
        const now = new Date().toISOString();
        const row: Store = {
          ...input,
          id: `store-${String(nextNumber).padStart(3, '0')}`,
          store_id: `S-${String(nextNumber).padStart(3, '0')}`,
          created_at: now,
          updated_at: now,
        };
        this._rows.unshift(row);
        return row;
      },
      updateById(id: string, patch: Partial<Store>): Store | undefined {
        this._seed();
        const index = this._rows.findIndex((s) => s.id === id);
        if (index === -1) return undefined;
        const current = this._rows[index]!;
        const updated: Store = {
          ...current,
          ...patch,
          id: current.id,
          store_id: current.store_id,
          created_at: current.created_at,
          updated_at: new Date().toISOString(),
        };
        this._rows[index] = updated;
        return updated;
      },
      setManagerStaff(storeId: string, manager_staff_id: string | null): void {
        this._seed();
        const row = this._rows.find((s) => s.id === storeId);
        if (row) row.manager_staff_id = manager_staff_id;
      },
    },

    store_access_settings: {
      _byStoreId: {} as Record<string, StoreAccessSettings>,
      _seeded: false,
      _default(): StoreAccessSettings {
        return {
          mutual_use_enabled: true,
          start_date: '2024/04/01',
          end_date: '2027/03/31',
          under18_start_time: '10:00',
          under18_end_time: '18:00',
          permitted_stores: [
            {
              id: 'g-1',
              store_name: 'JOYFIT24新宿店',
              brand: 'joyfit24',
              setup_date: '2024/04/01',
            },
            {
              id: 'g-2',
              store_name: 'JOYFIT24渋谷店',
              brand: 'joyfit24',
              setup_date: '2024/04/01',
            },
            { id: 'g-3', store_name: 'FIT365八潮店', brand: 'fit365', setup_date: '2025/01/15' },
          ],
          joy_usage_fees: [
            { id: 'fee-1', option_name: '1日利用券（一般）', fee: 2200 },
            { id: 'fee-2', option_name: '1日利用券（学生）', fee: 1650 },
          ],
        };
      },
      _clone(data: StoreAccessSettings): StoreAccessSettings {
        return JSON.parse(JSON.stringify(data)) as StoreAccessSettings;
      },
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();
        for (const store of getDb().stores._rows) {
          this._byStoreId[store.id] = this._clone(this._default());
        }
      },
      getByStoreId(storeId: string): StoreAccessSettings | undefined {
        this._seed();
        if (!getDb().stores.getById(storeId)) return undefined;
        const row = this._byStoreId[storeId];
        return this._clone(row ?? this._default());
      },
      replaceForStore(storeId: string, data: StoreAccessSettings): StoreAccessSettings | undefined {
        this._seed();
        if (!getDb().stores.getById(storeId)) return undefined;
        const next = this._clone(data);
        this._byStoreId[storeId] = next;
        return this._clone(next);
      },
    },

    businessHours: {
      _rows: [] as StoreBusinessHours[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();
        const now = '2026-03-01T12:00:00Z';
        for (const store of getDb().stores._rows) {
          this._rows.push({
            store_id: store.id,
            default_hours: [
              { day: 'mon', open_time: '10:00', close_time: '23:00', is_closed: false },
              { day: 'tue', open_time: '10:00', close_time: '23:00', is_closed: false },
              { day: 'wed', open_time: '10:00', close_time: '23:00', is_closed: false },
              { day: 'thu', open_time: '10:00', close_time: '23:00', is_closed: false },
              { day: 'fri', open_time: '10:00', close_time: '23:00', is_closed: false },
              { day: 'sat', open_time: '10:00', close_time: '20:00', is_closed: false },
              { day: 'sun', open_time: '10:00', close_time: '18:00', is_closed: false },
              { day: 'holiday', open_time: '10:00', close_time: '18:00', is_closed: false },
            ],
            exception_hours: [
              {
                id: `exc-${store.id}-001`,
                date: '2026-12-31',
                open_time: '10:00',
                close_time: '17:00',
              },
            ],
            temporary_closures: [
              { id: `tcl-${store.id}-001`, date: '2026-03-15', reason: '設備点検' },
            ],
            updated_at: now,
            updated_by: 'STF-001',
          });
        }
      },
      getByStoreId(storeId: string): StoreBusinessHours | undefined {
        this._seed();
        return this._rows.find((r) => r.store_id === storeId);
      },
      upsert(
        storeId: string,
        patch: Partial<Omit<StoreBusinessHours, 'store_id'>>,
      ): StoreBusinessHours {
        this._seed();
        const idx = this._rows.findIndex((r) => r.store_id === storeId);
        const now = new Date().toISOString();
        if (idx === -1) {
          const row: StoreBusinessHours = {
            store_id: storeId,
            default_hours: patch.default_hours ?? [],
            exception_hours: patch.exception_hours ?? [],
            temporary_closures: patch.temporary_closures ?? [],
            updated_at: now,
            updated_by: patch.updated_by ?? 'system',
          };
          this._rows.push(row);
          return row;
        }
        const current = this._rows[idx]!;
        const updated: StoreBusinessHours = {
          ...current,
          ...patch,
          store_id: storeId,
          updated_at: now,
        };
        this._rows[idx] = updated;
        return updated;
      },
    },

    storeHolidays: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      getHolidays(_storeId: string, _from: string, _to: string): StoreHolidaysResponse {
        return { holidays: [] };
      },
    },
  };
}
