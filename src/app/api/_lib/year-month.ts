/**
 * Year-month conversions for the mock API layer.
 *
 * Two formats coexist on purpose:
 * - **API contract** (`YYYY-MM`) — every request/response field that carries a month.
 *   Enforced by `YEAR_MONTH_PATTERN` in `_schemas/member.schema.ts`.
 * - **Mock-DB storage** (`YYYY/MM`) — the 休会/退会 rows (`memberLeaves`) keep the Japanese
 *   display format their seeds and the 休会一覧 screen already use.
 *
 * Routes convert at the boundary so neither side leaks its format into the other.
 */

/** `"2026-07"` → `"2026/07"` (API contract → mock-DB storage). */
export function toStorageYearMonth(yearMonth: string): string {
  return yearMonth.replace('-', '/');
}

/** `"2026/07"` → `"2026-07"` (mock-DB storage → API contract). */
export function toApiYearMonth(yearMonth: string): string {
  return yearMonth.replace('/', '-');
}
