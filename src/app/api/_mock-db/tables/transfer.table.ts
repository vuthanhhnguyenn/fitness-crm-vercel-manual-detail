import type { LeaveDetail, LeaveListItem } from '@/app/api/_schemas/leave.schema';

import { MemberStatus } from '@/lib/api/types.gen';

import type { DbType } from '../_db.types';
import {
  type BlacklistRow,
  TRANSFER_SEED_DATA,
  type TransferRow,
  TransferStatus,
} from '../seeds/transfer.seed';

export function createTransferTables(getDb: () => DbType) {
  return {
    transfers: {
      _rows: [...TRANSFER_SEED_DATA] as TransferRow[],
      getAll(): TransferRow[] {
        return this._rows;
      },
      getById(id: string): TransferRow | undefined {
        return this._rows.find((r) => r.id === id);
      },
      create(input: {
        member_id: string;
        member_name: string;
        from_store_id: string;
        from_store_name: string;
        to_store_id: string;
        to_store_name: string;
        brand: string;
        reason?: string;
      }): TransferRow {
        const now = new Date().toISOString();
        const id = `TR-${String(this._rows.length + 1).padStart(3, '0')}`;
        const newRow: TransferRow = {
          id,
          member_id: input.member_id,
          member_name: input.member_name,
          from_store_id: input.from_store_id,
          from_store_name: input.from_store_name,
          to_store_id: input.to_store_id,
          to_store_name: input.to_store_name,
          brand: input.brand as TransferRow['brand'],
          applied_at: now,
          scheduled_date: now,
          status: TransferStatus.Pending,
          reason: input.reason ?? '',
          applicant_name: 'スタッフ',
          applicant_role: 'staff',
          updated_at: now,
          approval_history: [
            {
              step: 1,
              label: '申請',
              store_type: null,
              completed: true,
              completed_at: now,
              completed_by: 'スタッフ',
              is_automatic: false,
            },
            {
              step: 2,
              label: '移籍元承認',
              store_type: 'from',
              completed: false,
              completed_at: null,
              completed_by: null,
              is_automatic: false,
            },
            {
              step: 3,
              label: '移籍先承認',
              store_type: 'to',
              completed: false,
              completed_at: null,
              completed_by: null,
              is_automatic: false,
            },
          ],
        };
        this._rows.push(newRow);
        return newRow;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      approve(id: string, _comment?: string): TransferRow | undefined {
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        const row = this._rows[idx]!;
        if (row.status === TransferStatus.Completed || row.status === TransferStatus.Rejected)
          return undefined;
        const now = new Date().toISOString();
        let nextStatus: TransferRow['status'];
        let approvedStep: number;
        if (row.status === TransferStatus.Pending) {
          nextStatus = TransferStatus.FromStoreApproved;
          approvedStep = 2;
        } else if (row.status === TransferStatus.FromStoreApproved && row.brand === 'fit365') {
          nextStatus = TransferStatus.Approved;
          approvedStep = 3;
        } else {
          return undefined;
        }
        const updatedHistory = row.approval_history.map((h) =>
          h.step === approvedStep
            ? { ...h, completed: true, completed_at: now, completed_by: 'ログインユーザー' }
            : h,
        );
        const updated: TransferRow = {
          ...row,
          status: nextStatus,
          updated_at: now,
          approval_history: updatedHistory,
        };
        this._rows[idx] = updated;
        return updated;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reject(id: string, _comment?: string): TransferRow | undefined {
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        const row = this._rows[idx]!;
        if (row.status === TransferStatus.Completed || row.status === TransferStatus.Rejected)
          return undefined;
        const now = new Date().toISOString();
        const updated: TransferRow = { ...row, status: TransferStatus.Rejected, updated_at: now };
        this._rows[idx] = updated;
        return updated;
      },
    },

    memberLeaves: {
      _rows: [] as LeaveListItem[],
      _details: {} as Record<string, LeaveDetail>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().members._seed();

        const targetStatuses = new Set<string>([
          MemberStatus.SUSPENDED,
          MemberStatus.PENDING_WITHDRAWAL,
          MemberStatus.WITHDRAWN,
          MemberStatus.FORCE_WITHDRAWN,
        ]);

        const candidates = getDb().members._members.filter((m) =>
          targetStatuses.has(m.profile.status),
        );

        const baseDate = new Date('2026-01-01');
        const toJpDate = (d: Date): string =>
          `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
        const toJpMonth = (d: Date): string =>
          `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        this._rows = candidates.map((m, i) => {
          const memberStatus = m.profile.status;
          const appliedDate = new Date(baseDate);
          appliedDate.setDate(appliedDate.getDate() + i * 7);
          const scheduledDate = new Date(appliedDate);
          scheduledDate.setDate(scheduledDate.getDate() + 14);

          let leaveStatus: LeaveListItem['status'];
          let leaveType: LeaveListItem['type'];
          let endDate: string | null = null;
          let unpaidAmount = 0;

          if (memberStatus === MemberStatus.SUSPENDED) {
            leaveType = 'suspension';
            leaveStatus = i % 2 === 0 ? 'suspended' : 'suspension_scheduled';
            const endD = new Date(scheduledDate);
            endD.setMonth(endD.getMonth() + 2);
            endDate = toJpMonth(endD);
            unpaidAmount = i % 5 === 0 ? 1100 * ((i % 3) + 1) : 0;
          } else if (memberStatus === MemberStatus.PENDING_WITHDRAWAL) {
            leaveType = 'withdrawal';
            leaveStatus = 'withdrawal_pending';
            unpaidAmount = i % 3 === 0 ? 7700 : 0;
          } else if (memberStatus === MemberStatus.WITHDRAWN) {
            leaveType = 'withdrawal';
            leaveStatus = i % 2 === 0 ? 'withdrawal_scheduled' : 'withdrawal_pending';
            unpaidAmount = 0;
          } else {
            leaveType = 'withdrawal';
            leaveStatus = 'completed';
            unpaidAmount = 0;
          }

          const scheduledDateStr =
            leaveType === 'suspension' ? toJpMonth(scheduledDate) : toJpDate(scheduledDate);

          return {
            id: `LV-${String(i + 1).padStart(3, '0')}`,
            member_id: m.basic_info.id,
            member_name: m.basic_info.name_kanji,
            brand: m.profile.brand,
            store_id: m.profile.store_id,
            store_name: m.profile.store_name,
            type: leaveType,
            status: leaveStatus,
            applied_at: toJpDate(appliedDate),
            scheduled_date: scheduledDateStr,
            end_date: endDate,
            unpaid_amount: unpaidAmount,
          } satisfies LeaveListItem;
        });

        const consentMethods = ['来店', 'オンライン', '電話'];
        this._rows.forEach((row, i) => {
          const appliedDateTime = `${row.applied_at} ${String(9 + (i % 8)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`;
          const isProxy = i % 3 === 0;
          this._details[row.id] = {
            id: row.id,
            member_id: row.member_id,
            member_name: row.member_name,
            brand: row.brand,
            store_id: row.store_id,
            store_name: row.store_name,
            type: row.type,
            status: row.status,
            applied_at: appliedDateTime,
            scheduled_date: row.scheduled_date,
            end_date: row.end_date,
            reason: [
              '海外出張のため',
              '体調不良のため',
              '育児のため',
              '経済的理由のため',
              '転居のため',
            ][i % 5]!,
            applicant: `${row.member_name}（本人）`,
            is_proxy_applied: isProxy,
            proxy_applicant: isProxy ? `スタッフ${i + 1}（スタッフ）` : null,
            consent_at: isProxy
              ? new Date(
                  `${row.applied_at} ${String(9 + (i % 8)).padStart(2, '0')}:00`,
                ).toISOString()
              : null,
            consent_method: isProxy ? (consentMethods[i % 3] ?? '来店') : null,
            suspension_fee: row.type === 'suspension' ? 1100 : null,
            applied_campaign: 'なし',
            unused_lessons: (i * 2) % 5,
            unpaid_amount: row.unpaid_amount,
            created_at: appliedDateTime,
            updated_at: appliedDateTime,
          } satisfies LeaveDetail;
        });
      },
      list(): LeaveListItem[] {
        this._seed();
        return this._rows;
      },
      getById(id: string): LeaveDetail | undefined {
        this._seed();
        return this._details[id];
      },
      getActiveSuspensionByMemberId(memberId: string): LeaveDetail | undefined {
        this._seed();
        const row = this._rows.find(
          (r) =>
            r.member_id === memberId &&
            r.type === 'suspension' &&
            (r.status === 'suspended' || r.status === 'suspension_scheduled'),
        );
        return row ? this._details[row.id] : undefined;
      },
      _updateDetail(id: string, patch: Partial<LeaveDetail>): LeaveDetail | undefined {
        const detail = this._details[id];
        if (!detail) return undefined;
        const now = new Date()
          .toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(/\//g, '/')
          .replace(',', '');
        const updated: LeaveDetail = { ...detail, ...patch, updated_at: now };
        this._details[id] = updated;
        const listIdx = this._rows.findIndex((r) => r.id === id);
        if (listIdx !== -1 && patch.status)
          this._rows[listIdx] = { ...this._rows[listIdx]!, status: patch.status };
        if (patch.status && updated.member_id) {
          const memberIdx = getDb().members._members.findIndex(
            (m) => m.basic_info.id === updated.member_id,
          );
          if (memberIdx !== -1) {
            let memberStatus: MemberStatus | null = null;
            if (patch.status === 'suspended') memberStatus = 'suspended';
            else if (patch.status === 'suspension_scheduled') memberStatus = 'active';
            else if (patch.status === 'withdrawal_pending') memberStatus = 'pending_withdrawal';
            else if (patch.status === 'completed') memberStatus = 'force_withdrawn';
            if (memberStatus) {
              getDb().members._members[memberIdx] = {
                ...getDb().members._members[memberIdx]!,
                profile: { ...getDb().members._members[memberIdx]!.profile, status: memberStatus },
              };
            }
          }
        }
        return updated;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      approve(id: string, _comment?: string): LeaveDetail | undefined {
        this._seed();
        const detail = this._details[id];
        if (!detail) return undefined;
        let nextStatus: LeaveDetail['status'] | null = null;
        if (detail.type === 'suspension' && detail.status === 'suspension_scheduled')
          nextStatus = 'suspended';
        else if (detail.type === 'withdrawal' && detail.status === 'withdrawal_scheduled')
          nextStatus = 'withdrawal_pending';
        else return undefined;
        return this._updateDetail(id, { status: nextStatus });
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reject(id: string, _reason: string): LeaveDetail | undefined {
        this._seed();
        const detail = this._details[id];
        if (!detail) return undefined;
        const canReject =
          detail.status === 'suspension_scheduled' || detail.status === 'withdrawal_scheduled';
        if (!canReject) return undefined;
        const updated = this._updateDetail(id, { status: 'completed' });
        if (updated?.member_id) {
          const memberIdx = getDb().members._members.findIndex(
            (m) => m.basic_info.id === updated.member_id,
          );
          if (memberIdx !== -1)
            getDb().members._members[memberIdx] = {
              ...getDb().members._members[memberIdx]!,
              profile: { ...getDb().members._members[memberIdx]!.profile, status: 'active' },
            };
        }
        return updated;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      cancelWithdrawal(id: string, _comment?: string): LeaveDetail | undefined {
        this._seed();
        const detail = this._details[id];
        if (!detail) return undefined;
        if (detail.status !== 'withdrawal_scheduled') return undefined;
        const updated = this._updateDetail(id, { status: 'completed' });
        if (updated?.member_id) {
          const memberIdx = getDb().members._members.findIndex(
            (m) => m.basic_info.id === updated.member_id,
          );
          if (memberIdx !== -1)
            getDb().members._members[memberIdx] = {
              ...getDb().members._members[memberIdx]!,
              profile: { ...getDb().members._members[memberIdx]!.profile, status: 'active' },
            };
        }
        return updated;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      executeWithdrawal(id: string, _comment?: string): LeaveDetail | undefined {
        this._seed();
        const detail = this._details[id];
        if (!detail) return undefined;
        if (detail.status !== 'withdrawal_pending') return undefined;
        return this._updateDetail(id, { status: 'completed' });
      },
      create(input: { member_id: string; scheduled_date: string; reason: string }): LeaveDetail {
        this._seed();
        const member = getDb().members._members.find((m) => m.basic_info.id === input.member_id);
        const now = new Date()
          .toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(',', '');
        const newId = `LV-${String(this._rows.length + 1).padStart(3, '0')}`;
        const listItem: LeaveListItem = {
          id: newId,
          member_id: input.member_id,
          member_name: member?.basic_info.name_kanji ?? '',
          brand: member?.profile.brand ?? '',
          store_id: member?.profile.store_id ?? '',
          store_name: member?.profile.store_name ?? '',
          type: 'withdrawal',
          status: 'withdrawal_pending',
          applied_at: now.split(' ')[0]!,
          scheduled_date: input.scheduled_date,
          end_date: null,
          unpaid_amount: 0,
        };
        this._rows.push(listItem);
        const detail: LeaveDetail = {
          id: newId,
          member_id: input.member_id,
          member_name: listItem.member_name,
          brand: listItem.brand,
          store_id: listItem.store_id,
          store_name: listItem.store_name,
          type: 'withdrawal',
          status: 'withdrawal_pending',
          applied_at: now,
          scheduled_date: input.scheduled_date,
          end_date: null,
          reason: input.reason,
          applicant: `${listItem.member_name}（本人）`,
          is_proxy_applied: false,
          proxy_applicant: null,
          consent_at: null,
          consent_method: null,
          suspension_fee: null,
          applied_campaign: 'なし',
          unused_lessons: 0,
          unpaid_amount: 0,
          created_at: now,
          updated_at: now,
        };
        this._details[newId] = detail;
        return detail;
      },
      createSuspension(input: {
        member_id: string;
        start_month: string;
        end_month: string;
        reason?: string;
        is_proxy?: boolean;
        proxy_agreed_at?: string;
        proxy_method?: string;
      }): LeaveDetail {
        this._seed();
        const member = getDb().members._members.find((m) => m.basic_info.id === input.member_id);
        const now = new Date()
          .toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(',', '');
        const newId = `LV-${String(this._rows.length + 1).padStart(3, '0')}`;
        const listItem: LeaveListItem = {
          id: newId,
          member_id: input.member_id,
          member_name: member?.basic_info.name_kanji ?? '',
          brand: member?.profile.brand ?? '',
          store_id: member?.profile.store_id ?? '',
          store_name: member?.profile.store_name ?? '',
          type: 'suspension',
          status: 'suspension_scheduled',
          applied_at: now.split(' ')[0]!,
          scheduled_date: input.start_month,
          end_date: input.end_month,
          unpaid_amount: 0,
        };
        this._rows.push(listItem);
        const detail: LeaveDetail = {
          id: newId,
          member_id: input.member_id,
          member_name: listItem.member_name,
          brand: listItem.brand,
          store_id: listItem.store_id,
          store_name: listItem.store_name,
          type: 'suspension',
          status: 'suspension_scheduled',
          applied_at: now,
          scheduled_date: input.start_month,
          end_date: input.end_month,
          reason: input.reason ?? '',
          applicant: input.is_proxy
            ? `${listItem.member_name}（代理）`
            : `${listItem.member_name}（本人）`,
          is_proxy_applied: input.is_proxy ?? false,
          proxy_applicant: input.is_proxy ? 'スタッフ（代理）' : null,
          consent_at: input.proxy_agreed_at ?? null,
          consent_method: input.proxy_method ?? null,
          suspension_fee: 1100,
          applied_campaign: 'なし',
          unused_lessons: 0,
          unpaid_amount: 0,
          created_at: now,
          updated_at: now,
        };
        this._details[newId] = detail;
        return detail;
      },
    },

    memberBlacklist: {
      _rows: [] as BlacklistRow[],
      _seeded: false,
      _seed() {
        if (this._seeded) return;
        this._seeded = true;
        getDb().members._seed();

        const forceWithdrawn = getDb().members._members.filter(
          (m) => m.profile.status === MemberStatus.FORCE_WITHDRAWN,
        );
        const withdrawn = getDb().members._members.filter(
          (m) => m.profile.status === MemberStatus.WITHDRAWN,
        );
        const manualReasons: BlacklistRow['manualReason'][] = [
          'nuisance',
          'unpaid',
          'fraudulent_use',
          'other',
        ];
        const baseDate = new Date('2026-01-01');

        forceWithdrawn.forEach((m, i) => {
          const registeredAt = new Date(baseDate);
          registeredAt.setDate(registeredAt.getDate() + i * 14);
          this._rows.push({
            id: `BL-FW-${String(i + 1).padStart(3, '0')}`,
            memberId: m.basic_info.member_number,
            memberName: m.basic_info.name_kanji,
            storeName: m.profile.store_name,
            registrationSource: 'forced_withdrawal',
            manualReason: null,
            unpaidAmount: i % 3 === 0 ? (i + 1) * 3300 : 0,
            registeredAt: registeredAt.toISOString(),
            memo: null,
            registeredBy: 'System',
            matchConditions: {
              nameAndBirthdate: true,
              email: i % 2 === 0,
              phone: i % 3 !== 0,
              address: i % 4 === 0,
            },
          });
        });

        const staffNames = ['佐藤 花子', '鈴木 次郎', '高橋 美咲', '田中 健一', '伊藤 直子'];
        withdrawn.slice(0, 5).forEach((m, i) => {
          const registeredAt = new Date(baseDate);
          registeredAt.setDate(registeredAt.getDate() + i * 21 + 7);
          this._rows.push({
            id: `BL-MN-${String(i + 1).padStart(3, '0')}`,
            memberId: m.basic_info.member_number,
            memberName: m.basic_info.name_kanji,
            storeName: m.profile.store_name,
            registrationSource: 'manual',
            manualReason: manualReasons[i % manualReasons.length]!,
            unpaidAmount: i % 2 === 0 ? (i + 1) * 1100 : 0,
            registeredAt: registeredAt.toISOString(),
            memo: i % 2 === 0 ? '手動登録済み' : null,
            registeredBy: staffNames[i % staffNames.length]!,
            matchConditions: {
              nameAndBirthdate: i % 2 === 0,
              email: i % 3 !== 0,
              phone: true,
              address: i % 2 !== 0,
            },
          });
        });
      },
      getList(): BlacklistRow[] {
        this._seed();
        return this._rows;
      },
      getById(id: string): BlacklistRow | undefined {
        this._seed();
        return this._rows.find((r) => r.id === id);
      },
      create(input: Omit<BlacklistRow, 'id' | 'registeredAt'>): BlacklistRow {
        this._seed();
        const newRow: BlacklistRow = {
          ...input,
          id: `BL-${Date.now()}`,
          registeredAt: new Date().toISOString(),
        };
        this._rows.push(newRow);
        return newRow;
      },
    },
  };
}
