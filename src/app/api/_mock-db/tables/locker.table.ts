import type {
  CreateLockerContractRequest,
  CreateLockerRequest,
  LockerContractChangeHistoryItem,
  LockerContractDetail,
  LockerContractListItem,
  LockerDetail,
  LockerHistoryItem,
  LockerListItem,
  LockerLockType,
  LockerNumberingPattern,
  LockerOptionMasterRef,
  LockerOptionType,
  LockerPendingSlotListItem,
  LockerReminderNotification,
  LockerSlotItem,
  LockerSlotOpenType,
  UpdateLockerContractRequest,
  UpdateLockerRequest,
} from '@/app/api/_schemas/locker.schema';
import {
  type LockerSlotLockSettingsMeta,
  applySlotLockSettings,
  collectSlotLockSettings,
  formatLockerTimestamp,
} from '@/app/api/crm/lockers/_utils/locker-slot-lock-settings.util';
import {
  LOCKER_SHAPE_DIMENSIONS,
  buildLockerSlotPositions,
  buildNumberingPatternLabel,
  getLockerSlotCount,
} from '@/app/api/crm/lockers/_utils/locker-slot-numbering.util';

import type { DbType } from '../_db.types';
import type { LockerDetailSeedMeta } from '../seeds/locker.seed';
import {
  LOCKER_CONTRACT_TYPE_DESCRIPTIONS,
  computeLockerContractEndDate,
  normalizeLockerDate,
  parseLockerSize,
  resolveLockerContractTypeFromCode,
  toLockerOptionRef,
} from '../seeds/locker.seed';

void LOCKER_CONTRACT_TYPE_DESCRIPTIONS;
void (toLockerOptionRef as unknown);
void (parseLockerSize as unknown);

export function createLockerTables(getDb: () => DbType) {
  return {
    lockers: {
      _rows: [] as LockerListItem[],
      _detailMetaById: {} as Record<string, LockerDetailSeedMeta>,
      _historyByLockerId: {} as Record<string, LockerHistoryItem[]>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();

        const seedSpecs = [
          {
            id: 'locker-001',
            locker_id: 'LK-001',
            store_id: 'store-006',
            area: '1F 男性更衣室',
            shape: '3x9',
            option_type: 'premium',
            slots: 27,
            available_slots: 17,
            in_use_slots: 10,
            numbering_pattern: 'A-001〜A-027',
          },
          {
            id: 'locker-002',
            locker_id: 'LK-002',
            store_id: 'store-001',
            area: '1F 女性更衣室',
            shape: '3x6',
            option_type: 'standard',
            slots: 18,
            available_slots: 16,
            in_use_slots: 2,
            numbering_pattern: 'B-001〜B-018',
          },
          {
            id: 'locker-003',
            locker_id: 'LK-003',
            store_id: 'store-009',
            area: '2F トレーニングエリア',
            shape: '2x10',
            option_type: 'none',
            slots: 20,
            available_slots: 19,
            in_use_slots: 1,
            numbering_pattern: 'C-001〜C-020',
          },
          {
            id: 'locker-004',
            locker_id: 'LK-004',
            store_id: 'store-008',
            area: '1F エントランス',
            shape: '2x4',
            option_type: 'none',
            slots: 8,
            available_slots: 5,
            in_use_slots: 3,
            numbering_pattern: 'F-001〜F-008',
          },
        ] satisfies Array<Omit<LockerListItem, 'store_name'>>;

        this._rows = seedSpecs.map((row) => {
          const store = getDb().stores._rows.find((storeRow) => storeRow.id === row.store_id);
          if (!store) {
            throw new Error(`Store not found for locker seed: ${row.store_id}`);
          }
          return { ...row, store_name: store.name };
        });

        this._detailMetaById = {
          'locker-001': {
            option_contract_code: 'LK-3x9-PREMIUM-001',
            contract_type_code: 'LK-3x9-PREMIUM-001',
            guide_text: '更衣室入口から右手奥、男性専用エリアの隣',
            note: '1F男性更衣室入口付近に設置。プレミアムロッカーとして契約可能。',
            image_url: null,
            created_at: '2025/01/15 10:00',
            updated_at: '2026/03/10 09:00',
            slot_prefix: 'A',
            slot_columns: 9,
            slot_numbering_pattern: 'top_left_to_right' as LockerNumberingPattern,
            start_number: 1,
            default_slot_size: { width_cm: 35, height_cm: 40, depth_cm: 50 },
            default_open_type: 'door' as LockerSlotOpenType,
            default_lock_type: 'dial' as LockerLockType,
            slot_size_by_slot: {},
            open_type_by_slot: {},
            lock_type_by_slot: {
              'A-001': 'dial',
              'A-002': 'dial',
              'A-003': 'dial',
              'A-004': 'dial',
              'A-005': 'dial',
              'A-006': 'cylinder',
              'A-007': 'dial',
              'A-008': 'cylinder',
              'A-009': 'dial',
              'A-010': 'dial',
              'A-011': 'dial',
              'A-012': 'dial',
              'A-013': 'dial',
              'A-014': 'cylinder',
              'A-015': 'dial',
              'A-016': 'dial',
              'A-017': 'dial',
              'A-018': 'dial',
              'A-019': 'dial',
              'A-020': 'dial',
              'A-021': 'dial',
              'A-022': 'dial',
              'A-023': 'dial',
              'A-024': 'dial',
              'A-025': 'dial',
              'A-026': 'dial',
              'A-027': 'dial',
            },
            password_by_slot: {
              'A-002': '3847',
              'A-004': '5192',
              'A-007': '7024',
              'A-009': '6831',
              'A-011': '2956',
              'A-012': '4173',
              'A-015': '8405',
              'A-018': '1268',
              'A-021': '9637',
              'A-025': '5480',
            },
            contract_type_code_by_slot: {
              'A-002': 'LK-DSC-001',
              'A-004': 'LK-STD-001',
              'A-009': 'LK-STD-001',
              'A-011': 'LK-STD-001',
              'A-012': 'LK-STD-001',
              'A-015': 'LK-PRM-001',
              'A-018': 'LK-STD-001',
              'A-021': 'LK-STD-001',
            },
            individual_fee_by_slot: { 'A-002': { amount: 880, applied_at: '2026/02/01' } },
            reminder_notifications_by_slot: {
              'A-007': [
                { id: 'notify-001', sent_at: '2026/04/10 10:00', method: 'push', status: 'sent' },
                { id: 'notify-002', sent_at: '2026/04/10 10:00', method: 'in_app', status: 'sent' },
              ],
              'A-025': [
                { id: 'notify-003', sent_at: '2026/03/15 09:30', method: 'push', status: 'failed' },
                { id: 'notify-004', sent_at: '2026/03/15 09:30', method: 'in_app', status: 'sent' },
                { id: 'notify-005', sent_at: '2026/03/20 11:00', method: 'push', status: 'sent' },
              ],
            },
          } satisfies LockerDetailSeedMeta,
          'locker-002': {
            option_contract_code: 'LK-3x6-STANDARD-001',
            contract_type_code: 'LK-3x6-STANDARD-001',
            guide_text: '女性更衣室入口から左手側の壁面ロッカーです。',
            note: '女性専用エリアで運用している標準ロッカーです。',
            image_url: null,
            created_at: '2025/02/01 09:30',
            updated_at: '2026/03/18 11:20',
            slot_prefix: 'B',
            slot_columns: 6,
            slot_numbering_pattern: 'top_left_to_right' as LockerNumberingPattern,
            start_number: 1,
            default_slot_size: { width_cm: 35, height_cm: 60, depth_cm: 50 },
            default_open_type: 'door' as LockerSlotOpenType,
            default_lock_type: 'dial' as LockerLockType,
            slot_size_by_slot: {},
            open_type_by_slot: {},
            lock_type_by_slot: { 'B-012': 'cylinder' },
            password_by_slot: { 'B-003': '6012', 'B-014': '4471' },
            contract_type_code_by_slot: { 'B-014': 'LK-STD-001' },
            individual_fee_by_slot: {},
            reminder_notifications_by_slot: {},
          } satisfies LockerDetailSeedMeta,
          'locker-003': {
            option_contract_code: null,
            contract_type_code: null,
            guide_text: 'トレーニングエリア壁面沿いに設置されています。',
            note: '共用利用向けの簡易ロッカーです。',
            image_url: null,
            created_at: '2024/11/10 08:00',
            updated_at: '2026/02/14 16:10',
            slot_prefix: 'C',
            slot_columns: 10,
            slot_numbering_pattern: 'top_left_to_right' as LockerNumberingPattern,
            start_number: 1,
            default_slot_size: { width_cm: 40, height_cm: 60, depth_cm: 50 },
            default_open_type: 'door' as LockerSlotOpenType,
            default_lock_type: 'dial' as LockerLockType,
            slot_size_by_slot: {},
            open_type_by_slot: {},
            lock_type_by_slot: { 'C-007': 'cylinder' },
            password_by_slot: {},
            contract_type_code_by_slot: {},
            individual_fee_by_slot: {},
            reminder_notifications_by_slot: {},
          } satisfies LockerDetailSeedMeta,
          'locker-004': {
            option_contract_code: null,
            contract_type_code: null,
            guide_text: '入口脇に設置された短時間利用向けロッカーです。',
            note: '会員・見学者共用の小型ロッカーです。',
            image_url: null,
            created_at: '2025/03/20 13:00',
            updated_at: '2026/04/06 09:15',
            slot_prefix: 'F',
            slot_columns: 4,
            slot_numbering_pattern: 'top_left_to_right' as LockerNumberingPattern,
            start_number: 1,
            default_slot_size: { width_cm: 35, height_cm: 40, depth_cm: 50 },
            default_open_type: 'door' as LockerSlotOpenType,
            default_lock_type: 'dial' as LockerLockType,
            slot_size_by_slot: {},
            open_type_by_slot: {},
            lock_type_by_slot: {},
            password_by_slot: { 'F-004': '2408', 'F-006': '5114' },
            contract_type_code_by_slot: {},
            individual_fee_by_slot: {},
            reminder_notifications_by_slot: {},
          } satisfies LockerDetailSeedMeta,
        };

        this._historyByLockerId = {
          'locker-001': [
            {
              id: 'hist-001',
              date: '2026/03/10 09:00',
              user: '山田 太郎',
              action: 'スロット状態変更',
              detail: 'A-007 開放待ち → 利用可能',
            },
            {
              id: 'hist-002',
              date: '2026/03/01 14:30',
              user: '山田 太郎',
              action: 'メンテナンス実施',
              detail: 'A-003 ダイヤル錠交換、A-019 扉調整',
            },
            {
              id: 'hist-003',
              date: '2026/02/15 10:00',
              user: '山田 太郎',
              action: 'スロット状態変更',
              detail: 'A-025 開放待ち → 利用可能',
            },
            {
              id: 'hist-004',
              date: '2025/11/20 16:00',
              user: '佐藤 花子',
              action: 'スロット設定変更',
              detail: 'A-005 施錠方法: ダイヤル錠 → シリンダー錠',
            },
            {
              id: 'hist-005',
              date: '2025/08/01 09:00',
              user: '山田 太郎',
              action: 'オプション契約変更',
              detail: 'スタンダード → プレミアムロッカー',
            },
            {
              id: 'hist-006',
              date: '2025/01/15 10:00',
              user: '山田 太郎',
              action: 'ロッカー設備登録',
              detail: 'LK-001 1F 男性更衣室 3段×9列 新規登録',
            },
          ],
          'locker-002': [
            {
              id: 'hist-101',
              date: '2026/03/18 11:20',
              user: '渡辺 由美',
              action: 'ロッカー点検',
              detail: 'B-012 シリンダー錠を交換しました',
            },
          ],
          'locker-003': [
            {
              id: 'hist-201',
              date: '2026/02/14 16:10',
              user: '高橋 直樹',
              action: '利用ルール更新',
              detail: 'トレーニングエリア利用ロッカーの案内文を更新しました',
            },
          ],
          'locker-004': [
            {
              id: 'hist-301',
              date: '2026/04/06 09:15',
              user: '高橋 由美',
              action: '開放待ち登録',
              detail: 'F-002 を開放待ちへ変更しました',
            },
          ],
        };
      },
      getList(): LockerListItem[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): LockerListItem | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },
      getDetailById(id: string): LockerDetail | undefined {
        this._seed();
        getDb().lockerContracts._seed();
        getDb().lockerPendingSlots._seed();
        getDb().optionMasters._seed();

        const locker = this.getById(id);
        const meta = this._detailMetaById[id];

        if (!locker || !meta) return undefined;

        const contracts = getDb().lockerContracts.listByLockerId(id);
        const pendingSlots = getDb().lockerPendingSlots.listByLockerId(id);
        const contractRowsBySlot = new Map(contracts.map((row) => [row.locker_number, row]));
        const pendingRowsBySlot = new Map(pendingSlots.map((row) => [row.slot_number, row]));

        const optionContractMaster = meta.option_contract_code
          ? getDb().optionMasters.getByCode(meta.option_contract_code)
          : undefined;
        const slotPositions = buildLockerSlotPositions(
          meta.slot_prefix,
          locker.shape,
          meta.slot_numbering_pattern,
          meta.start_number,
        );

        const slots: LockerSlotItem[] = slotPositions.map((position) => {
          const slotNumber = position.slot_number;
          const contract = contractRowsBySlot.get(slotNumber);
          const pending = pendingRowsBySlot.get(slotNumber);
          const activeContract = contract && contract.status !== 'available' ? contract : undefined;
          const size =
            meta.slot_size_by_slot[slotNumber] ??
            (pending ? parseLockerSize(pending.size) : meta.default_slot_size);
          const fee = meta.individual_fee_by_slot[slotNumber];
          const status = pending
            ? 'pending_release'
            : activeContract?.status === 'in_use'
              ? 'in_use'
              : 'available';
          const assigned = Boolean(pending || activeContract);
          const lockType =
            pending?.lock_type ?? meta.lock_type_by_slot[slotNumber] ?? meta.default_lock_type;
          const openType = meta.open_type_by_slot[slotNumber] ?? meta.default_open_type;

          return {
            id: `slot-${id}-${slotNumber}`,
            locker_id: id,
            slot_number: slotNumber,
            row_number: position.row_number,
            column_number: position.column_number,
            is_bottom_row: position.is_bottom_row,
            status,
            lock_type: lockType,
            open_type: openType,
            width_cm: size.width_cm,
            height_cm: size.height_cm,
            depth_cm: size.depth_cm,
            password:
              assigned && lockType === 'dial' ? (meta.password_by_slot[slotNumber] ?? null) : null,
            member_name: pending?.member_name ?? activeContract?.member_name ?? null,
            member_id: pending?.member_id ?? activeContract?.member_id ?? null,
            cancel_date: pending?.cancel_date ?? null,
            contract_start_date: activeContract?.start_date ?? null,
            option_contract_name: assigned ? (optionContractMaster?.name ?? null) : null,
            contract_id: activeContract?.contract_id ?? null,
            contract_type_code: meta.contract_type_code_by_slot[slotNumber] ?? null,
            individual_fee: fee?.amount ?? null,
            fee_applied_at: fee?.applied_at ?? null,
            reminder_notifications: meta.reminder_notifications_by_slot[slotNumber] ?? [],
          } satisfies LockerSlotItem;
        });

        const availableSlots = slots.filter((slot) => slot.status === 'available').length;
        const inUseSlots = slots.filter((slot) => slot.status === 'in_use').length;
        const pendingReleaseSlots = slots.filter(
          (slot) => slot.status === 'pending_release',
        ).length;

        return {
          ...locker,
          location_symbol: meta.slot_prefix,
          slot_numbering_pattern: meta.slot_numbering_pattern,
          start_number: meta.start_number,
          default_open_type: meta.default_open_type,
          default_lock_type: meta.default_lock_type,
          slot_lock_settings: collectSlotLockSettings(meta as LockerSlotLockSettingsMeta),
          has_active_slots: inUseSlots > 0 || pendingReleaseSlots > 0,
          option_contract_master: optionContractMaster
            ? (toLockerOptionRef(optionContractMaster) as LockerOptionMasterRef)
            : null,
          contract_type_code: meta.contract_type_code,
          guide_text: meta.guide_text,
          note: meta.note,
          image_url: meta.image_url,
          created_at: meta.created_at,
          updated_at: meta.updated_at,
          summary: {
            total_slots: locker.slots,
            available_slots: availableSlots,
            in_use_slots: inUseSlots,
            pending_release_slots: pendingReleaseSlots,
            utilization_rate_percent:
              locker.slots > 0
                ? Number((((inUseSlots + pendingReleaseSlots) / locker.slots) * 100).toFixed(1))
                : 0,
          },
          slot_items: slots,
          contracts,
          pending_slots: pendingSlots,
        } satisfies LockerDetail;
      },
      getHistoryById(id: string): LockerHistoryItem[] {
        this._seed();
        return [...(this._historyByLockerId[id] ?? [])];
      },
      delete(id: string): boolean {
        this._seed();
        const idx = this._rows.findIndex((row) => row.id === id);
        if (idx === -1) return false;
        this._rows.splice(idx, 1);
        delete this._detailMetaById[id];
        delete this._historyByLockerId[id];
        getDb().lockerContracts.deleteByLockerId(id);
        getDb().lockerPendingSlots.deleteByLockerId(id);
        return true;
      },
      syncLockerListCounts(lockerId: string): void {
        const detail = this.getDetailById(lockerId);
        const row = this._rows.find((item) => item.id === lockerId);
        if (!detail || !row) return;
        row.available_slots = detail.summary.available_slots;
        row.in_use_slots = detail.summary.in_use_slots;
      },
      releaseSlots(
        lockerId: string,
        slotNumbers: string[],
      ): { released_slot_numbers: string[] } | undefined {
        this._seed();
        const meta = this._detailMetaById[lockerId];
        if (!meta) return undefined;

        const uniqueSlotNumbers = [...new Set(slotNumbers)];
        const released: string[] = [];

        for (const slotNumber of uniqueSlotNumbers) {
          const detail = this.getDetailById(lockerId);
          const slot = detail?.slot_items.find((item) => item.slot_number === slotNumber);
          if (!slot || slot.status !== 'pending_release') continue;

          getDb().lockerPendingSlots.removeBySlotNumber(lockerId, slotNumber);
          getDb().lockerContracts.releaseByLockerNumber(lockerId, slotNumber);
          delete meta.password_by_slot[slotNumber];
          delete meta.reminder_notifications_by_slot[slotNumber];
          released.push(slotNumber);
        }

        if (released.length === 0) return undefined;

        meta.updated_at = new Date().toISOString();
        this.syncLockerListCounts(lockerId);

        return { released_slot_numbers: released };
      },
      releaseSlotsBulk(
        items: Array<{ locker_id: string; slot_numbers: string[] }>,
      ): { released_slot_numbers: string[]; locker_ids: string[] } | undefined {
        const released: string[] = [];
        const lockerIds: string[] = [];

        for (const item of items) {
          const result = this.releaseSlots(item.locker_id, item.slot_numbers);
          if (!result) continue;

          released.push(...result.released_slot_numbers);
          if (!lockerIds.includes(item.locker_id)) {
            lockerIds.push(item.locker_id);
          }
        }

        if (released.length === 0) return undefined;

        return { released_slot_numbers: released, locker_ids: lockerIds };
      },
      updateSlot(
        lockerId: string,
        slotId: string,
        patch: {
          lock_type?: LockerLockType;
          open_type?: LockerSlotOpenType;
          width_cm?: number;
          height_cm?: number;
          depth_cm?: number;
          password?: string | null;
          contract_type_code?: string | null;
        },
      ): LockerSlotItem | undefined {
        this._seed();
        const meta = this._detailMetaById[lockerId];
        if (!meta) return undefined;

        const detail = this.getDetailById(lockerId);
        const slot = detail?.slot_items.find((item) => item.id === slotId);
        if (!slot) return undefined;

        const slotNumber = slot.slot_number;

        if (patch.lock_type !== undefined) {
          if (slot.status === 'in_use') return undefined;
          meta.lock_type_by_slot[slotNumber] = patch.lock_type;
          if (patch.lock_type === 'cylinder') {
            delete meta.password_by_slot[slotNumber];
          }
        }

        if (patch.open_type !== undefined) {
          meta.open_type_by_slot[slotNumber] = patch.open_type;
        }

        if (
          patch.width_cm !== undefined ||
          patch.height_cm !== undefined ||
          patch.depth_cm !== undefined
        ) {
          const currentSize =
            meta.slot_size_by_slot[slotNumber] ??
            ({
              width_cm: slot.width_cm,
              height_cm: slot.height_cm,
              depth_cm: slot.depth_cm,
            } as const);
          meta.slot_size_by_slot[slotNumber] = {
            width_cm: patch.width_cm ?? currentSize.width_cm,
            height_cm: patch.height_cm ?? currentSize.height_cm,
            depth_cm: patch.depth_cm ?? currentSize.depth_cm,
          };
        }

        if (patch.password !== undefined) {
          const lockType = patch.lock_type ?? slot.lock_type;
          if (lockType === 'dial') {
            if (patch.password === null) {
              delete meta.password_by_slot[slotNumber];
            } else {
              meta.password_by_slot[slotNumber] = patch.password;
            }
          } else if (patch.password !== null) {
            return undefined;
          }
        }

        if (patch.contract_type_code !== undefined) {
          if (!slot.is_bottom_row) return undefined;
          if (patch.contract_type_code === null) {
            delete meta.contract_type_code_by_slot[slotNumber];
          } else {
            getDb().optionMasters._seed();
            const exists = getDb().optionMasters._rows.some(
              (row) => row.code === patch.contract_type_code,
            );
            if (!exists) return undefined;
            meta.contract_type_code_by_slot[slotNumber] = patch.contract_type_code;
          }
        }

        meta.updated_at = new Date().toISOString();
        this.syncLockerListCounts(lockerId);

        return this.getDetailById(lockerId)?.slot_items.find((item) => item.id === slotId);
      },
      sendSlotReminder(
        lockerId: string,
        slotId: string,
        reminderDays: 7 | 14 | 30,
      ): LockerReminderNotification[] | undefined {
        this._seed();
        const meta = this._detailMetaById[lockerId];
        if (!meta) return undefined;

        const detail = this.getDetailById(lockerId);
        const slot = detail?.slot_items.find((item) => item.id === slotId);
        if (!slot || slot.status !== 'pending_release' || !slot.cancel_date) return undefined;

        void reminderDays;

        const sentAt = new Date().toISOString();
        const baseId = `notify-${Date.now()}`;
        const created: LockerReminderNotification[] = [
          { id: `${baseId}-push`, sent_at: sentAt, method: 'push', status: 'sent' },
          { id: `${baseId}-in-app`, sent_at: sentAt, method: 'in_app', status: 'sent' },
        ];

        meta.reminder_notifications_by_slot[slot.slot_number] = [
          ...(meta.reminder_notifications_by_slot[slot.slot_number] ?? []),
          ...created,
        ];
        meta.updated_at = sentAt;

        return created;
      },
      getUsedLocationSymbols(storeId: string, excludeLockerId?: string): string[] {
        this._seed();
        return this._rows
          .filter((row) => row.store_id === storeId && row.id !== excludeLockerId)
          .map((row) => this._detailMetaById[row.id]?.slot_prefix)
          .filter((symbol): symbol is string => Boolean(symbol));
      },
      create(input: CreateLockerRequest): LockerDetail {
        this._seed();
        getDb().stores._seed();

        const store = getDb().stores.getById(input.store_id);
        if (!store) {
          throw new Error('Store not found');
        }

        const usedSymbols = this.getUsedLocationSymbols(input.store_id);
        if (usedSymbols.includes(input.location_symbol)) {
          throw new Error('Location symbol already used in this store');
        }

        const nextNumber = this._rows.length + 1;
        const id = `locker-${String(nextNumber).padStart(3, '0')}`;
        const lockerId = `LK-${String(nextNumber).padStart(3, '0')}`;
        const totalSlots = getLockerSlotCount(input.shape);
        const { cols } = LOCKER_SHAPE_DIMENSIONS[input.shape];
        const now = formatLockerTimestamp();
        const numberingPatternLabel = buildNumberingPatternLabel(
          input.location_symbol,
          input.shape,
          input.slot_numbering_pattern,
          input.start_number,
        );

        const meta: LockerDetailSeedMeta = {
          option_contract_code:
            input.option_type === 'none' ? null : (input.contract_type_code ?? null),
          contract_type_code: input.contract_type_code ?? null,
          guide_text: input.guide_text ?? null,
          note: input.note ?? null,
          image_url: input.image_url ?? null,
          created_at: now,
          updated_at: now,
          slot_prefix: input.location_symbol,
          slot_columns: cols,
          slot_numbering_pattern: input.slot_numbering_pattern,
          start_number: input.start_number,
          default_slot_size: { width_cm: 35, height_cm: 40, depth_cm: 50 },
          default_open_type: input.default_open_type,
          default_lock_type: input.default_lock_type,
          slot_size_by_slot: {},
          open_type_by_slot: {},
          lock_type_by_slot: {},
          password_by_slot: {},
          contract_type_code_by_slot: {},
          individual_fee_by_slot: {},
          reminder_notifications_by_slot: {},
        };

        applySlotLockSettings(
          meta as LockerSlotLockSettingsMeta,
          input.default_lock_type,
          input.slot_lock_settings ?? [],
        );

        const listItem: LockerListItem = {
          id,
          locker_id: lockerId,
          store_id: input.store_id,
          store_name: store.name,
          area: input.area_label ?? input.location_symbol,
          shape: input.shape,
          option_type: input.option_type,
          slots: totalSlots,
          available_slots: totalSlots,
          in_use_slots: 0,
          numbering_pattern: numberingPatternLabel,
        };

        this._rows.unshift(listItem);
        this._detailMetaById[id] = meta;
        this._historyByLockerId[id] = [
          {
            id: `hist-${id}-create`,
            date: now,
            user: 'システム',
            action: 'ロッカー登録',
            detail: `${lockerId} を新規登録`,
          },
        ];

        const detail = this.getDetailById(id);
        if (!detail) {
          throw new Error('Failed to create locker detail');
        }
        return detail;
      },
      update(id: string, patch: UpdateLockerRequest): LockerDetail | undefined {
        this._seed();
        const locker = this.getById(id);
        const meta = this._detailMetaById[id];
        if (!locker || !meta) return undefined;

        if (patch.location_symbol && patch.location_symbol !== meta.slot_prefix) {
          const usedSymbols = this.getUsedLocationSymbols(locker.store_id, id);
          if (usedSymbols.includes(patch.location_symbol)) {
            throw new Error('Location symbol already used in this store');
          }
        }

        const nextPrefix = patch.location_symbol ?? meta.slot_prefix;
        const nextNumberingPattern = patch.slot_numbering_pattern ?? meta.slot_numbering_pattern;
        const nextStartNumber = patch.start_number ?? meta.start_number;
        const nextDefaultLockType = patch.default_lock_type ?? meta.default_lock_type;
        const nextDefaultOpenType = patch.default_open_type ?? meta.default_open_type;
        const nextOptionType = patch.option_type ?? locker.option_type;

        if (patch.guide_text !== undefined) meta.guide_text = patch.guide_text;
        if (patch.note !== undefined) meta.note = patch.note;
        if (patch.image_url !== undefined) meta.image_url = patch.image_url;
        if (patch.contract_type_code !== undefined) {
          meta.contract_type_code = patch.contract_type_code;
          meta.option_contract_code =
            nextOptionType === 'none' ? null : (patch.contract_type_code ?? null);
        }
        if (patch.option_type !== undefined) {
          locker.option_type = patch.option_type as LockerOptionType;
          if (patch.option_type === 'none') {
            meta.option_contract_code = null;
          }
        }

        meta.slot_prefix = nextPrefix;
        meta.slot_numbering_pattern = nextNumberingPattern;
        meta.start_number = nextStartNumber;
        meta.default_open_type = nextDefaultOpenType;

        if (patch.area_label !== undefined) {
          locker.area = patch.area_label;
        } else if (patch.location_symbol) {
          locker.area = patch.location_symbol;
        }

        if (patch.slot_lock_settings !== undefined || patch.default_lock_type !== undefined) {
          applySlotLockSettings(
            meta as LockerSlotLockSettingsMeta,
            nextDefaultLockType,
            patch.slot_lock_settings ?? collectSlotLockSettings(meta as LockerSlotLockSettingsMeta),
          );
        }

        locker.numbering_pattern = buildNumberingPatternLabel(
          nextPrefix,
          locker.shape,
          nextNumberingPattern,
          nextStartNumber,
        );

        meta.updated_at = formatLockerTimestamp();
        this.syncLockerListCounts(id);

        return this.getDetailById(id);
      },
    },

    lockerContracts: {
      _rows: [] as LockerContractListItem[],
      _seeded: false,
      _detailMetaById: {} as Record<
        string,
        {
          member_phone: string;
          member_email: string;
          termination_date: string | null;
          password_updated_at: string | null;
          created_at: string;
          updated_at: string;
        }
      >,
      _changeHistoryById: {} as Record<string, LockerContractChangeHistoryItem[]>,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();

        const seedSpecs = [
          {
            id: 'locker-contract-001',
            contract_id: 'CNT-001',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '田中 花子',
            member_id: 'M-0042',
            locker_number: 'A-002',
            contract_type: 'premium',
            start_date: '2025/06/01',
            end_date: '2026/05/31',
            status: 'in_use',
          },
          {
            id: 'locker-contract-002',
            contract_id: 'CNT-002',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '佐藤 健一',
            member_id: 'M-0108',
            locker_number: 'A-004',
            contract_type: 'premium',
            start_date: '2025/08/15',
            end_date: '2026/08/14',
            status: 'in_use',
          },
          {
            id: 'locker-contract-003',
            contract_id: 'CNT-003',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '鈴木 美咲',
            member_id: 'M-0215',
            locker_number: 'A-007',
            contract_type: 'premium',
            start_date: '2025/04/01',
            end_date: '2026/04/30',
            status: 'pending_release',
          },
          {
            id: 'locker-contract-004',
            contract_id: 'CNT-004',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '高橋 直樹',
            member_id: 'M-0331',
            locker_number: 'A-009',
            contract_type: 'premium',
            start_date: '2025/10/01',
            end_date: '2026/09/30',
            status: 'in_use',
          },
          {
            id: 'locker-contract-005',
            contract_id: 'CNT-005',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '伊藤 さくら',
            member_id: 'M-0088',
            locker_number: 'A-011',
            contract_type: 'premium',
            start_date: '2025/03/01',
            end_date: '2026/02/28',
            status: 'in_use',
          },
          {
            id: 'locker-contract-006',
            contract_id: 'CNT-006',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '渡辺 隆',
            member_id: 'M-0174',
            locker_number: 'A-012',
            contract_type: 'premium',
            start_date: '2025/07/15',
            end_date: '2026/07/14',
            status: 'in_use',
          },
          {
            id: 'locker-contract-007',
            contract_id: 'CNT-007',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '山田 陽子',
            member_id: 'M-0253',
            locker_number: 'A-015',
            contract_type: 'premium',
            start_date: '2025/09/01',
            end_date: '2026/08/31',
            status: 'in_use',
          },
          {
            id: 'locker-contract-008',
            contract_id: 'CNT-008',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '中村 大輔',
            member_id: 'M-0319',
            locker_number: 'A-018',
            contract_type: 'premium',
            start_date: '2025/11/01',
            end_date: '2026/10/31',
            status: 'in_use',
          },
          {
            id: 'locker-contract-009',
            contract_id: 'CNT-009',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '小林 恵',
            member_id: 'M-0402',
            locker_number: 'A-021',
            contract_type: 'premium',
            start_date: '2026/01/15',
            end_date: '2027/01/14',
            status: 'in_use',
          },
          {
            id: 'locker-contract-010',
            contract_id: 'CNT-010',
            locker_id: 'locker-001',
            store_id: 'store-006',
            member_name: '加藤 浩二',
            member_id: 'M-0467',
            locker_number: 'A-025',
            contract_type: 'premium',
            start_date: '2025/05/01',
            end_date: '2026/03/31',
            status: 'pending_release',
          },
          {
            id: 'locker-contract-011',
            contract_id: 'CNT-011',
            locker_id: 'locker-002',
            store_id: 'store-001',
            member_name: '山田 健一',
            member_id: 'M-00198',
            locker_number: 'B-003',
            contract_type: 'standard',
            start_date: '2025/01/01',
            end_date: '2025/12/31',
            status: 'pending_release',
          },
          {
            id: 'locker-contract-012',
            contract_id: 'CNT-012',
            locker_id: 'locker-002',
            store_id: 'store-001',
            member_name: '渡辺 由美',
            member_id: 'M-00167',
            locker_number: 'B-014',
            contract_type: 'standard',
            start_date: '2024/10/01',
            end_date: '2025/09/30',
            status: 'in_use',
          },
          {
            id: 'locker-contract-013',
            contract_id: 'CNT-013',
            locker_id: 'locker-003',
            store_id: 'store-009',
            member_name: '高橋 直樹',
            member_id: 'M-00523',
            locker_number: 'C-007',
            contract_type: 'standard',
            start_date: '2025/03/01',
            end_date: '2026/02/28',
            status: 'pending_release',
          },
          {
            id: 'locker-contract-014',
            contract_id: 'CNT-014',
            locker_id: 'locker-004',
            store_id: 'store-008',
            member_name: '高橋 由美',
            member_id: 'M-00567',
            locker_number: 'F-002',
            contract_type: 'standard',
            start_date: '2025/12/01',
            end_date: '2026/04/05',
            status: 'pending_release',
          },
          {
            id: 'locker-contract-015',
            contract_id: 'CNT-015',
            locker_id: 'locker-004',
            store_id: 'store-008',
            member_name: '岩田 真司',
            member_id: 'M-00601',
            locker_number: 'F-004',
            contract_type: 'standard',
            start_date: '2026/01/10',
            end_date: '2026/12/31',
            status: 'in_use',
          },
          {
            id: 'locker-contract-016',
            contract_id: 'CNT-016',
            locker_id: 'locker-004',
            store_id: 'store-008',
            member_name: '松田 麻衣',
            member_id: 'M-00618',
            locker_number: 'F-006',
            contract_type: 'standard',
            start_date: '2026/02/01',
            end_date: '2027/01/31',
            status: 'in_use',
          },
        ] satisfies Array<Omit<LockerContractListItem, 'store_name'>>;

        this._rows = seedSpecs.map((row) => {
          const store = getDb().stores._rows.find((storeRow) => storeRow.id === row.store_id);
          if (!store) {
            throw new Error(`Store not found for locker contract seed: ${row.store_id}`);
          }
          return { ...row, store_name: store.name };
        });

        const memberContacts: Record<string, { phone: string; email: string }> = {
          'M-0042': { phone: '090-1111-2222', email: 'hanako.tanaka@example.com' },
          'M-0108': { phone: '090-2222-3333', email: 'kenichi.sato@example.com' },
          'M-0215': { phone: '090-3333-4444', email: 'misaki.suzuki@example.com' },
          'M-0331': { phone: '090-4444-5555', email: 'naoki.takahashi@example.com' },
          'M-0088': { phone: '090-5555-6666', email: 'sakura.ito@example.com' },
          'M-0174': { phone: '090-1234-5678', email: 'takashi.watanabe@example.com' },
          'M-0253': { phone: '090-6666-7777', email: 'yoko.yamada@example.com' },
          'M-0319': { phone: '090-7777-8888', email: 'daisuke.nakamura@example.com' },
          'M-0402': { phone: '090-8888-9999', email: 'megumi.kobayashi@example.com' },
          'M-0467': { phone: '090-9999-0000', email: 'koji.kato@example.com' },
          'M-00198': { phone: '090-1010-2020', email: 'kenichi.yamada@example.com' },
          'M-00167': { phone: '090-2020-3030', email: 'yumi.watanabe@example.com' },
          'M-00523': { phone: '090-3030-4040', email: 'naoki.takahashi2@example.com' },
          'M-00567': { phone: '090-4040-5050', email: 'yumi.takahashi@example.com' },
          'M-00601': { phone: '090-5050-6060', email: 'shinji.iwata@example.com' },
          'M-00618': { phone: '090-6060-7070', email: 'mai.matsuda@example.com' },
        };

        this._detailMetaById = {};
        this._changeHistoryById = {};

        for (const row of this._rows) {
          const contact = memberContacts[row.member_id] ?? {
            phone: '090-0000-0000',
            email: 'member@example.com',
          };
          const terminationDate = row.status === 'pending_release' ? row.end_date : null;

          this._detailMetaById[row.id] = {
            member_phone: contact.phone,
            member_email: contact.email,
            termination_date: terminationDate,
            password_updated_at: row.start_date,
            created_at: `${row.start_date} 09:00`,
            updated_at: row.status === 'pending_release' ? `${row.end_date} 10:00` : row.start_date,
          };

          const history: LockerContractChangeHistoryItem[] = [
            {
              date: `${row.start_date} 09:00`,
              user: 'テストユーザー',
              field: null,
              from: null,
              to: '新規作成',
            },
          ];

          if (row.locker_number === 'A-012') {
            history.unshift({
              date: '2026/03/01 10:00',
              user: 'テストユーザー',
              field: 'スロット番号',
              from: 'A-010',
              to: row.locker_number,
            });
          }

          this._changeHistoryById[row.id] = history;
        }
      },
      getList(): LockerContractListItem[] {
        this._seed();
        return this._rows.map((row) => ({
          ...row,
          start_date: normalizeLockerDate(row.start_date) ?? row.start_date,
          end_date: normalizeLockerDate(row.end_date) ?? row.end_date,
        }));
      },
      getById(id: string): LockerContractDetail | undefined {
        this._seed();
        const row = this._rows.find((item) => item.id === id);
        if (!row) return undefined;

        const locker = getDb().lockers.getDetailById(row.locker_id);
        const slot = locker?.slot_items.find((item) => item.slot_number === row.locker_number);
        const meta = this._detailMetaById[id];
        if (!meta) return undefined;

        const optionContractName =
          slot?.option_contract_name ??
          (row.contract_type === 'premium'
            ? 'プレミアムロッカー'
            : row.contract_type === 'standard'
              ? 'スタンダードロッカー'
              : '―');

        const slotSize = slot
          ? `L（W${slot.width_cm} × D${slot.depth_cm} × H${slot.height_cm} cm）`
          : '―';

        return {
          ...row,
          start_date: normalizeLockerDate(row.start_date) ?? row.start_date,
          end_date: normalizeLockerDate(row.end_date) ?? row.end_date,
          locker_display_id: locker?.locker_id ?? row.locker_id,
          locker_area: locker?.area ?? '―',
          contract_type_code: slot?.contract_type_code ?? null,
          option_contract_name: optionContractName,
          slot_size: slotSize,
          member_phone: meta.member_phone,
          member_email: meta.member_email,
          termination_date: normalizeLockerDate(meta.termination_date),
          password: slot?.password ?? null,
          password_updated_at: normalizeLockerDate(meta.password_updated_at),
          created_at: meta.created_at,
          updated_at: meta.updated_at,
        };
      },
      getChangeHistory(id: string): LockerContractChangeHistoryItem[] {
        this._seed();
        return [...(this._changeHistoryById[id] ?? [])];
      },
      cancel(
        id: string,
        terminationDate: string,
      ): { termination_date: string; status: LockerContractListItem['status'] } | null {
        this._seed();
        const rowIndex = this._rows.findIndex((item) => item.id === id);
        if (rowIndex === -1) return null;

        const currentRow = this._rows[rowIndex];
        if (!currentRow) return null;

        const meta = this._detailMetaById[id];
        if (!meta) return null;

        const normalizedTerminationDate = normalizeLockerDate(terminationDate) ?? terminationDate;
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const terminationDateOnly = new Date(normalizedTerminationDate);
        const nextStatus: LockerContractListItem['status'] =
          terminationDateOnly <= todayDateOnly ? 'pending_release' : currentRow.status;

        this._rows[rowIndex] = { ...currentRow, status: nextStatus };
        meta.termination_date = normalizedTerminationDate;
        meta.updated_at = `${normalizedTerminationDate} 10:00`;

        return { termination_date: normalizedTerminationDate, status: nextStatus };
      },
      listByLockerId(lockerId: string): LockerContractListItem[] {
        this._seed();
        return this._rows
          .filter((row) => row.locker_id === lockerId)
          .map((row) => ({
            ...row,
            start_date: normalizeLockerDate(row.start_date) ?? row.start_date,
            end_date: normalizeLockerDate(row.end_date) ?? row.end_date,
          }));
      },
      deleteByLockerId(lockerId: string): void {
        this._seed();
        this._rows = this._rows.filter((row) => row.locker_id !== lockerId);
      },
      releaseByLockerNumber(lockerId: string, lockerNumber: string): boolean {
        this._seed();
        const index = this._rows.findIndex(
          (row) => row.locker_id === lockerId && row.locker_number === lockerNumber,
        );
        if (index === -1) return false;
        this._rows[index] = { ...this._rows[index]!, status: 'available' };
        return true;
      },
      create(
        input: CreateLockerContractRequest,
      ):
        | { ok: true; contract: LockerContractDetail }
        | { ok: false; error: string; status: number } {
        this._seed();
        getDb().optionMasters._seed();

        const member = getDb().members.get(input.member_id);
        if (!member) {
          return { ok: false, error: '会員が見つかりません', status: 404 };
        }

        const memberContracts = getDb().contracts.getByMemberId(input.member_id);
        const unpaidAmount = memberContracts?.unpaid_info?.amount ?? 0;
        if (unpaidAmount > 0) {
          return {
            ok: false,
            error: '未納金が残っている会員はロッカー契約を締結できません',
            status: 409,
          };
        }

        const locker = getDb().lockers.getDetailById(input.locker_id);
        if (!locker) {
          return { ok: false, error: 'ロッカーが見つかりません', status: 404 };
        }

        const slot = locker.slot_items.find((item) => item.slot_number === input.slot_number);
        if (!slot) {
          return { ok: false, error: 'スロットが見つかりません', status: 404 };
        }

        if (slot.status !== 'available') {
          const occupied = this._rows.find(
            (row) =>
              row.locker_id === input.locker_id &&
              row.locker_number === input.slot_number &&
              row.status === 'in_use',
          );
          const memberName = occupied?.member_name ?? slot.member_name ?? '別の会員';
          return {
            ok: false,
            error: `このスロットは既に契約されています（${memberName} さん）`,
            status: 409,
          };
        }

        const contractType = getDb().optionMasters.getByCode(input.contract_type_code);
        if (!contractType || contractType.category !== 'locker_option') {
          return { ok: false, error: '契約種類が見つかりません', status: 404 };
        }

        if (slot.lock_type === 'dial' && !input.password) {
          return { ok: false, error: 'ダイヤル錠の場合はパスワードが必須です', status: 400 };
        }

        const nextNumber = this._rows.length + 1;
        const id = `locker-contract-${String(nextNumber).padStart(3, '0')}`;
        const contractId = `CNT-${String(nextNumber).padStart(3, '0')}`;
        const normalizedStartDate = normalizeLockerDate(input.start_date) ?? input.start_date;
        const endDate = computeLockerContractEndDate(normalizedStartDate);
        const now = formatLockerTimestamp();

        const row: LockerContractListItem = {
          id,
          contract_id: contractId,
          locker_id: input.locker_id,
          store_id: locker.store_id,
          store_name: locker.store_name,
          member_name: member.basic_info.name_kanji,
          member_id: input.member_id,
          locker_number: input.slot_number,
          contract_type: resolveLockerContractTypeFromCode(input.contract_type_code),
          start_date: normalizedStartDate,
          end_date: endDate,
          status: 'in_use',
        };

        this._rows.push(row);
        this._detailMetaById[id] = {
          member_phone: member.basic_info.phone,
          member_email: member.basic_info.email,
          termination_date: null,
          password_updated_at: input.password ? normalizedStartDate : null,
          created_at: now,
          updated_at: now,
        };

        const lockerMeta = getDb().lockers._detailMetaById[input.locker_id];
        if (lockerMeta) {
          lockerMeta.contract_type_code_by_slot[input.slot_number] = input.contract_type_code;
          if (input.password) {
            lockerMeta.password_by_slot[input.slot_number] = input.password;
          }
          lockerMeta.updated_at = now;
        }
        getDb().lockers.syncLockerListCounts(input.locker_id);

        const contract = this.getById(id);
        if (!contract) {
          return { ok: false, error: '契約の作成に失敗しました', status: 500 };
        }

        return { ok: true, contract };
      },
      update(
        id: string,
        patch: UpdateLockerContractRequest,
      ):
        | { ok: true; contract: LockerContractDetail }
        | { ok: false; error: string; status: number } {
        this._seed();
        getDb().optionMasters._seed();

        const rowIndex = this._rows.findIndex((item) => item.id === id);
        if (rowIndex === -1) {
          return { ok: false, error: 'ロッカー契約が見つかりません', status: 404 };
        }

        const currentRow = this._rows[rowIndex]!;
        const meta = this._detailMetaById[id];
        if (!meta) {
          return { ok: false, error: 'ロッカー契約が見つかりません', status: 404 };
        }

        const nextLockerId = patch.locker_id ?? currentRow.locker_id;
        const nextSlotNumber = patch.slot_number ?? currentRow.locker_number;

        if (patch.locker_id !== undefined || patch.slot_number !== undefined) {
          const locker = getDb().lockers.getDetailById(nextLockerId);
          if (!locker) {
            return { ok: false, error: 'ロッカーが見つかりません', status: 404 };
          }

          const slot = locker.slot_items.find((item) => item.slot_number === nextSlotNumber);
          if (!slot) {
            return { ok: false, error: 'スロットが見つかりません', status: 404 };
          }

          const isSameSlot =
            nextLockerId === currentRow.locker_id && nextSlotNumber === currentRow.locker_number;

          if (!isSameSlot && slot.status !== 'available') {
            const occupied = this._rows.find(
              (row) =>
                row.id !== id &&
                row.locker_id === nextLockerId &&
                row.locker_number === nextSlotNumber &&
                row.status === 'in_use',
            );
            const memberName = occupied?.member_name ?? slot.member_name ?? '別の会員';
            return {
              ok: false,
              error: `このスロットは既に契約されています（${memberName} さん）`,
              status: 409,
            };
          }
        }

        if (patch.contract_type_code !== undefined) {
          const contractType = getDb().optionMasters.getByCode(patch.contract_type_code);
          if (!contractType || contractType.category !== 'locker_option') {
            return { ok: false, error: '契約種類が見つかりません', status: 404 };
          }
        }

        const lockerDetail = getDb().lockers.getDetailById(nextLockerId);
        const targetSlot = lockerDetail?.slot_items.find(
          (item) => item.slot_number === nextSlotNumber,
        );
        if (targetSlot?.lock_type === 'dial' && patch.password === null) {
          return { ok: false, error: 'ダイヤル錠の場合はパスワードが必須です', status: 400 };
        }

        const now = formatLockerTimestamp();
        const previousLockerId = currentRow.locker_id;
        const previousSlotNumber = currentRow.locker_number;

        const nextStartDate =
          normalizeLockerDate(patch.start_date ?? currentRow.start_date) ?? currentRow.start_date;
        const nextContractTypeCode =
          patch.contract_type_code ??
          getDb().lockers._detailMetaById[nextLockerId]?.contract_type_code_by_slot[nextSlotNumber];

        this._rows[rowIndex] = {
          ...currentRow,
          locker_id: nextLockerId,
          locker_number: nextSlotNumber,
          store_id: lockerDetail?.store_id ?? currentRow.store_id,
          store_name: lockerDetail?.store_name ?? currentRow.store_name,
          contract_type: nextContractTypeCode
            ? resolveLockerContractTypeFromCode(nextContractTypeCode)
            : currentRow.contract_type,
          start_date: nextStartDate,
          end_date: computeLockerContractEndDate(nextStartDate),
        };

        if (previousLockerId !== nextLockerId || previousSlotNumber !== nextSlotNumber) {
          const previousMeta = getDb().lockers._detailMetaById[previousLockerId];
          if (previousMeta) {
            delete previousMeta.contract_type_code_by_slot[previousSlotNumber];
            delete previousMeta.password_by_slot[previousSlotNumber];
            previousMeta.updated_at = now;
          }
          getDb().lockers.syncLockerListCounts(previousLockerId);
        }

        const nextMeta = getDb().lockers._detailMetaById[nextLockerId];
        if (nextMeta) {
          if (patch.contract_type_code !== undefined) {
            nextMeta.contract_type_code_by_slot[nextSlotNumber] = patch.contract_type_code;
          }
          if (patch.password !== undefined) {
            if (patch.password === null) {
              delete nextMeta.password_by_slot[nextSlotNumber];
            } else {
              nextMeta.password_by_slot[nextSlotNumber] = patch.password;
              meta.password_updated_at = now;
            }
          }
          nextMeta.updated_at = now;
        }
        getDb().lockers.syncLockerListCounts(nextLockerId);

        meta.updated_at = now;

        const contract = this.getById(id);
        if (!contract) {
          return { ok: false, error: '契約の更新に失敗しました', status: 500 };
        }

        return { ok: true, contract };
      },
    },

    lockerPendingSlots: {
      _rows: [] as LockerPendingSlotListItem[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().stores._seed();

        const seedSpecs = [
          {
            id: 'pending-slot-001',
            locker_id: 'locker-001',
            store_id: 'store-006',
            locker_location: 'a_changing_room',
            locker_name: 'ロッカーA',
            slot_number: 'A-007',
            member_name: '鈴木 美咲',
            member_id: 'M-0215',
            cancel_date: '2026/04/30',
            pending_since: '2026/04/01',
            pending_days: 30,
            size: 'W35×H40×D50',
            lock_type: 'dial',
          },
          {
            id: 'pending-slot-002',
            locker_id: 'locker-001',
            store_id: 'store-006',
            locker_location: 'a_changing_room',
            locker_name: 'ロッカーA',
            slot_number: 'A-025',
            member_name: '加藤 浩二',
            member_id: 'M-0467',
            cancel_date: '2026/03/31',
            pending_since: '2026/03/15',
            pending_days: 16,
            size: 'W35×H40×D50',
            lock_type: 'dial',
          },
          {
            id: 'pending-slot-003',
            locker_id: 'locker-002',
            store_id: 'store-001',
            locker_location: 'a_changing_room',
            locker_name: 'ロッカーB',
            slot_number: 'B-003',
            member_name: '山田 健一',
            member_id: 'M-00198',
            cancel_date: '2025/12/31',
            pending_since: '2025/12/15',
            pending_days: 16,
            size: 'W35×H60×D50',
            lock_type: 'dial',
          },
          {
            id: 'pending-slot-004',
            locker_id: 'locker-003',
            store_id: 'store-009',
            locker_location: 'b_gym_area',
            locker_name: 'ロッカーC',
            slot_number: 'C-007',
            member_name: '高橋 直樹',
            member_id: 'M-00523',
            cancel_date: '2026/02/28',
            pending_since: '2026/02/10',
            pending_days: 18,
            size: 'W40×H60×D50',
            lock_type: 'cylinder',
          },
          {
            id: 'pending-slot-005',
            locker_id: 'locker-004',
            store_id: 'store-008',
            locker_location: 'f_entrance',
            locker_name: 'ロッカーF',
            slot_number: 'F-002',
            member_name: '高橋 由美',
            member_id: 'M-00567',
            cancel_date: '2026/04/05',
            pending_since: '2026/04/06',
            pending_days: 10,
            size: 'W35×H40×D50',
            lock_type: 'dial',
          },
        ] satisfies Array<Omit<LockerPendingSlotListItem, 'store_name'>>;

        this._rows = seedSpecs.map((row) => {
          const store = getDb().stores._rows.find((storeRow) => storeRow.id === row.store_id);
          if (!store) {
            throw new Error(`Store not found for locker pending seed: ${row.store_id}`);
          }
          return { ...row, store_name: store.name };
        });
      },
      getList(): LockerPendingSlotListItem[] {
        this._seed();
        return [...this._rows];
      },
      listByLockerId(lockerId: string): LockerPendingSlotListItem[] {
        this._seed();
        return this._rows.filter((row) => row.locker_id === lockerId).map((row) => ({ ...row }));
      },
      deleteByLockerId(lockerId: string): void {
        this._seed();
        this._rows = this._rows.filter((row) => row.locker_id !== lockerId);
      },
      removeBySlotNumber(lockerId: string, slotNumber: string): boolean {
        this._seed();
        const before = this._rows.length;
        this._rows = this._rows.filter(
          (row) => !(row.locker_id === lockerId && row.slot_number === slotNumber),
        );
        return this._rows.length < before;
      },
    },
  };
}
