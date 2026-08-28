import { nowJst } from '@/app/api/_lib/jst';
import type {
  CancellationBlockedReason,
  LeaveDetail,
  LeaveListItem,
} from '@/app/api/_schemas/leave.schema';

import { MemberStatus } from '@/lib/api/types.gen';

import type { DbType } from '../_db.types';
import {
  buildApplicationNumber,
  buildLeaveSeed,
  deriveSuspensionHistory,
  memberFullName,
  toLeaveMember,
} from '../seeds/member-leave.seed';

/** Result of a cancellation attempt — the route maps `reason` onto 409 / 422. */
export type CancelWithdrawalResult =
  | { ok: true; leave: LeaveDetail }
  | { ok: false; reason: CancellationBlockedReason };

export function createMemberLeaveTables(getDb: () => DbType) {
  return {
    memberLeaves: {
      _rows: [] as LeaveListItem[],
      _details: {} as Record<string, LeaveDetail>,
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        getDb().members._seed();
        const { rows, details } = buildLeaveSeed(getDb().members._members);
        this._rows = rows;
        this._details = details;
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

      /**
       * `suspension_history` is a projection over the member's live rows, not a stored
       * column, so every write that adds, removes or re-states one of those rows has to
       * rebuild it — for **all** of the member's applications, since each detail carries
       * the same member-wide strip. Without this a cancelled withdrawal keeps showing its
       * month as 退会予定 right next to the 取り消し済み status card.
       */
      _refreshMemberHistory(memberId: string): void {
        const memberRows = this._rows.filter((r) => r.member_id === memberId);
        const history = deriveSuspensionHistory(memberRows);
        for (const [detailId, detail] of Object.entries(this._details)) {
          if (detail.member.member_id !== memberId) continue;
          this._details[detailId] = { ...detail, suspension_history: history };
        }
      },

      _updateDetail(id: string, patch: Partial<LeaveDetail>): LeaveDetail | undefined {
        const detail = this._details[id];
        if (!detail) return undefined;

        const updated: LeaveDetail = { ...detail, ...patch, updated_at: nowJst() };
        this._details[id] = updated;

        // `completed` and `cancelled` are detail-only states — a row carrying either has
        // already left the list, so there is nothing to mirror (Q-10).
        const listIdx = this._rows.findIndex((r) => r.id === id);
        if (
          listIdx !== -1 &&
          patch.status &&
          patch.status !== 'completed' &&
          patch.status !== 'cancelled'
        ) {
          this._rows[listIdx] = {
            ...this._rows[listIdx]!,
            status: patch.status,
          };
        }

        if (patch.status) {
          const memberId = detail.member.member_id;
          const memberIdx = getDb().members._members.findIndex((m) => m.memberId === memberId);
          if (memberIdx !== -1) {
            let memberStatus: MemberStatus | null = null;
            if (patch.status === 'suspended') memberStatus = 'suspended';
            else if (patch.status === 'suspension_scheduled') memberStatus = 'active';
            else if (patch.status === 'withdrawal_pending') memberStatus = 'pending_withdrawal';
            else if (patch.status === 'completed') memberStatus = 'forced_withdrawal';
            // A cancelled application returns the member to a normal, active state (FR-002).
            else if (patch.status === 'cancelled') memberStatus = 'active';
            if (memberStatus) {
              getDb().members._members[memberIdx] = {
                ...getDb().members._members[memberIdx]!,
                memberStatus,
              };
            }
          }
        }

        // A status change re-states the member's rows, so the strip has to be rebuilt.
        if (patch.status) {
          this._refreshMemberHistory(detail.member.member_id);
          return this._details[id];
        }

        return updated;
      },

      /**
       * A-03 FR-049 – FR-052. Guard chain evaluated in order at execution time —
       * never trusted from the caller's loaded row. Not idempotent: a second call
       * on the same application fails at guard 1.
       */
      cancelWithdrawal(id: string, executor: string): CancelWithdrawalResult {
        this._seed();
        const detail = this._details[id];
        if (!detail) return { ok: false, reason: 'not_cancellable_status' };

        // Guard 1 — the withdrawal batch owns the row once the due date arrives.
        if (detail.status === 'withdrawal_pending') {
          return { ok: false, reason: 'batch_processing_started' };
        }
        // Guard 2 — any other non-scheduled state is simply not cancellable.
        if (detail.type !== 'withdrawal' || detail.status !== 'withdrawal_scheduled') {
          return { ok: false, reason: 'not_cancellable_status' };
        }
        // Guard 3 — cancellation is allowed only before the usage start date.
        if (detail.usage_start_date !== null && new Date(detail.usage_start_date) <= new Date()) {
          return { ok: false, reason: 'usage_started' };
        }

        // The application closes as `cancelled` — never `completed`, which means the
        // withdrawal was actually executed. `_updateDetail` returns the member to
        // `active` for this status, and the row leaves the list either way (Q-10).
        // FR-002 — who cancelled it, and when, is recorded on the application.
        const updated = this._updateDetail(id, {
          status: 'cancelled',
          cancellable: false,
          cancellation_blocked_reason: 'not_cancellable_status',
          cancelled_by: executor,
          cancelled_at: nowJst(),
        });
        if (!updated) return { ok: false, reason: 'not_cancellable_status' };

        this._rows = this._rows.filter((r) => r.id !== id);
        // Rebuilt after the removal, so the cancelled month drops out of the strip.
        this._refreshMemberHistory(detail.member.member_id);

        return { ok: true, leave: this._details[id]! };
      },

      /**
       * Member-side withdrawal application (A-01-01). Consumed by `members.table.ts`.
       */
      create(input: { member_id: string; scheduled_date: string; reason: string }): LeaveDetail {
        this._seed();
        const member = getDb().members._members.find((m) => m.memberId === input.member_id);
        const now = nowJst();
        const index = this._rows.length;
        const id = `lv-${String(index + 1).padStart(3, '0')}`;
        const applicationNumber = buildApplicationNumber(index);

        const listItem: LeaveListItem = {
          id,
          application_number: applicationNumber,
          member_id: input.member_id,
          member_number: member?.memberNumber ?? '',
          member_name: member ? memberFullName(member) : '',
          brand: member?.primaryStore.brandEnum ?? 'joyfit',
          store_id: member?.primaryStore.storeId ?? '',
          store_name: member?.primaryStore.name ?? '',
          type: 'withdrawal',
          status: 'withdrawal_pending',
          applied_at: now.split(' ')[0]!,
          scheduled_date: input.scheduled_date,
          end_date: null,
          unpaid_amount: 0,
          cancellable: false,
          cancellation_blocked_reason: 'batch_processing_started',
        };
        this._rows.push(listItem);

        const detail: LeaveDetail = {
          id,
          application_number: applicationNumber,
          member: member
            ? toLeaveMember(member)
            : {
                member_id: input.member_id,
                member_number: '',
                name: '',
                name_kana: null,
                legacy_member_code: null,
                member_type: null,
                contract_name: null,
                store_name: '',
                face_photo_url: null,
              },
          brand: listItem.brand,
          store_id: listItem.store_id,
          store_name: listItem.store_name,
          type: 'withdrawal',
          status: 'withdrawal_pending',
          applied_at: now,
          // The member-side route raises an already-approved application (A-03 L68-L70).
          approved_at: now,
          scheduled_date: input.scheduled_date,
          end_date: null,
          reason: input.reason,
          applicant: `${listItem.member_name}（本人）`,
          is_proxy_applied: false,
          proxy_applicant: null,
          consent_at: null,
          consent_method: null,
          suspension_fee: null,
          withdrawal_fee: 3300,
          applied_campaign: 'なし',
          unused_lessons: 0,
          unpaid_amount: 0,
          usage_start_date: null,
          cancellable: false,
          cancellation_blocked_reason: 'batch_processing_started',
          cancelled_by: null,
          cancelled_at: null,
          suspension_history: deriveSuspensionHistory(
            this._rows.filter((r) => r.member_id === input.member_id),
          ),
          created_at: now,
          updated_at: now,
        };
        this._details[id] = detail;
        // The new row changes the member's strip, including on their other applications.
        this._refreshMemberHistory(input.member_id);
        return this._details[id]!;
      },

      /**
       * Member-side suspension application (A-01-01). Consumed by `members.table.ts`.
       */
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
        const member = getDb().members._members.find((m) => m.memberId === input.member_id);
        const now = nowJst();
        const index = this._rows.length;
        const id = `lv-${String(index + 1).padStart(3, '0')}`;
        const applicationNumber = buildApplicationNumber(index);

        const listItem: LeaveListItem = {
          id,
          application_number: applicationNumber,
          member_id: input.member_id,
          member_number: member?.memberNumber ?? '',
          member_name: member ? memberFullName(member) : '',
          brand: member?.primaryStore.brandEnum ?? 'joyfit',
          store_id: member?.primaryStore.storeId ?? '',
          store_name: member?.primaryStore.name ?? '',
          type: 'suspension',
          status: 'suspension_scheduled',
          applied_at: now.split(' ')[0]!,
          scheduled_date: input.start_month,
          end_date: input.end_month,
          unpaid_amount: 0,
          cancellable: false,
          cancellation_blocked_reason: 'not_cancellable_status',
        };
        this._rows.push(listItem);

        const proxyMethod = input.proxy_method;
        const detail: LeaveDetail = {
          id,
          application_number: applicationNumber,
          member: member
            ? toLeaveMember(member)
            : {
                member_id: input.member_id,
                member_number: '',
                name: '',
                name_kana: null,
                legacy_member_code: null,
                member_type: null,
                contract_name: null,
                store_name: '',
                face_photo_url: null,
              },
          brand: listItem.brand,
          store_id: listItem.store_id,
          store_name: listItem.store_name,
          type: 'suspension',
          status: 'suspension_scheduled',
          applied_at: now,
          // The member-side route raises an already-approved application (A-03 L68-L70).
          approved_at: now,
          scheduled_date: input.start_month,
          end_date: input.end_month,
          reason: input.reason ?? '',
          applicant: input.is_proxy
            ? `${listItem.member_name}（代理）`
            : `${listItem.member_name}（本人）`,
          is_proxy_applied: input.is_proxy ?? false,
          proxy_applicant: input.is_proxy ? 'スタッフ（代理）' : null,
          consent_at: input.proxy_agreed_at ?? null,
          consent_method:
            proxyMethod === 'in_person' ||
            proxyMethod === 'phone' ||
            proxyMethod === 'email' ||
            proxyMethod === 'line'
              ? proxyMethod
              : null,
          suspension_fee: 1100,
          withdrawal_fee: null,
          applied_campaign: 'なし',
          unused_lessons: 0,
          unpaid_amount: 0,
          usage_start_date: null,
          cancellable: false,
          cancellation_blocked_reason: 'not_cancellable_status',
          cancelled_by: null,
          cancelled_at: null,
          suspension_history: deriveSuspensionHistory(
            this._rows.filter((r) => r.member_id === input.member_id),
          ),
          created_at: now,
          updated_at: now,
        };
        this._details[id] = detail;
        // The new row changes the member's strip, including on their other applications.
        this._refreshMemberHistory(input.member_id);
        return this._details[id]!;
      },
    },
  };
}
