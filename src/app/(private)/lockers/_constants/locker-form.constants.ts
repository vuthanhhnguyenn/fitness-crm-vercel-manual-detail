import { LockerNumberingPattern } from '@/lib/api/types.gen';

export const LOCKER_AREA_OPTIONS = [
  { value: 'A', label: 'A: 更衣室エリア' },
  { value: 'B', label: 'B: 更衣室エリア' },
  { value: 'C', label: 'C: 更衣室エリア' },
  { value: 'D', label: 'D: 更衣室エリア' },
  { value: 'E', label: 'E: 更衣室エリア' },
  { value: 'F', label: 'F: 更衣室エリア' },
  { value: 'G', label: 'G: 更衣室エリア' },
  { value: 'H', label: 'H: 更衣室エリア' },
  { value: 'I', label: 'I: 事務所横' },
  { value: 'J', label: 'J: 事務所横' },
  { value: 'K', label: 'K: 女性専用エリア' },
  { value: 'L', label: 'L: 女性専用エリア' },
  { value: 'M', label: 'M: 女性専用エリア' },
  { value: 'N', label: 'N: 女性専用エリア' },
  { value: 'R', label: 'R: 女性専用エリア横' },
  { value: 'S', label: 'S: 女性専用エリア横' },
] as const;

export const LOCKER_NUMBERING_PATTERN_LABELS: Record<LockerNumberingPattern, string> = {
  [LockerNumberingPattern.TOP_LEFT_TO_RIGHT]: '左上から右上へ',
  [LockerNumberingPattern.BOTTOM_LEFT_TO_RIGHT]: '左下から右下へ',
  [LockerNumberingPattern.TOP_LEFT_TO_BOTTOM]: '左上から左下へ',
  [LockerNumberingPattern.TOP_RIGHT_TO_LEFT]: '右上から左下へ',
};
