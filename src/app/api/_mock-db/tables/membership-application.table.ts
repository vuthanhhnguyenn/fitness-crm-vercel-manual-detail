import type {
  DirectEnrollmentRequest,
  FeeRow,
  GetMembershipApplicationsQuery,
  GetMembershipApplicationsResponse,
  MembershipApplication,
  MembershipApplicationStatus,
  RejectionReason,
  TimelineEntry,
} from '@/app/api/_schemas/membership-application.schema';
import { calcAge } from '@/utils/age.util';
import { addHours, differenceInCalendarDays, getDaysInMonth, parseISO } from 'date-fns';

import type { DbType } from '../_db.types';
import type {
  MembershipApplicationDetailRow,
  MembershipApplicationRow,
} from '../seeds/membership-application.seed';
import {
  SEED_MEMBERSHIP_APPLICATIONS,
  buildSeedDetails,
} from '../seeds/membership-application.seed';
import type {
  ApproveFailure,
  CancelFailure,
  MembershipApplicationDetail,
  MemoFailure,
  RejectFailure,
} from '../types/membership-applications.type';

/** Review-flow rank (FR-010, research R5) — alphabetical order reads wrong for a queue. */
const STATUS_RANK: Record<MembershipApplicationStatus, number> = {
  pending: 0,
  review: 1,
  approved: 2,
  auto_approved: 3,
  rejected: 4,
  cancelled: 5,
};

/** Minimum enrolment age per brand (FR-046). */
const BRAND_MIN_AGE: Record<string, number> = { JOYFIT: 15, FIT365: 16 };
const DEFAULT_MIN_AGE = 16;

/**
 * Plan/campaign name lookups for the admin enrolment form (FR-061). These ids
 * are membership-applications' own vocabulary — the same one the seed already
 * uses (`membership-application.seed.ts`) — not the unrelated `mainContracts`
 * brand-management table, whose id/brand scheme does not line up with this
 * feature's `brand_name` values.
 */
const PLAN_NAME_BY_ID: Record<string, string> = {
  'PLN-001': 'レギュラー会員',
  'PLN-002': 'デイタイム会員',
  'PLN-003': 'ナイト会員',
  'PLN-004': 'ウィークエンド会員',
  'PLN-005': 'レギュラー会員（学生）',
  'PLN-006': 'レギュラー会員（シニア）',
};

const PLAN_MONTHLY_FEE_BY_ID: Record<string, number> = {
  'PLN-001': 7700,
  'PLN-002': 6600,
  'PLN-003': 5500,
  'PLN-004': 4400,
  'PLN-005': 5500,
  'PLN-006': 6600,
};
const DEFAULT_PLAN_MONTHLY_FEE = 7700;

const CAMPAIGN_NAME_BY_ID: Record<string, string> = {
  'CMP-001': '春の入会キャンペーン',
  'CMP-002': '学生割引キャンペーン',
  'CMP-003': '友達紹介キャンペーン',
  'CMP-004': '新生活応援',
  'CMP-005': 'シニア割引キャンペーン',
  'CMP-006': '法人会員キャンペーン',
};

const REGISTRATION_FEE = 3300;
const CARD_ISSUANCE_FEE = 5500;
const SAME_DAY_CANCEL_LIMIT = 2;

/**
 * ⚠️ PROVISIONAL — enrolment-fee exemption window (FR-025 / FR-026 / FR-025a).
 * See the precedence comment in `resolveEnrollmentFeeExemption` below.
 */
const REJOIN_EXEMPT_DAYS = 180;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  const jst = addHours(new Date(), 9);
  return `${jst.toISOString().slice(0, 19)}+09:00`;
}

/** Dots for everything but the trailing 4 characters, capped at 8 dots (V0 parity). */
function maskTail(value: string): string {
  if (value.length <= 4) return '●'.repeat(value.length);
  return '●'.repeat(Math.min(value.length - 4, 8)) + value.slice(-4);
}

function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  return differenceInCalendarDays(parseISO(toIsoDate), parseISO(fromIsoDate));
}

/** First-month fee prorated from the usage start date to the end of that month (FR-054). */
function proratedFirstMonthFee(usageStartDate: string, monthlyFee: number): number {
  const [y, m, d] = usageStartDate.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const daysInMonth = getDaysInMonth(new Date(y, m - 1, 1));
  const remainingDays = daysInMonth - d + 1;
  return Math.round((monthlyFee * remainingDays) / daysInMonth);
}

function brandMinAge(brandName: string): number {
  return BRAND_MIN_AGE[brandName] ?? DEFAULT_MIN_AGE;
}

function prepaymentRuleLabel(brandName: string): string {
  return brandName === 'FIT365' ? 'FIT365: 2ヶ月固定' : 'JOYFIT: 主契約マスタ設定';
}

function buildFeeRows(
  row: MembershipApplicationRow,
  detail: MembershipApplicationDetailRow,
  enrollmentFeeAmount: number,
): FeeRow[] {
  const prorated = proratedFirstMonthFee(row.usage_start_date, detail.monthly_fee);
  if (row.brand_name === 'FIT365') {
    return [
      { key: 'card_issuance_fee', label: 'カード発行料', amount: CARD_ISSUANCE_FEE },
      { key: 'prorated_first_month', label: '初月会費（日割）', amount: prorated },
      { key: 'next_month', label: '翌月会費', amount: detail.monthly_fee },
    ];
  }
  return [
    { key: 'enrollment_fee', label: '入会金', amount: enrollmentFeeAmount },
    { key: 'registration_fee', label: '登録事務手数料', amount: REGISTRATION_FEE },
    { key: 'prorated_first_month', label: '初月会費（日割）', amount: prorated },
    { key: 'next_month', label: '翌月会費', amount: detail.monthly_fee },
  ];
}

/**
 * ⚠️ PROVISIONAL — enrolment-fee exemption resolution (FR-025 / FR-026 / FR-025a).
 *
 * The precedence encoded immediately below — **campaign → re-enrolment (180-day
 * window) → staff-discretionary, first match wins, never stacking, and applied to
 * the 入会金 line only** — is *provisional*. It is reproduced from the V0
 * prototype, it is **absent from C-01 revision 260624_v5**, and it is **pending PO
 * confirmation**. The prototype's own source carries the note
 * 「複数免除が同時成立した場合の優先順位は要確認」 — the precedence when several
 * exemptions hold at once is explicitly unresolved there.
 *
 * Do not read this ordering as a settled requirement. Largest-discount-wins and
 * additive stacking were deferred, not rejected; if C-01 documents the exemption
 * model, re-open FR-025 / FR-026 rather than treating this function as the spec.
 *
 * The mirror of this comment lives at the other site where the exemption is
 * decided for a reader: the detail screen's fee card
 * (`membership-applications/[id]/_components/fee-payment-card.tsx`).
 */
function resolveEnrollmentFeeExemption(
  row: MembershipApplicationRow,
  detail: MembershipApplicationDetailRow,
  enrollmentFeeAmount: number,
): MembershipApplicationDetail['enrollment_fee_exemption'] {
  // The exemption is determined at review time, but must keep reducing the fee
  // total after a decision so the displayed total stays consistent with what was
  // actually charged/recorded at approval (BUG-C01B-06) — it just stops being
  // editable once no longer 未審査 (gated separately in fee-payment-card.tsx).
  if (row.status !== 'pending' && row.status !== 'approved' && row.status !== 'auto_approved') {
    return undefined;
  }
  // 入会金 only: FIT365 charges a card-issue fee instead and has no 入会金 line.
  if (row.brand_name === 'FIT365') return undefined;

  const previous = detail.previous_withdrawal_date;
  const daysSinceWithdrawal = previous ? daysBetween(previous, todayIso()) : null;
  const rejoinQualifies = daysSinceWithdrawal !== null && daysSinceWithdrawal <= REJOIN_EXEMPT_DAYS;

  const base = {
    original_amount: enrollmentFeeAmount,
    previous_withdrawal_date: previous,
    rejoin_window_days: REJOIN_EXEMPT_DAYS,
    campaign_name: row.campaign_name,
  };

  // ⚠️ First match wins — see the provisional note above.
  if (row.campaign_id !== null) {
    return {
      ...base,
      kind: 'campaign',
      discount_amount: enrollmentFeeAmount,
      reason: null,
      rule_label: null,
      qualifies: true,
    };
  }

  if (rejoinQualifies) {
    return {
      ...base,
      kind: 'rejoin',
      discount_amount: enrollmentFeeAmount,
      reason: null,
      rule_label: `退会から${REJOIN_EXEMPT_DAYS}日以内の再入会`,
      qualifies: true,
    };
  }

  // A staff-discretionary exemption takes effect only once a reason is recorded.
  const staffReason = detail.staff_exemption_reason?.trim() ?? '';
  if (staffReason.length > 0) {
    return {
      ...base,
      kind: 'staff',
      discount_amount: enrollmentFeeAmount,
      reason: staffReason,
      rule_label: `退会から${REJOIN_EXEMPT_DAYS}日以内の再入会`,
      qualifies: true,
    };
  }

  return {
    ...base,
    kind: 'none',
    discount_amount: 0,
    reason: null,
    rule_label: `退会から${REJOIN_EXEMPT_DAYS}日以内の再入会`,
    qualifies: false,
  };
}

function toListItem(row: MembershipApplicationRow): MembershipApplication {
  return {
    id: row.id,
    applicant_name: row.applicant_name,
    status: row.status,
    enrollment_route: row.enrollment_route,
    blacklist_state: row.blacklist_state,
    brand_id: row.brand_id,
    brand_name: row.brand_name,
    store_id: row.store_id,
    store_name: row.store_name,
    plan_name: row.plan_name,
    campaign_name: row.campaign_name,
    application_date: row.application_date,
    usage_start_date: row.usage_start_date,
    is_minor: row.is_minor,
  };
}

// Result sentinels returned by the guarded mutations (data-model §5) — canonical
// definitions live in `../types/membership-applications.type` (imported above)
// to avoid duplicating these unions across the table and type-contract files.

export function createMembershipApplicationTables(getDb: () => DbType) {
  return {
    membershipApplications: {
      _rows: [] as MembershipApplicationRow[],
      _details: {} as Record<string, MembershipApplicationDetailRow>,
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_MEMBERSHIP_APPLICATIONS.map((r) => ({ ...r }));
        this._details = buildSeedDetails();
      },

      /** The enrolment-fee master amount backing this application's 入会金 line. */
      _enrollmentFeeAmount(detail: MembershipApplicationDetailRow): number {
        const masterId = detail.enrollment_fee_master_id;
        if (!masterId) return 0;
        const master = getDb()
          .enrollmentFeeMasters.getAll()
          .find((m) => m.id === masterId);
        return master?.amount ?? 0;
      },

      /** Narrows the row set to the caller's store scope. `null` means unrestricted. */
      _scoped(allowedStoreIds: string[] | null): MembershipApplicationRow[] {
        this._seed();
        if (allowedStoreIds === null) return this._rows;
        return this._rows.filter((r) => allowedStoreIds.includes(r.store_id));
      },

      /** Resets the same-day counter when its recorded date is not today. */
      _sameDayCount(detail: MembershipApplicationDetailRow): number {
        return detail.same_day_cancel_date === todayIso() ? detail.same_day_cancel_count : 0;
      },

      _toDetail(row: MembershipApplicationRow): MembershipApplicationDetail {
        const detail = this._details[row.id]!;
        const enrollmentFeeAmount = this._enrollmentFeeAmount(detail);
        const exemption = resolveEnrollmentFeeExemption(row, detail, enrollmentFeeAmount);
        const feeRows = buildFeeRows(row, detail, enrollmentFeeAmount).map((r) =>
          r.key === 'enrollment_fee' && exemption && exemption.discount_amount > 0
            ? { ...r, struck_through: true }
            : r,
        );
        const feeTotal =
          feeRows.reduce((sum, r) => sum + r.amount, 0) - (exemption?.discount_amount ?? 0);

        return {
          ...toListItem(row),
          applicant_kana: row.applicant_kana,
          birth_date: detail.birth_date,
          age: detail.age,
          gender_label: detail.gender_label,
          phone_masked: maskTail(detail.phone_real),
          phone_real: detail.phone_real,
          email_masked: maskTail(detail.email_real),
          email_real: detail.email_real,
          address_masked: maskTail(detail.address_real),
          address_real: detail.address_real,
          face_photo_registered: detail.face_photo_registered,
          face_photo_registered_at: detail.face_photo_registered_at,
          blacklist_conditions:
            row.blacklist_state === 'matched' ? detail.blacklist_conditions : [],
          plan_id: row.plan_id,
          monthly_fee: detail.monthly_fee,
          prepayment_months: detail.prepayment_months,
          prepayment_rule_label: prepaymentRuleLabel(row.brand_name),
          options: detail.options,
          payment_method: detail.payment_method,
          card_last4: detail.card_last4,
          contract_start_date: row.contract_start_date,
          fee_rows: feeRows,
          fee_total: feeTotal,
          enrollment_fee_exemption: exemption,
          brand_min_age: brandMinAge(row.brand_name),
          parental_consent: detail.parental_consent,
          parental_consent_at: detail.parental_consent_at,
          parental_consent_method: detail.parental_consent_method,
          application_source: detail.application_source,
          proxy_staff_name: detail.proxy_staff_name,
          proxy_staff_id: detail.proxy_staff_id,
          agreement_datetime: detail.agreement_datetime,
          updated_at: row.updated_at,
          companion_upgrade: detail.companion_upgrade,
          approved_by: detail.approved_by,
          approved_at: detail.approved_at,
          rejected_by: detail.rejected_by,
          rejected_at: detail.rejected_at,
          rejection_reason: detail.rejection_reason,
          rejection_supplement: detail.rejection_supplement,
          cancelled_by: detail.cancelled_by,
          cancelled_at: detail.cancelled_at,
          cancellation_reason: detail.cancellation_reason,
          same_day_cancel_count: this._sameDayCount(detail),
          same_day_cancel_date: detail.same_day_cancel_date,
          timeline: detail.timeline,
        };
      },

      /**
       * The list endpoint's whole job: scope → filter → count → sort → paginate.
       * `summary` and `unfiltered_total` are computed over the caller's whole
       * scope, before the user's filters and before pagination (research R3).
       */
      list(
        query: GetMembershipApplicationsQuery,
        allowedStoreIds: string[] | null,
      ): GetMembershipApplicationsResponse {
        const scoped = this._scoped(allowedStoreIds);
        // FR-004: KPIs reflect the caller's *current* store scope, which for a
        // multi-store role (e.g. Manager) is narrowed further by the header
        // store switcher (query.store) — not just their whole permitted set.
        const storeScoped = query.store ? scoped.filter((r) => r.store_id === query.store) : scoped;

        const inQueue = (r: MembershipApplicationRow) =>
          r.status === 'pending' || r.status === 'review';
        const summary = {
          pending_count: storeScoped.filter(inQueue).length,
          blacklist_count: storeScoped.filter((r) => inQueue(r) && r.blacklist_state === 'matched')
            .length,
        };

        let filtered = scoped;
        if (query.status) filtered = filtered.filter((r) => r.status === query.status);
        if (query.route) filtered = filtered.filter((r) => r.enrollment_route === query.route);
        if (query.brand) filtered = filtered.filter((r) => r.brand_id === query.brand);
        if (query.store) filtered = filtered.filter((r) => r.store_id === query.store);
        if (query.blacklist === 'match') {
          filtered = filtered.filter((r) => r.blacklist_state === 'matched');
        } else if (query.blacklist === 'no_match') {
          filtered = filtered.filter((r) => r.blacklist_state !== 'matched');
        }
        if (query.date_from) {
          filtered = filtered.filter((r) => r.application_date.slice(0, 10) >= query.date_from!);
        }
        if (query.date_to) {
          filtered = filtered.filter((r) => r.application_date.slice(0, 10) <= query.date_to!);
        }
        if (query.search) {
          const s = query.search.toLowerCase();
          filtered = filtered.filter(
            (r) => r.id.toLowerCase().includes(s) || r.applicant_name.toLowerCase().includes(s),
          );
        }

        const direction = query.sort_order === 'asc' ? 1 : -1;
        const sorted = [...filtered].sort((a, b) => {
          let cmp: number;
          switch (query.sort_by) {
            case 'status':
              cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
              break;
            case 'id':
              cmp = a.id.localeCompare(b.id, 'ja');
              break;
            case 'applicant_name':
              cmp = a.applicant_name.localeCompare(b.applicant_name, 'ja');
              break;
            case 'usage_start_date':
              cmp = a.usage_start_date.localeCompare(b.usage_start_date);
              break;
            default:
              cmp = a.application_date.localeCompare(b.application_date);
          }
          if (cmp !== 0) return direction * cmp;
          // Stable tiebreak so ordering does not drift between requests.
          return -a.application_date.localeCompare(b.application_date);
        });

        const total = sorted.length;
        const totalPages = Math.max(1, Math.ceil(total / query.limit));
        const currentPage = Math.min(query.page, totalPages);
        const start = (currentPage - 1) * query.limit;

        return {
          applications: sorted.slice(start, start + query.limit).map(toListItem),
          pagination: {
            total,
            total_pages: totalPages,
            current_page: currentPage,
            limit: query.limit,
          },
          summary,
          unfiltered_total: scoped.length,
        };
      },

      getRow(id: string, allowedStoreIds: string[] | null): MembershipApplicationRow | undefined {
        return this._scoped(allowedStoreIds).find((r) => r.id === id);
      },

      getDetail(
        id: string,
        allowedStoreIds: string[] | null,
      ): MembershipApplicationDetail | 'not_found' {
        const row = this.getRow(id, allowedStoreIds);
        if (!row) return 'not_found';
        return this._toDetail(row);
      },

      _patchRow(id: string, patch: Partial<MembershipApplicationRow>): MembershipApplicationRow {
        const index = this._rows.findIndex((r) => r.id === id);
        const updated = { ...this._rows[index]!, ...patch, updated_at: nowIso() };
        this._rows[index] = updated;
        return updated;
      },

      _prependTimeline(id: string, entries: TimelineEntry[]): void {
        const detail = this._details[id]!;
        this._details[id] = { ...detail, timeline: [...entries, ...detail.timeline] };
      },

      /**
       * Approve (FR-030). Guards in order: status must be `pending`; an
       * admin-sourced application must carry an agreement timestamp (FR-028).
       * A blacklist match deliberately does NOT block — the reviewer decides.
       */
      approve(
        id: string,
        operator: string,
        allowedStoreIds: string[] | null,
        staffExemptionReason?: string,
      ): MembershipApplicationDetail | ApproveFailure {
        const row = this.getRow(id, allowedStoreIds);
        if (!row) return 'not_found';
        if (row.status !== 'pending') return 'invalid_status';

        let detail = this._details[id]!;
        if (detail.application_source === '管理画面' && !detail.agreement_datetime) {
          return 'agreement_missing';
        }

        // ⚠️ PROVISIONAL (FR-025a) — a reviewer-entered staff-discretionary
        // exemption reason is recorded here, at approval time, so
        // `resolveEnrollmentFeeExemption` below picks it up. See the precedence
        // warning on that function.
        const trimmedStaffReason = staffExemptionReason?.trim();
        if (trimmedStaffReason) {
          detail = { ...detail, staff_exemption_reason: trimmedStaffReason };
          this._details[id] = detail;
        }

        const enrollmentFeeAmount = this._enrollmentFeeAmount(detail);
        const exemption = resolveEnrollmentFeeExemption(row, detail, enrollmentFeeAmount);
        const at = nowIso();

        this._details[id] = { ...detail, approved_by: operator, approved_at: at };

        const entries: TimelineEntry[] = [
          {
            id: `tl-${id}-${Date.now()}-approve`,
            kind: 'system',
            datetime: at,
            operator,
            content: '入会申請を承認しました。会員登録完了通知を送信しました。',
          },
        ];

        // The approval log is where the ⚠️ provisional exemption becomes auditable.
        if (exemption && exemption.kind !== 'none' && exemption.discount_amount > 0) {
          const detailText =
            exemption.kind === 'staff'
              ? `入会金免除（スタッフ個別免除）を適用しました。理由: ${exemption.reason ?? ''}`
              : exemption.kind === 'rejoin'
                ? `入会金免除（再入会者免除・退会後${REJOIN_EXEMPT_DAYS}日以内）を適用しました。前回退会日: ${exemption.previous_withdrawal_date ?? '—'}`
                : `入会金免除（キャンペーン免除・適用: ${exemption.campaign_name ?? '—'}）を適用しました。（自動判定）`;
          entries.push({
            id: `tl-${id}-${Date.now()}-exemption`,
            kind: 'system',
            datetime: at,
            operator,
            content: detailText,
          });
        }

        this._prependTimeline(id, entries);
        const updated = this._patchRow(id, { status: 'approved' });
        return this._toDetail(updated);
      },

      /** Reject (FR-032) — two timeline entries: the reason, then the notification. */
      reject(
        id: string,
        reason: RejectionReason,
        supplement: string | undefined,
        operator: string,
        allowedStoreIds: string[] | null,
      ): MembershipApplicationDetail | RejectFailure {
        const row = this.getRow(id, allowedStoreIds);
        if (!row) return 'not_found';
        if (row.status !== 'pending') return 'invalid_status';

        const REASON_LABELS: Record<RejectionReason, string> = {
          identity_incomplete: '本人確認不備',
          age_restriction: '年齢制限',
          blacklist_match: 'BL該当',
          other: 'その他',
        };
        const at = nowIso();
        const detail = this._details[id]!;

        this._details[id] = {
          ...detail,
          rejected_by: operator,
          rejected_at: at,
          rejection_reason: reason,
          rejection_supplement: supplement ?? null,
        };

        this._prependTimeline(id, [
          {
            id: `tl-${id}-${Date.now()}-notify`,
            kind: 'system',
            datetime: at,
            operator: 'システム',
            content: '申請者に否認通知を送信しました。保留中の決済情報を解放しました。',
          },
          {
            id: `tl-${id}-${Date.now()}-reason`,
            kind: 'system',
            datetime: at,
            operator,
            content: `否認理由: ${REASON_LABELS[reason]}${supplement ? `。${supplement}` : ''}`,
          },
        ]);

        const updated = this._patchRow(id, { status: 'rejected' });
        return this._toDetail(updated);
      },

      /**
       * Cancel (FR-034, FR-036). Both guards are server-side invariants, not
       * dialog decorations: past the usage start date, and the third same-day
       * attempt, are refused here regardless of what the client shows.
       */
      cancel(
        id: string,
        reason: string,
        operator: string,
        allowedStoreIds: string[] | null,
      ):
        | { application: MembershipApplicationDetail; same_day_cancel_count: number }
        | CancelFailure {
        const row = this.getRow(id, allowedStoreIds);
        if (!row) return 'not_found';
        if (
          row.status !== 'pending' &&
          row.status !== 'approved' &&
          row.status !== 'auto_approved'
        ) {
          return 'invalid_status';
        }
        if (row.usage_start_date <= todayIso()) return 'usage_start_reached';

        const detail = this._details[id]!;
        const currentCount = this._sameDayCount(detail);
        if (currentCount >= SAME_DAY_CANCEL_LIMIT) return 'same_day_limit';

        const at = nowIso();
        const refundNote =
          detail.payment_method === 'credit_card'
            ? 'カード決済の取消処理を実行します（90日以内）。'
            : '口座振替の返金は手動対応となります（CASHPOSTまたは振込）。';

        this._details[id] = {
          ...detail,
          cancelled_by: operator,
          cancelled_at: at,
          cancellation_reason: reason,
          same_day_cancel_count: currentCount + 1,
          same_day_cancel_date: todayIso(),
        };

        this._prependTimeline(id, [
          {
            id: `tl-${id}-${Date.now()}-cancel`,
            kind: 'system',
            datetime: at,
            operator,
            content: `申請を取り消しました。理由: ${reason}。${refundNote}`,
          },
        ]);

        const updated = this._patchRow(id, { status: 'cancelled' });
        return {
          application: this._toDetail(updated),
          same_day_cancel_count: currentCount + 1,
        };
      },

      addMemo(
        id: string,
        content: string,
        operator: string,
        allowedStoreIds: string[] | null,
      ): TimelineEntry[] | 'not_found' {
        const row = this.getRow(id, allowedStoreIds);
        if (!row) return 'not_found';
        this._prependTimeline(id, [
          {
            id: `tl-${id}-${Date.now()}-memo`,
            kind: 'memo',
            datetime: nowIso(),
            operator,
            content,
          },
        ]);
        return this._details[id]!.timeline;
      },

      /** System entries are never deletable (FR-037) — enforced here, not in the UI. */
      deleteMemo(
        id: string,
        memoId: string,
        allowedStoreIds: string[] | null,
      ): TimelineEntry[] | MemoFailure {
        const row = this.getRow(id, allowedStoreIds);
        if (!row) return 'not_found';
        const detail = this._details[id]!;
        const entry = detail.timeline.find((e) => e.id === memoId);
        if (!entry) return 'not_found';
        if (entry.kind !== 'memo') return 'not_a_memo';
        this._details[id] = {
          ...detail,
          timeline: detail.timeline.filter((e) => e.id !== memoId),
        };
        return this._details[id]!.timeline;
      },

      /**
       * Admin-screen enrolment (FR-061). Always lands as `pending` + `manual`,
       * regardless of the blacklist or age outcome.
       */
      createDirect(
        data: DirectEnrollmentRequest,
        blacklistState: MembershipApplicationRow['blacklist_state'],
        staff: { id: string; name: string },
      ): MembershipApplication {
        this._seed();
        const db = getDb();
        const at = nowIso();
        const id = `APP-DIRECT-${Date.now()}`;

        const store = db.stores.getById(data.contract.store_id);
        // brand_id is the display name itself ('FIT365' | 'JOYFIT') — see the
        // note in membership-application.seed.ts on why there is no separate code.
        const brandName = data.contract.brand_id;
        const campaign = data.contract.campaign_id ?? null;
        const age = calcAge(data.applicant.birth_date);

        const row: MembershipApplicationRow = {
          id,
          applicant_name: `${data.applicant.family_name} ${data.applicant.given_name}`,
          applicant_kana: `${data.applicant.family_name_kana} ${data.applicant.given_name_kana}`,
          status: 'pending',
          enrollment_route: 'manual',
          blacklist_state: blacklistState,
          brand_id: data.contract.brand_id,
          brand_name: brandName,
          store_id: data.contract.store_id,
          store_name: store?.name ?? data.contract.store_id,
          plan_id: data.contract.plan_id,
          plan_name: PLAN_NAME_BY_ID[data.contract.plan_id] ?? data.contract.plan_id,
          campaign_id: campaign,
          campaign_name: campaign ? (CAMPAIGN_NAME_BY_ID[campaign] ?? campaign) : null,
          application_date: at,
          contract_start_date: todayIso(),
          usage_start_date: data.contract.usage_start_date,
          is_minor: age < 18,
          updated_at: at,
        };
        this._rows.push(row);

        this._details[id] = {
          birth_date: data.applicant.birth_date,
          age,
          gender_label: genderLabel(data.applicant.gender),
          phone_real: data.applicant.phone,
          email_real: data.applicant.email,
          address_real: data.applicant.address ?? '',
          face_photo_registered: true,
          face_photo_registered_at: at,
          blacklist_conditions: [],
          monthly_fee: PLAN_MONTHLY_FEE_BY_ID[data.contract.plan_id] ?? DEFAULT_PLAN_MONTHLY_FEE,
          prepayment_months: brandName === 'FIT365' ? 2 : 1,
          options: [],
          payment_method: data.contract.payment_method,
          card_last4: data.contract.payment_method === 'credit_card' ? '1234' : null,
          enrollment_fee_master_id: data.contract.enrollment_fee_master_id ?? null,
          parental_consent: data.consent.parental_consent,
          parental_consent_at: data.consent.parental_consent ? at : null,
          parental_consent_method: data.consent.parental_consent
            ? '管理画面での確認チェック'
            : null,
          application_source: '管理画面',
          proxy_staff_name: staff.name,
          proxy_staff_id: staff.id,
          agreement_datetime: data.consent.agreement_datetime,
          companion_upgrade: null,
          previous_withdrawal_date: null,
          staff_exemption_reason: null,
          approved_by: null,
          approved_at: null,
          rejected_by: null,
          rejected_at: null,
          rejection_reason: null,
          rejection_supplement: null,
          cancelled_by: null,
          cancelled_at: null,
          cancellation_reason: null,
          same_day_cancel_count: 0,
          same_day_cancel_date: null,
          timeline: [
            {
              id: `tl-${id}-1`,
              kind: 'system',
              datetime: at,
              operator: staff.name,
              content: `管理画面から代理申請を登録（入会経路: 手動 / 代理申請者: ${staff.name}）`,
            },
          ],
        };

        return toListItem(row);
      },

      /** Whether an e-mail already belongs to an application still in flight. */
      hasActiveApplicationForEmail(email: string): boolean {
        this._seed();
        return this._rows.some((r) => {
          const detail = this._details[r.id];
          return detail?.email_real === email && (r.status === 'pending' || r.status === 'review');
        });
      },

      brandMinAge(brandName: string): number {
        return brandMinAge(brandName);
      },
    },
  };
}

function genderLabel(gender: DirectEnrollmentRequest['applicant']['gender']): string {
  const labels: Record<DirectEnrollmentRequest['applicant']['gender'], string> = {
    male: '男性',
    female: '女性',
    other: 'その他',
    no_answer: '回答しない',
  };
  return labels[gender];
}
