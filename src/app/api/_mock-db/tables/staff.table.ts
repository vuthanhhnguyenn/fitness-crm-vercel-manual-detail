import type { StaffPermissionRecord } from '@/app/api/_schemas/position.schema';
import type {
  CreateStaffsItem,
  StaffDetail,
  StaffLinkage,
  StaffListItem,
  StaffPermissionHistoryEntry,
} from '@/app/api/_schemas/staff.schema';

import type { DbType } from '../_db.types';
import { staffBrandDisplayName } from '../seeds/brand.seed';
import { defaultPositionIdByRole, positionNameById } from '../seeds/position.seed';

// Module-level variables shared between staff_permissions and staffs tables
const permissionRows: StaffPermissionRecord[] = [];
let nextStaffPermissionId = 1;

// Module-level storage for permission change history (append-only)
const permissionHistoryRows: StaffPermissionHistoryEntry[] = [];
let nextPermissionHistoryId = 1;

function pushStaffPermissions(staffId: string, codes: string[]): void {
  for (const permission_code of codes) {
    permissionRows.push({ id: nextStaffPermissionId++, staff_id: staffId, permission_code });
  }
}

export function createStaffTables(getDb: () => DbType) {
  return {
    staff_permissions: {
      getByStaffId(staff_id: string): StaffPermissionRecord[] {
        return permissionRows.filter((r) => r.staff_id === staff_id);
      },
      removeForStaff(staff_id: string): void {
        for (let j = permissionRows.length - 1; j >= 0; j--) {
          if (permissionRows[j]!.staff_id === staff_id) permissionRows.splice(j, 1);
        }
      },
      replaceForStaff(staff_id: string, rows: Array<{ permission_code: string }>): void {
        this.removeForStaff(staff_id);
        for (const r of rows) {
          permissionRows.push({
            id: nextStaffPermissionId++,
            staff_id,
            permission_code: r.permission_code,
          });
        }
      },
    },

    staffs: {
      _staffs: [] as StaffListItem[],
      _details: {} as Record<string, StaffDetail>,
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;

        getDb().positions._seed();
        getDb().stores._seed();
        getDb().brands._seed();
        const seededStores = getDb().stores._rows;

        const lastNames = [
          { kanji: '田中', kana: 'タナカ' },
          { kanji: '佐藤', kana: 'サトウ' },
          { kanji: '鈴木', kana: 'スズキ' },
          { kanji: '高橋', kana: 'タカハシ' },
          { kanji: '渡辺', kana: 'ワタナベ' },
          { kanji: '伊藤', kana: 'イトウ' },
          { kanji: '山本', kana: 'ヤマモト' },
          { kanji: '中村', kana: 'ナカムラ' },
          { kanji: '小林', kana: 'コバヤシ' },
          { kanji: '林', kana: 'ハヤシ' },
          { kanji: '山田', kana: 'ヤマダ' },
          { kanji: '松本', kana: 'マツモト' },
          { kanji: '井上', kana: 'イノウエ' },
          { kanji: '木村', kana: 'キムラ' },
          { kanji: '清水', kana: 'シミズ' },
        ];
        const firstNames = [
          { kanji: '太郎', kana: 'タロウ', gender: 'male' as const },
          { kanji: '花子', kana: 'ハナコ', gender: 'female' as const },
          { kanji: '一郎', kana: 'イチロウ', gender: 'male' as const },
          { kanji: '美咲', kana: 'ミサキ', gender: 'female' as const },
          { kanji: '健太', kana: 'ケンタ', gender: 'male' as const },
          { kanji: 'さくら', kana: 'サクラ', gender: 'female' as const },
          { kanji: '大輔', kana: 'ダイスケ', gender: 'male' as const },
          { kanji: 'あゆみ', kana: 'アユミ', gender: 'female' as const },
          { kanji: '翔太', kana: 'ショウタ', gender: 'male' as const },
          { kanji: '愛', kana: 'アイ', gender: 'female' as const },
          { kanji: '拓也', kana: 'タクヤ', gender: 'male' as const },
          { kanji: '由美', kana: 'ユミ', gender: 'female' as const },
        ];
        const domains = ['joyfit.co.jp', 'fit365.co.jp', 'joyfit24.co.jp'];
        const roles = ['headquarter', 'manager', 'staff', 'trainer', 'observer', 'system'] as const;
        const brands = [
          'all',
          'joyfit',
          'fit365',
          'joyfit24',
          'joyfit_yoga',
          'joyfit_plus',
        ] as const;
        const prefectures = [
          '東京都',
          '大阪府',
          '愛知県',
          '北海道',
          '福岡県',
          '神奈川県',
          '埼玉県',
          '千葉県',
          '兵庫県',
          '京都府',
        ];
        const cities = [
          '新宿区新宿',
          '渋谷区渋谷',
          '中央区日本橋',
          '港区六本木',
          '千代田区丸の内',
          '豊島区池袋',
          '台東区上野',
          '墨田区錦糸',
          '品川区大崎',
          '目黒区自由が丘',
        ];

        for (let i = 1; i <= 200; i++) {
          const ln = lastNames[i % lastNames.length]!;
          const fn = firstNames[i % firstNames.length]!;
          const fullName = `${ln.kanji} ${fn.kanji}`;
          const role = roles[i % roles.length]!;
          const brand = role === 'headquarter' ? 'all' : brands[(i + 1) % brands.length]!;
          const isInvited = i % 21 === 0;
          const status: StaffListItem['status'] = isInvited
            ? 'invited'
            : i % 7 === 0
              ? 'inactive'
              : 'active';
          const domain = domains[i % domains.length]!;
          const emailName = ln.kanji.toLowerCase().replace(/[^a-z]/g, '');
          const email = `${emailName}${i}@${domain}`;

          const now = new Date('2026-03-25T18:00:00');
          const daysAgo = status === 'inactive' ? 30 + (i % 60) : i % 10;
          const loginDate = new Date(now);
          loginDate.setDate(loginDate.getDate() - daysAgo);
          loginDate.setHours(8 + (i % 10), (i * 7) % 60, 0, 0);
          const lastLogin = isInvited ? null : loginDate.toISOString();
          const invitedDate = new Date(now);
          invitedDate.setDate(invitedDate.getDate() - (i % 15));
          const invited_at = isInvited ? invitedDate.toISOString() : null;
          const managed_store_ids =
            role === 'manager'
              ? [
                  seededStores[i % seededStores.length]!.id,
                  seededStores[(i + 1) % seededStores.length]!.id,
                ]
              : undefined;
          const note = i % 4 === 0 ? `${i}番目のスタッフに関するメモ。` : null;

          const birthYear = 1970 + (i % 35);
          const birthMonth = ((i * 3) % 12) + 1;
          const birthDay = ((i * 7) % 28) + 1;
          const birthday = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;

          const createdDate = new Date('2024-01-01T00:00:00Z');
          createdDate.setDate(createdDate.getDate() + (i % 365));
          const updatedDate = new Date(createdDate);
          updatedDate.setDate(updatedDate.getDate() + 30 + (i % 200));

          const postalCode = `${String(100 + (i % 900)).padStart(3, '0')}-${String(1000 + (i % 9000)).padStart(4, '0')}`;
          const pickStore = seededStores[(i - 1) % seededStores.length]!;
          const useFcLinkage = i % 5 === 0;
          const position_id = useFcLinkage
            ? 10
            : role === 'headquarter'
              ? 1
              : role === 'observer'
                ? 13
                : 5 + (i % 6);
          const position_name = positionNameById(position_id);

          const staff_linkage = useFcLinkage
            ? ({
                type: 'fc_company',
                fc_company_id: 'fc-001',
                fc_company_name: 'サンプルFC株式会社',
              } satisfies StaffDetail['staff_linkage'])
            : ({
                type: 'direct_store',
                store_id: pickStore.id,
                store_name: pickStore.name,
              } satisfies StaffDetail['staff_linkage']);

          const permCodes = useFcLinkage
            ? ['Y-03.view', 'crm.stores.read', 'crm.members.view', 'G-01.contracts.view']
            : ['crm.members.view', 'crm.members.edit', 'G-01.contracts.view', 'crm.billing.view'];
          pushStaffPermissions(String(i), permCodes);
          const staff_permissions = permissionRows.filter((r) => r.staff_id === String(i));

          this._staffs.push({
            id: String(i),
            staff_id: `STF-${String(i).padStart(3, '0')}`,
            name: fullName,
            email,
            position_id,
            position_name,
            role,
            brand,
            brand_display_name: staffBrandDisplayName(brand),
            linkage_type: staff_linkage.type,
            linked_store_id:
              staff_linkage.type === 'direct_store' ? staff_linkage.store_id : undefined,
            linked_store_name:
              staff_linkage.type === 'direct_store' ? staff_linkage.store_name : undefined,
            linked_fc_company_id:
              staff_linkage.type === 'fc_company' ? staff_linkage.fc_company_id : undefined,
            linked_fc_company_name:
              staff_linkage.type === 'fc_company' ? staff_linkage.fc_company_name : undefined,
            status,
            last_login: lastLogin,
            invited_at,
            managed_store_ids,
            deleted_at: null,
          } satisfies StaffListItem);

          const scopeCount = role === 'headquarter' ? 1 : 1 + (i % 3);
          const scopes: StaffDetail['editable_scopes'] = [];
          for (let s = 0; s < scopeCount; s++) {
            const scopeBrand =
              role === 'headquarter' ? 'all' : brands[(i + s + 1) % brands.length]!;
            const scopeTarget =
              role === 'headquarter' ? 'all_stores' : s === 0 ? 'all_stores' : 'specific_store';
            const startDate = new Date('2024-04-01');
            startDate.setMonth(startDate.getMonth() + s);
            const storeIdx = (i + s) % seededStores.length;
            const scopeStore = seededStores[storeIdx]!;
            scopes.push({
              brand: scopeBrand as StaffDetail['editable_scopes'][number]['brand'],
              target: scopeTarget as StaffDetail['editable_scopes'][number]['target'],
              store_id: scopeTarget === 'specific_store' ? scopeStore.id : undefined,
              store_name: scopeTarget === 'specific_store' ? scopeStore.name : undefined,
              start_date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
              end_date: i % 5 === 0 ? '2025-03-31' : undefined,
            });
          }

          this._details[String(i)] = {
            id: String(i),
            staff_id: `STF-${String(i).padStart(3, '0')}`,
            position_id,
            role,
            brand,
            brand_display_name: staffBrandDisplayName(brand),
            status,
            personal_info: {
              last_name: ln.kanji,
              first_name: fn.kanji,
              last_name_kana: ln.kana,
              first_name_kana: fn.kana,
              gender: fn.gender,
              birthday,
              phone: `090${String(1000 + (i % 9000)).padStart(4, '0')}${String(1000 + ((i * 3) % 9000)).padStart(4, '0')}`,
              email,
              postal_code: postalCode,
              prefecture: prefectures[i % prefectures.length]!,
              city: cities[i % cities.length]!,
              address: `${(i % 10) + 1}-${(i % 20) + 1}-${(i % 30) + 1}`,
              building: i % 3 === 0 ? `ビル${i}号 ${(i % 10) + 1}F` : undefined,
            },
            login_settings: {
              login_method: i % 5 === 0 ? 'social' : 'email',
              social_id: i % 5 === 0 ? `social_${i}` : undefined,
            },
            permission_settings: {
              role,
              additional_permissions: {
                billing_correction: role === 'headquarter' || i % 3 === 0,
                refund_request: role === 'headquarter' || i % 4 === 0,
                transfer_request: role === 'headquarter' && i % 2 === 0,
              },
            },
            staff_linkage,
            staff_permissions,
            editable_scopes: scopes,
            last_login: lastLogin,
            invited_at,
            managed_store_ids,
            deleted_at: null,
            note,
            created_at: createdDate.toISOString(),
            updated_at: updatedDate.toISOString(),
          } satisfies StaffDetail;
        }

        getDb().stores.setManagerStaff('store-001', '1');
        getDb().stores.setManagerStaff('store-005', '5');

        const seedHistory = (
          staff_id: string,
          changed_at: string,
          change_description: string,
          operator_name: string,
          operator_position: string,
        ): void => {
          permissionHistoryRows.push({
            id: nextPermissionHistoryId++,
            staff_id,
            changed_at,
            operator_name,
            operator_position,
            change_description,
          });
        };
        seedHistory(
          '13',
          '2026-01-15T10:20:00+09:00',
          '職位変更: 正社員スタッフ → ブロック長',
          '田中 太郎',
          '本部管理者',
        );
        seedHistory(
          '13',
          '2026-02-03T16:45:00+09:00',
          '所属変更: 東京本店 → 新宿区新宿店',
          '田中 太郎',
          '本部管理者',
        );
        seedHistory(
          '13',
          '2026-03-10T09:05:00+09:00',
          'ロール変更: スタッフ → マネージャー',
          '田中 太郎',
          '本部管理者',
        );
      },

      getList(): StaffListItem[] {
        this._seed();
        return this._staffs.filter((s) => !s.deleted_at);
      },
      getById(id: string): StaffListItem | undefined {
        this._seed();
        return this._staffs.find((s) => s.id === id && !s.deleted_at);
      },
      getDetailById(id: string): StaffDetail | undefined {
        this._seed();
        const detail = this._details[id];
        return detail && !detail.deleted_at ? detail : undefined;
      },
      updateDetail(id: string, patch: Partial<StaffDetail>): StaffDetail | undefined {
        this._seed();
        const existing = this._details[id];
        if (!existing) return undefined;

        if (patch.staff_permissions) {
          getDb().staff_permissions.replaceForStaff(
            id,
            patch.staff_permissions.map((p) => ({ permission_code: p.permission_code })),
          );
        }

        const resolvedLinkage = patch.staff_linkage
          ? patch.staff_linkage.type === 'direct_store'
            ? ({
                type: 'direct_store',
                store_id: patch.staff_linkage.store_id,
                store_name:
                  patch.staff_linkage.store_name ??
                  getDb().stores.getById(patch.staff_linkage.store_id ?? '')?.name,
              } satisfies StaffDetail['staff_linkage'])
            : ({
                type: 'fc_company',
                fc_company_id: patch.staff_linkage.fc_company_id,
                fc_company_name:
                  patch.staff_linkage.fc_company_name ??
                  getDb().franchiseCompanies.getById(patch.staff_linkage.fc_company_id ?? '')
                    ?.display_name,
              } satisfies StaffDetail['staff_linkage'])
          : existing.staff_linkage;
        const position_id = patch.position_id ?? existing.position_id;
        const role = patch.role ?? existing.role;
        const nextBrand = (patch.brand ?? existing.brand ?? 'all') as StaffDetail['brand'];
        const staff_permissions = patch.staff_permissions
          ? permissionRows.filter((r) => r.staff_id === id)
          : existing.staff_permissions;

        const updated: StaffDetail = {
          ...existing,
          ...patch,
          role,
          position_id,
          brand: nextBrand,
          brand_display_name: staffBrandDisplayName(nextBrand),
          personal_info: patch.personal_info
            ? { ...existing.personal_info, ...patch.personal_info }
            : existing.personal_info,
          login_settings: patch.login_settings
            ? { ...existing.login_settings, ...patch.login_settings }
            : existing.login_settings,
          permission_settings: patch.permission_settings
            ? {
                ...existing.permission_settings,
                ...patch.permission_settings,
                additional_permissions: patch.permission_settings.additional_permissions
                  ? {
                      ...existing.permission_settings.additional_permissions,
                      ...patch.permission_settings.additional_permissions,
                    }
                  : existing.permission_settings.additional_permissions,
              }
            : existing.permission_settings,
          staff_linkage: resolvedLinkage,
          staff_permissions,
          editable_scopes: patch.editable_scopes ?? existing.editable_scopes,
          updated_at: new Date().toISOString(),
        };
        this._details[id] = updated;

        const listIdx = this._staffs.findIndex((s) => s.id === id);
        if (listIdx !== -1) {
          this._staffs[listIdx] = {
            ...this._staffs[listIdx],
            name: `${updated.personal_info.last_name} ${updated.personal_info.first_name}`,
            email: updated.personal_info.email,
            position_id: updated.position_id,
            position_name: positionNameById(updated.position_id),
            role: updated.permission_settings.role,
            brand: updated.brand,
            brand_display_name: updated.brand_display_name,
            linkage_type: updated.staff_linkage.type,
            linked_store_id:
              updated.staff_linkage.type === 'direct_store'
                ? updated.staff_linkage.store_id
                : undefined,
            linked_store_name:
              updated.staff_linkage.type === 'direct_store'
                ? updated.staff_linkage.store_name
                : undefined,
            linked_fc_company_id:
              updated.staff_linkage.type === 'fc_company'
                ? updated.staff_linkage.fc_company_id
                : undefined,
            linked_fc_company_name:
              updated.staff_linkage.type === 'fc_company'
                ? updated.staff_linkage.fc_company_name
                : undefined,
            status: updated.status,
          };
        }
        return updated;
      },
      createBatch(input: {
        staff: CreateStaffsItem[];
        role: StaffListItem['role'];
        position_id?: number;
        staff_linkage?: StaffLinkage;
        note?: string;
      }): StaffListItem[] {
        this._seed();
        getDb().positions._seed();
        getDb().stores._seed();

        const position_id = input.position_id ?? defaultPositionIdByRole(input.role);
        const defaultStore = getDb().stores._rows[0]!;
        const staff_linkage: StaffDetail['staff_linkage'] = input.staff_linkage ?? {
          type: 'direct_store',
          store_id: defaultStore.id,
          store_name: defaultStore.name,
        };
        const now = new Date().toISOString();

        const created: StaffListItem[] = [];
        for (const row of input.staff) {
          const nextId = this._staffs.length + 1;
          pushStaffPermissions(String(nextId), ['crm.login', 'crm.members.view']);
          const staff_permissions = permissionRows.filter((r) => r.staff_id === String(nextId));

          const staff: StaffListItem = {
            id: String(nextId),
            staff_id: `STF-${String(nextId).padStart(3, '0')}`,
            name: `${row.last_name} ${row.first_name}`,
            email: row.email,
            position_id,
            position_name: positionNameById(position_id),
            role: input.role,
            brand: 'all',
            brand_display_name: staffBrandDisplayName('all'),
            linkage_type: staff_linkage.type,
            linked_store_id:
              staff_linkage.type === 'direct_store' ? staff_linkage.store_id : undefined,
            linked_store_name:
              staff_linkage.type === 'direct_store' ? staff_linkage.store_name : undefined,
            linked_fc_company_id:
              staff_linkage.type === 'fc_company' ? staff_linkage.fc_company_id : undefined,
            linked_fc_company_name:
              staff_linkage.type === 'fc_company' ? staff_linkage.fc_company_name : undefined,
            status: 'invited',
            last_login: null,
            invited_at: now,
            managed_store_ids: input.role === 'manager' ? [] : undefined,
            deleted_at: null,
          };
          this._staffs.push(staff);

          this._details[String(nextId)] = {
            id: String(nextId),
            staff_id: staff.staff_id,
            position_id,
            role: input.role,
            brand: 'all',
            brand_display_name: staffBrandDisplayName('all'),
            status: 'invited',
            personal_info: {
              last_name: row.last_name,
              first_name: row.first_name,
              email: row.email,
            },
            login_settings: { login_method: 'email' },
            permission_settings: {
              role: input.role,
              additional_permissions: {
                billing_correction: false,
                refund_request: false,
                transfer_request: false,
              },
            },
            staff_linkage,
            staff_permissions,
            editable_scopes: [
              {
                brand: 'all',
                target: 'all_stores',
                start_date: now.split('T')[0]!,
              },
            ],
            last_login: null,
            invited_at: now,
            managed_store_ids: input.role === 'manager' ? [] : undefined,
            deleted_at: null,
            note: input.note ?? null,
            created_at: now,
            updated_at: now,
          } satisfies StaffDetail;

          created.push(staff);
        }

        return created;
      },
      softDelete(id: string): boolean {
        this._seed();
        const detail = this._details[id];
        if (!detail) return false;
        const now = new Date().toISOString();
        this._details[id] = { ...detail, deleted_at: now, updated_at: now };
        const listIdx = this._staffs.findIndex((s) => s.id === id);
        if (listIdx !== -1) {
          this._staffs[listIdx] = { ...this._staffs[listIdx]!, deleted_at: now };
        }
        return true;
      },
      deactivate(
        id: string,
        reason: string | undefined,
        operator: { name: string; position: string },
      ): StaffDetail | undefined {
        this._seed();
        const existing = this._details[id];
        if (!existing) return undefined;
        const now = new Date().toISOString();
        const updated: StaffDetail = { ...existing, status: 'inactive', updated_at: now };
        this._details[id] = updated;
        const listIdx = this._staffs.findIndex((s) => s.id === id);
        if (listIdx !== -1) {
          this._staffs[listIdx] = { ...this._staffs[listIdx]!, status: 'inactive' };
        }
        this.recordPermissionChange(
          id,
          reason ? `アカウント無効化: ${reason}` : 'アカウント無効化',
          operator,
        );
        return updated;
      },
      activate(id: string, operator: { name: string; position: string }): StaffDetail | undefined {
        this._seed();
        const existing = this._details[id];
        if (!existing) return undefined;
        const now = new Date().toISOString();
        const updated: StaffDetail = { ...existing, status: 'active', updated_at: now };
        this._details[id] = updated;
        const listIdx = this._staffs.findIndex((s) => s.id === id);
        if (listIdx !== -1) {
          this._staffs[listIdx] = { ...this._staffs[listIdx]!, status: 'active' };
        }
        this.recordPermissionChange(id, 'アカウント有効化', operator);
        return updated;
      },
      resendInvite(id: string): StaffDetail | undefined {
        this._seed();
        const existing = this._details[id];
        if (!existing || existing.status !== 'invited') return undefined;
        const now = new Date().toISOString();
        const updated: StaffDetail = { ...existing, invited_at: now, updated_at: now };
        this._details[id] = updated;
        const listIdx = this._staffs.findIndex((s) => s.id === id);
        if (listIdx !== -1) {
          this._staffs[listIdx] = { ...this._staffs[listIdx]!, invited_at: now };
        }
        return updated;
      },
      recordPermissionChange(
        staff_id: string,
        change_description: string,
        operator: { name: string; position: string },
      ): void {
        permissionHistoryRows.push({
          id: nextPermissionHistoryId++,
          staff_id,
          changed_at: new Date().toISOString(),
          operator_name: operator.name,
          operator_position: operator.position,
          change_description,
        });
      },
      getPermissionHistory(staff_id: string): StaffPermissionHistoryEntry[] {
        return permissionHistoryRows
          .filter((r) => r.staff_id === staff_id)
          .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
      },
    },
  };
}
