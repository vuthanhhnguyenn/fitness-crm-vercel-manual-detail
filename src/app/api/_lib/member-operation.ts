import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  isAfter,
  isBefore,
  startOfMonth,
} from 'date-fns';

/**
 * Server-side validation for the member-detail header operations (A-01-01-b).
 *
 * The UI forms enforce the same rules for UX, but they keep their own copy under
 * `src/app/(private)/members/[id]/_constants|_utils` — the two trees must not import each other.
 * When a limit changes here, mirror it in
 * `src/app/(private)/members/[id]/_constants/member-operation.constants.ts`.
 *
 * Only the numeric limits are named constants: they drive logic and appear in both trees. Message
 * text is written inline at its single use site and interpolates the limit, so the wording can
 * never disagree with the number it quotes.
 */

/** BR-SUS-001: a suspension may not span more than this many months (start month inclusive). */
export const SUSPENSION_MAX_MONTHS = 12;

/** BR-WDR-001: a 通常退会 must be scheduled at least this many days ahead. */
export const WITHDRAWAL_MIN_LEAD_DAYS = 7;

/**
 * A-01 FR-017: an agreement older than this is far more likely to be a wrong-year typo than a
 * genuine back-dated agreement, so it is rejected rather than silently recorded.
 */
export const PROXY_AGREEMENT_MAX_AGE_DAYS = 60;

/**
 * A-01 FR-018. Typed by the operator, never injected by the client. A named constant because the
 * Zod literal and the UI's equality check must agree on the exact same token.
 */
export const PERSONAL_DATA_DELETE_CONFIRMATION = 'ANONYMIZE';

/**
 * A-01 FR-018. The backend caps the audit reason at 500 (`anonymizeMember.reason`), which is
 * stricter than our generic textarea limit — kept separate so a change to the shared limit can
 * never silently widen this field past what the API accepts.
 */
export const PERSONAL_DATA_DELETE_REASON_MAX_LENGTH = 500;

// ── Validators ───────────────────────────────────────────────────────────────

/** A field-scoped validation failure. `null` means valid. */
interface OperationValidationError<TPath extends string> {
  path: TPath;
  message: string;
}

/** Parses a `YYYY-MM` request value to the first day of that month (local time). */
function parseYearMonth(value: string): Date {
  const [year, month] = value.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, 1);
}

function isBeforeCurrentMonth(value: string): boolean {
  return isBefore(parseYearMonth(value), startOfMonth(new Date()));
}

/**
 * BR-SUS-001, expressed at month granularity because the approved UX works in months (A-01's
 * 休会費 is a monthly master) while the backend contract works in dates.
 */
export function validateSuspensionRange(value: {
  start_month: string;
  end_month: string;
}): OperationValidationError<'start_month' | 'end_month'> | null {
  if (isBeforeCurrentMonth(value.start_month)) {
    return { path: 'start_month', message: '休会開始月は今月以降を指定してください' };
  }
  const start = parseYearMonth(value.start_month);
  const end = parseYearMonth(value.end_month);
  // Months are INCLUSIVE: start === end is a legitimate one-month suspension, whose date range
  // (1st → last of that month) still satisfies the backend's `endDate > startDate`.
  if (isBefore(end, start)) {
    return { path: 'end_month', message: '休会終了月は開始月以降を指定してください' };
  }
  // …which also means the span counts the start month itself.
  if (differenceInCalendarMonths(end, start) + 1 > SUSPENSION_MAX_MONTHS) {
    return {
      path: 'end_month',
      message: `休会期間は最長${SUSPENSION_MAX_MONTHS}ヶ月です`,
    };
  }
  return null;
}

/**
 * Releasing a suspension shortens the active suspension's end month, so a retroactive release is
 * unsupported — it would require an invoice correction in F-01.
 */
export function validateResumeMonth(
  resumeMonth: string,
): OperationValidationError<'resume_month'> | null {
  if (isBeforeCurrentMonth(resumeMonth)) {
    return { path: 'resume_month', message: '復帰月は今月以降を指定してください' };
  }
  return null;
}

/** Validates the 代理申請 block of a status-change request (A-01 FR-017). */
export function validateProxyAgreement(value: {
  is_proxy: boolean;
  proxy_agreed_at?: string;
}): OperationValidationError<'proxy_agreed_at'> | null {
  if (!value.is_proxy) return null;
  const agreedAt = value.proxy_agreed_at ? new Date(value.proxy_agreed_at) : null;
  if (!agreedAt || Number.isNaN(agreedAt.getTime())) {
    return { path: 'proxy_agreed_at', message: '合意日時は必須です' };
  }
  const now = new Date();
  if (isAfter(agreedAt, now)) {
    return { path: 'proxy_agreed_at', message: '合意日時に未来の日時は指定できません' };
  }
  if (differenceInCalendarDays(now, agreedAt) > PROXY_AGREEMENT_MAX_AGE_DAYS) {
    return {
      path: 'proxy_agreed_at',
      message: `合意日時が${PROXY_AGREEMENT_MAX_AGE_DAYS}日以上前です。日付を確認してください`,
    };
  }
  return null;
}
