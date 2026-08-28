/**
 * JST timestamps for the mock API layer.
 *
 * The mock DB stores timestamps in the Japanese display format the screens render directly
 * (`YYYY/MM/DD HH:mm`), so the conversion belongs at the mock layer rather than in each
 * table. `Asia/Tokyo` is pinned explicitly — the server's own timezone must not decide
 * which calendar day a record lands on.
 */

/** Current JST timestamp as `YYYY/MM/DD HH:mm`. */
export function nowJst(): string {
  return new Date()
    .toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', '');
}
