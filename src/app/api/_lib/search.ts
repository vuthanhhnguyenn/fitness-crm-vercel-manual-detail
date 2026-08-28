/**
 * Normalizes a user-typed search term for case/width-insensitive partial matching:
 * lowercases, trims, and converts full-width (zenkaku) ASCII — digits, letters, symbols —
 * to half-width (hankaku) so e.g. "０００１" matches an ID like "LSN-0001".
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .trim()
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .toLowerCase();
}
