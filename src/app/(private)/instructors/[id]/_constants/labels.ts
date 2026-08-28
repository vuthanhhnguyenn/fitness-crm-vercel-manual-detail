/**
 * Display-label maps for the instructor detail screen (D04-02).
 * Localizes raw API values (staff-role slugs, change-history field keys, enum
 * values) into the Japanese copy used across the rest of the CRM.
 */

/** CRM-linked staff role slug → Japanese position label (BUG-D0402-04). */
export const STAFF_ROLE_LABELS: Record<string, string> = {
  system: 'システム管理者',
  headquarter: '本部管理者',
  manager: 'マネージャー',
  staff: 'スタッフ',
  trainer: 'トレーナー',
  observer: '閲覧のみ',
};

/** Change-history field key → Japanese label (BUG-D0402-06). */
export const HISTORY_FIELD_LABELS: Record<string, string> = {
  last_name: '姓',
  first_name: '名',
  romaji_last_name: '英字表記（姓）',
  romaji_first_name: '英字表記（名）',
  nickname: 'ニックネーム',
  role_classifications: '役割区分',
  profile_text: 'プロフィール文',
  instructing_history: '指導歴',
  photo_url: 'プロフィール画像',
  status: 'ステータス',
  'buffer_settings.min_booking_lead_hours': '最短受付期間',
  'buffer_settings.pre_buffer_minutes': '前バッファ',
  'buffer_settings.post_buffer_minutes': '後バッファ',
  crm_account_link_staff_id: 'CRMアカウント紐づけ',
};

/** Instructor status enum value → Japanese label (BUG-D0402-06). */
export const INSTRUCTOR_STATUS_VALUE_LABELS: Record<string, string> = {
  active: '有効',
  inactive: '無効',
};

/**
 * Localize a change-history before/after value based on which field changed.
 * Falls back to the raw value for fields whose values are already display text.
 */
export function formatHistoryValue(field: string | undefined, value: string): string {
  if (field === 'status') {
    return INSTRUCTOR_STATUS_VALUE_LABELS[value] ?? value;
  }
  return value;
}
