import type { DbType } from '../_db.types';
import {
  ORIGIN_STAGE_STATUSES,
  TERMINAL_STATUSES,
  TRANSFER_SEED_DATA,
  type TransferRow,
  TransferStatus,
  buildApprovalHistory,
} from '../seeds/transfer.seed';
import type { TransferActionResult, TransferActor } from '../types/transfers.type';

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
        applicant_name?: string;
        applicant_role?: string;
        exclusion_reasons?: TransferRow['exclusion_reasons'];
        unpaid_amount?: number | null;
        unpaid_period?: string | null;
        campaign_lock_remaining_days?: number | null;
        // A-01 FR-017: carried through so a staff-made transfer keeps its 代理申請 trail
        is_proxy?: boolean;
        proxy_agreed_at?: string;
        proxy_method?: string;
      }): TransferRow {
        const now = new Date().toISOString();
        const id = `TR-${String(this._rows.length + 1).padStart(3, '0')}`;
        const brand = input.brand as TransferRow['brand'];
        const isJoyfit = brand === 'joyfit';
        const exclusions = isJoyfit ? (input.exclusion_reasons ?? []) : [];
        const newRow: TransferRow = {
          id,
          member_id: input.member_id,
          member_name: input.member_name,
          from_store_id: input.from_store_id,
          from_store_name: input.from_store_name,
          to_store_id: input.to_store_id,
          to_store_name: input.to_store_name,
          brand,
          applied_at: now,
          scheduled_date: now,
          status: TransferStatus.Pending,
          // FR-006: eligibility is JOYFIT-only and is derived from the exclusions, so the
          // `exclusion_reasons` non-empty ⟺ `auto_transfer_eligible === false` invariant holds.
          auto_transfer_eligible: isJoyfit ? exclusions.length === 0 : null,
          exclusion_reasons: exclusions,
          unpaid_amount: exclusions.includes('unpaid') ? (input.unpaid_amount ?? 0) : null,
          campaign_lock_remaining_days: exclusions.includes('campaign_lock')
            ? (input.campaign_lock_remaining_days ?? 0)
            : null,
          reason: input.reason ?? '',
          is_proxy: input.is_proxy,
          proxy_agreed_at: input.proxy_agreed_at,
          proxy_method: input.proxy_method,
          applicant_name: input.applicant_name ?? 'スタッフ',
          applicant_role: input.applicant_role ?? 'スタッフ',
          updated_at: now,
          // FR-007: brand-aware. The pre-update version hardcoded a FIT365-shaped 3-step
          // history for every brand, so JOYFIT requests showed a 移籍先承認 step that never runs.
          approval_history: buildApprovalHistory(brand, TransferStatus.Pending, now),
          unpaid_period: exclusions.includes('unpaid') ? (input.unpaid_period ?? null) : null,
          decisions: [],
          unlock: null,
        };
        this._rows.push(newRow);
        return newRow;
      },

      /**
       * FR-006. A JOYFIT row with any remaining exclusion reason may not be approved, even
       * through a direct API call. `unlock()` clears the campaign lock; nothing clears 未納.
       */
      isBlockedByExclusion(row: TransferRow): boolean {
        return row.brand === 'joyfit' && row.exclusion_reasons.length > 0;
      },

      /**
       * Moves the member's primary contract store to the transfer's destination — the whole
       * point of a transfer, and something no code path performed before this change
       * (FR-010 / FR-011).
       */
      _applyCompletionSideEffect(row: TransferRow): void {
        const members = getDb().members;
        members._seed();
        const idx = members._members.findIndex((m) => m.memberId === row.member_id);
        if (idx === -1) return;
        const current = members._members[idx]!;
        const destination = getDb().stores.getById(row.to_store_id);
        members._members[idx] = {
          ...current,
          primaryStore: {
            ...current.primaryStore,
            storeId: row.to_store_id,
            code: destination?.club_code ?? current.primaryStore.code,
            name: destination?.name ?? row.to_store_name,
          },
        };
      },

      approve(id: string, actor: TransferActor, comment?: string): TransferActionResult {
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return { ok: false, reason: 'not_found' };
        const row = this._rows[idx]!;
        if (TERMINAL_STATUSES.includes(row.status as TransferStatus)) {
          return { ok: false, reason: 'terminal' };
        }

        const atOriginStage = ORIGIN_STAGE_STATUSES.includes(row.status as TransferStatus);
        const atDestinationStage = row.status === TransferStatus.FromStoreApproved;

        // The origin store's approval is what triggers automatic execution, so the exclusion
        // guard belongs here. A FIT365 row never carries exclusions.
        if (atOriginStage && this.isBlockedByExclusion(row)) {
          return { ok: false, reason: 'excluded' };
        }

        const now = new Date().toISOString();
        let nextStatus: TransferRow['status'];
        // Step numbers follow the brand-aware history: JOYFIT [申請, 移籍元承認, 自動実行],
        // FIT365 [申請, 移籍元承認, 移籍先承認, 移籍実行].
        let completedSteps: number[];

        if (atOriginStage) {
          if (row.brand === 'joyfit') {
            // JOYFIT auto-executes on origin approval — it must not stall at an intermediate
            // state the way the pre-update code did (it left JOYFIT permanently stuck).
            nextStatus = TransferStatus.Completed;
            completedSteps = [2, 3];
          } else {
            nextStatus = TransferStatus.FromStoreApproved;
            completedSteps = [2];
          }
        } else if (atDestinationStage && row.brand === 'fit365') {
          nextStatus = TransferStatus.Completed;
          completedSteps = [3, 4];
        } else {
          return { ok: false, reason: 'invalid_transition' };
        }

        const updated: TransferRow = {
          ...row,
          status: nextStatus,
          updated_at: now,
          approval_history: row.approval_history.map((step) =>
            completedSteps.includes(step.step)
              ? {
                  ...step,
                  completed: true,
                  completed_at: now,
                  // An automatic step is executed by the system, not by the approver.
                  completed_by: step.is_automatic ? null : actor.name,
                }
              : step,
          ),
          // FR-008: the comment is persisted. The pre-update implementation validated it and
          // then threw it away.
          decisions: [
            ...row.decisions,
            {
              action: 'approve',
              comment: comment?.trim() ? comment.trim() : null,
              actor_name: actor.name,
              actor_role: actor.role,
              store_type: actor.store_type,
              decided_at: now,
            },
          ],
        };
        this._rows[idx] = updated;

        if (nextStatus === TransferStatus.Completed) {
          this._applyCompletionSideEffect(updated);
        }
        return { ok: true, row: updated };
      },

      reject(id: string, actor: TransferActor, comment?: string): TransferActionResult {
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return { ok: false, reason: 'not_found' };
        const row = this._rows[idx]!;
        if (TERMINAL_STATUSES.includes(row.status as TransferStatus)) {
          return { ok: false, reason: 'terminal' };
        }
        const now = new Date().toISOString();
        const updated: TransferRow = {
          ...row,
          status: TransferStatus.Rejected,
          updated_at: now,
          // The rejected step is recorded as decided-but-not-approved: it keeps its
          // `completed: false` so the timeline shows where the flow stopped, while the
          // decision log carries who rejected it and why.
          approval_history: row.approval_history,
          decisions: [
            ...row.decisions,
            {
              action: 'reject',
              comment: comment?.trim() ? comment.trim() : null,
              actor_name: actor.name,
              actor_role: actor.role,
              store_type: actor.store_type,
              decided_at: now,
            },
          ],
        };
        this._rows[idx] = updated;
        return { ok: true, row: updated };
      },

      /**
       * FR-012 manual override. Releases only the campaign lock — a co-present 未納 keeps the
       * row excluded, matching the V0 where the unpaid alert carries no override control.
       */
      unlock(id: string, reason: string, operatorName: string): TransferActionResult {
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return { ok: false, reason: 'not_found' };
        const row = this._rows[idx]!;
        if (!row.exclusion_reasons.includes('campaign_lock')) {
          return { ok: false, reason: 'no_campaign_lock' };
        }
        const now = new Date().toISOString();
        const remaining = row.exclusion_reasons.filter((r) => r !== 'campaign_lock');
        const updated: TransferRow = {
          ...row,
          exclusion_reasons: remaining,
          auto_transfer_eligible: row.brand === 'joyfit' ? remaining.length === 0 : null,
          // Kept so the detail screen can still report what was overridden (PAR049).
          campaign_lock_remaining_days: row.campaign_lock_remaining_days,
          unlock: { reason: reason.trim(), operator_name: operatorName, unlocked_at: now },
          updated_at: now,
        };
        this._rows[idx] = updated;
        return { ok: true, row: updated };
      },
    },
  };
}
