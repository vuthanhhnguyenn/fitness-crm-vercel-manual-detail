import type { TransferRow } from '../seeds/transfer.seed';

/** Who performed an approve / reject / unlock, resolved server-side from the authenticated user. */
export type TransferActor = {
  name: string;
  role: string;
  /** Which side of the transfer the actor acted as. `null` for HQ/System/Manager. */
  store_type: 'from' | 'to' | null;
};

/**
 * Why a state transition was refused. Returned instead of a bare `undefined` so route handlers
 * can map each cause to its own status code (404 / 400 / 409) rather than guessing.
 */
export type TransferActionFailure =
  | 'not_found'
  /** Already 完了 or 否認 — nothing left to decide. */
  | 'terminal'
  | 'invalid_transition'
  /** JOYFIT row blocked by an unresolved auto-transfer exclusion (FR-006 → 409). */
  | 'excluded'
  /** Unlock attempted on a row that carries no campaign lock (→ 409). */
  | 'no_campaign_lock';

export type TransferActionResult =
  | { ok: true; row: TransferRow }
  | { ok: false; reason: TransferActionFailure };

export type TransfersType = {
  _rows: TransferRow[];
  getAll(): TransferRow[];
  getById(id: string): TransferRow | undefined;
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
    /** Auto-transfer eligibility, derived from the member's constraints at creation time. */
    exclusion_reasons?: TransferRow['exclusion_reasons'];
    unpaid_amount?: number | null;
    unpaid_period?: string | null;
    campaign_lock_remaining_days?: number | null;
    // A-01 FR-017: 代理申請の証跡
    is_proxy?: boolean;
    proxy_agreed_at?: string;
    proxy_method?: string;
  }): TransferRow;
  /** True when this JOYFIT row still carries an unresolved auto-transfer exclusion. */
  isBlockedByExclusion(row: TransferRow): boolean;
  approve(id: string, actor: TransferActor, comment?: string): TransferActionResult;
  reject(id: string, actor: TransferActor, comment?: string): TransferActionResult;
  unlock(id: string, reason: string, operatorName: string): TransferActionResult;
};
