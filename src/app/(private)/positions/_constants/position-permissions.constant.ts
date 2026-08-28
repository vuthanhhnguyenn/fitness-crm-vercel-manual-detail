import type { PositionPermissionMap, PositionRoleCategory } from '@/lib/api/types.gen';

// ---------------------------------------------------------------------------
// Feature-local DISPLAY metadata for the 36 position permissions.
// Keys/labels/order mirror the server permission catalog (GET /crm/permissions);
// this file adds only what the catalog contract does not carry — the optional
// helper description and the view/edit `kind` used to derive category access
// levels in the preview pane. Keys are typed against the OpenAPI-generated
// PositionPermissionMap so any drift from the API contract is a compile error.
// ---------------------------------------------------------------------------

export type PositionPermissionKey = keyof PositionPermissionMap;

export type PermissionCatalogEntry = {
  key: PositionPermissionKey;
  label: string;
  description?: string;
  /** view: granted at 閲覧のみ level and above; edit: granted only when the category is editable */
  kind: 'view' | 'edit';
};

export type PermissionCatalogCategory = {
  categoryKey: string;
  categoryLabel: string;
  permissions: ReadonlyArray<PermissionCatalogEntry>;
};

export const POSITION_PERMISSION_CATEGORIES = [
  {
    categoryKey: 'member',
    categoryLabel: '会員管理',
    permissions: [
      {
        key: 'can_view_member',
        label: '会員情報の閲覧',
        description: '会員の基本情報・契約情報を参照できます',
        kind: 'view',
      },
      {
        key: 'can_edit_member',
        label: '会員情報の編集',
        description: '会員の基本情報を変更できます',
        kind: 'edit',
      },
      {
        key: 'can_apply_transfer_suspension',
        label: '移籍・休会の申請',
        description: '移籍申請・休会申請を作成できます',
        kind: 'edit',
      },
      {
        key: 'can_force_withdrawal',
        label: '強制退会の実行',
        description: '会員の強制退会処理を行えます',
        kind: 'edit',
      },
    ],
  },
  {
    categoryKey: 'gate',
    categoryLabel: '入退館管理',
    permissions: [
      { key: 'can_view_gate_log', label: '入退館履歴の閲覧', kind: 'view' },
      { key: 'can_edit_gate_setting', label: '入退館設定の変更', kind: 'edit' },
    ],
  },
  {
    categoryKey: 'application',
    categoryLabel: '入会申請管理',
    permissions: [
      { key: 'can_view_application', label: '入会申請の閲覧', kind: 'view' },
      { key: 'can_approve_application', label: '入会申請の承認・却下', kind: 'edit' },
      { key: 'can_create_proxy_application', label: '代理申請の作成', kind: 'edit' },
    ],
  },
  {
    categoryKey: 'lesson',
    categoryLabel: 'レッスン管理',
    permissions: [
      { key: 'can_view_lesson_reservation', label: 'レッスン予約の閲覧', kind: 'view' },
      { key: 'can_manage_lesson_reservation', label: 'レッスン予約の作成・変更', kind: 'edit' },
      { key: 'can_manage_lesson_schedule', label: 'レッスンスケジュールの管理', kind: 'edit' },
    ],
  },
  {
    categoryKey: 'facility',
    categoryLabel: '施設設備管理',
    permissions: [
      { key: 'can_view_facility', label: '設備情報の閲覧', kind: 'view' },
      { key: 'can_edit_facility', label: '設備情報の編集', kind: 'edit' },
      { key: 'can_manage_locker_contract', label: 'ロッカー契約の管理', kind: 'edit' },
    ],
  },
  {
    categoryKey: 'sales',
    categoryLabel: '売上管理',
    permissions: [
      { key: 'can_view_sales', label: '売上データの閲覧', kind: 'view' },
      { key: 'can_edit_sales', label: '売上の登録・編集', kind: 'edit' },
      {
        key: 'can_edit_after_billing_confirmed',
        label: '請求確定後の変更',
        description: '確定済みの請求データを遡って変更できます',
        kind: 'edit',
      },
      { key: 'can_execute_refund', label: '返金処理の実行', kind: 'edit' },
    ],
  },
  {
    categoryKey: 'promotion',
    categoryLabel: '商材施策設定',
    permissions: [
      { key: 'can_view_promotion', label: '商材・キャンペーンの閲覧', kind: 'view' },
      { key: 'can_manage_promotion', label: '商材・キャンペーンの作成・編集', kind: 'edit' },
      {
        key: 'can_create_survey',
        label: 'アンケートの作成',
        description: '業務アンケートを作成・配信できます',
        kind: 'edit',
      },
    ],
  },
  {
    categoryKey: 'content',
    categoryLabel: 'コンテンツ',
    permissions: [
      { key: 'can_view_content', label: 'お知らせ・ブログの閲覧', kind: 'view' },
      { key: 'can_manage_content', label: 'お知らせ・ブログの作成・編集', kind: 'edit' },
      { key: 'can_manage_notification', label: '通知設定の管理', kind: 'edit' },
    ],
  },
  {
    categoryKey: 'system_setting',
    categoryLabel: 'システム設定',
    permissions: [
      { key: 'can_view_staff', label: 'スタッフ管理の閲覧', kind: 'view' },
      { key: 'can_manage_staff', label: 'スタッフアカウントの作成・編集', kind: 'edit' },
      { key: 'can_manage_position', label: '職位マスターの管理', kind: 'edit' },
      { key: 'can_manage_store_setting', label: '店舗設定の変更', kind: 'edit' },
      {
        key: 'can_edit_store_photo',
        label: '店舗写真・フロアマップの編集',
        description: 'モバイルアプリの施設紹介と連動します',
        kind: 'edit',
      },
      {
        key: 'can_edit_store_business_hours',
        label: '営業時間・休業日の編集',
        description: '店舗の営業カレンダーと連動します',
        kind: 'edit',
      },
      {
        key: 'can_edit_store_basic_info',
        label: '店舗基本情報の編集',
        description: '店舗名称・住所・電話番号を変更できます（変更履歴を記録）',
        kind: 'edit',
      },
      {
        key: 'can_edit_gate_stop',
        label: 'ゲートストップ設定の変更',
        description: '自店舗のみ。入退館管理と連動します',
        kind: 'edit',
      },
    ],
  },
  {
    categoryKey: 'csv_export',
    categoryLabel: 'CSV出力管理',
    permissions: [
      {
        key: 'can_export_member_csv',
        label: '会員CSV出力',
        description: '会員情報のCSVエクスポートを実行できます',
        kind: 'edit',
      },
      {
        key: 'can_export_gate_log_csv',
        label: '入退館CSV出力',
        description: '入退館履歴のCSVエクスポートを実行できます',
        kind: 'edit',
      },
      {
        key: 'can_export_survey_csv',
        label: 'アンケートCSV出力',
        description: 'アンケート結果のCSVエクスポートを実行できます',
        kind: 'edit',
      },
    ],
  },
] as const satisfies ReadonlyArray<PermissionCatalogCategory>;

// Compile-time exhaustiveness: every PositionPermissionMap key must appear in
// the catalog above (a missing key makes CoveredPermissionKey narrower and
// this assignment fails to typecheck).
type CoveredPermissionKey =
  (typeof POSITION_PERMISSION_CATEGORIES)[number]['permissions'][number]['key'];
type AssertAllKeysCovered =
  Exclude<PositionPermissionKey, CoveredPermissionKey> extends never ? true : never;
export const POSITION_PERMISSION_CATALOG_COMPLETE: AssertAllKeysCovered = true;

export const CSV_CATEGORY_KEY = 'csv_export';

/** CSV出力管理 keys seeded by role on create (FR-S001 / FR-011) */
export const CSV_PERMISSION_KEYS = [
  'can_export_member_csv',
  'can_export_gate_log_csv',
  'can_export_survey_csv',
] as const satisfies ReadonlyArray<PositionPermissionKey>;

/** FR-S001 role defaults: HQ・Manager=出力可 / Staff・Trainer・Observer=出力不可 */
export const CSV_DEFAULTS_BY_ROLE: Record<PositionRoleCategory, boolean> = {
  headquarter: true,
  manager: true,
  staff: false,
  trainer: false,
  observer: false,
};

/**
 * 重要操作（破壊的）権限 — the preview pane marks a category with a warning icon
 * when any of these is granted. Replaces the former 権限フラグ list, which the API
 * team confirmed is the same axis as アクセス権限 and was merged into one
 * (QA answer 2026-07-29); V0 source: position-list.tsx DESTRUCTIVE_PERM_IDS.
 */
export const DESTRUCTIVE_PERMISSION_KEYS: ReadonlySet<PositionPermissionKey> = new Set([
  'can_force_withdrawal',
  'can_edit_after_billing_confirmed',
  'can_execute_refund',
]);

/** Tooltip copy for a category containing a granted 重要操作 permission */
export const DESTRUCTIVE_PERMISSION_TOOLTIP = '強制退会・返金など重要操作を含みます';

export type CategoryAccessLevel = 'edit' | 'view' | 'none';

const PERMISSION_KIND_BY_KEY = new Map<string, 'view' | 'edit'>(
  POSITION_PERMISSION_CATEGORIES.flatMap((category) =>
    category.permissions.map((permission) => [permission.key, permission.kind]),
  ),
);

/**
 * Optional helper text per permission — UI-only metadata the server catalog
 * (GET /crm/permissions) does not carry, merged in by key when rendering the form.
 */
export const PERMISSION_DESCRIPTION_BY_KEY: ReadonlyMap<PositionPermissionKey, string> = new Map(
  POSITION_PERMISSION_CATEGORIES.flatMap((category) =>
    category.permissions.flatMap((permission: PermissionCatalogEntry) =>
      permission.description ? [[permission.key, permission.description] as const] : [],
    ),
  ),
);

/** Finds the catalog category for a categoryKey (labels/ordering source) */
export function findCatalogCategory(categoryKey: string): PermissionCatalogCategory | undefined {
  return POSITION_PERMISSION_CATEGORIES.find((category) => category.categoryKey === categoryKey);
}

/**
 * Derives a category's access level from the granted state of its keys,
 * mirroring the V0 prototype's derivation (research R5): any granted
 * edit-kind key → 閲覧・編集, otherwise any granted view-kind key → 閲覧のみ,
 * otherwise アクセス不可.
 */
export function deriveCategoryLevel(
  _categoryKey: string,
  permissions: ReadonlyArray<{ permissionKey: string; granted: boolean }>,
): CategoryAccessLevel {
  let hasView = false;
  for (const permission of permissions) {
    if (!permission.granted) continue;
    if ((PERMISSION_KIND_BY_KEY.get(permission.permissionKey) ?? 'edit') === 'edit') {
      return 'edit';
    }
    hasView = true;
  }
  return hasView ? 'view' : 'none';
}
