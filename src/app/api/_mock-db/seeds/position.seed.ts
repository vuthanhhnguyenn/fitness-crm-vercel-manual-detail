import type { Position, PositionPermissionMap } from '@/app/api/_schemas/position.schema';
import type { StaffListItem } from '@/app/api/_schemas/staff.schema';

// ---------------------------------------------------------------------------
// Seed permission maps are built from the V0 mock's per-category access levels
// (edit / view / none) plus the five special flags, reproducing the prototype's
// derivation: view-kind keys are granted at view+edit level, edit-kind keys at
// edit level only, flag-gated keys when the flag is on and the category is
// accessible (fitness-crm-ui position-list.tsx isFinePermissionEnabled).
// ---------------------------------------------------------------------------

type AccessLevel = 'edit' | 'view' | 'none';

type CategoryLevels = {
  member: AccessLevel;
  gate: AccessLevel;
  application: AccessLevel;
  lesson: AccessLevel;
  facility: AccessLevel;
  sales: AccessLevel;
  promotion: AccessLevel;
  content: AccessLevel;
  system_setting: AccessLevel;
  csv: 'edit' | 'none';
};

type PermissionFlags = {
  afterBillingConfirmed: boolean; // 請求確定後変更可
  proxyApplication: boolean; // 代理申請権限あり
  surveyCreation: boolean; // アンケート作成権限あり
  forceWithdrawal: boolean; // 強制退会操作
  refund: boolean; // 返金処理
};

const NO_FLAGS: PermissionFlags = {
  afterBillingConfirmed: false,
  proxyApplication: false,
  surveyCreation: false,
  forceWithdrawal: false,
  refund: false,
};

function buildPermissions(levels: CategoryLevels, flags: PermissionFlags): PositionPermissionMap {
  const view = (level: AccessLevel) => level === 'view' || level === 'edit';
  const edit = (level: AccessLevel) => level === 'edit';
  const gated = (level: AccessLevel, flag: boolean) => level !== 'none' && flag;

  return {
    can_view_member: view(levels.member),
    can_edit_member: edit(levels.member),
    can_apply_transfer_suspension: edit(levels.member),
    can_force_withdrawal: gated(levels.member, flags.forceWithdrawal),
    can_view_gate_log: view(levels.gate),
    can_edit_gate_setting: edit(levels.gate),
    can_view_application: view(levels.application),
    can_approve_application: edit(levels.application),
    can_create_proxy_application: gated(levels.application, flags.proxyApplication),
    can_view_lesson_reservation: view(levels.lesson),
    can_manage_lesson_reservation: edit(levels.lesson),
    can_manage_lesson_schedule: edit(levels.lesson),
    can_view_facility: view(levels.facility),
    can_edit_facility: edit(levels.facility),
    can_manage_locker_contract: edit(levels.facility),
    can_view_sales: view(levels.sales),
    can_edit_sales: edit(levels.sales),
    can_edit_after_billing_confirmed: gated(levels.sales, flags.afterBillingConfirmed),
    can_execute_refund: gated(levels.sales, flags.refund),
    can_view_promotion: view(levels.promotion),
    can_manage_promotion: edit(levels.promotion),
    can_create_survey: gated(levels.promotion, flags.surveyCreation),
    can_view_content: view(levels.content),
    can_manage_content: edit(levels.content),
    can_manage_notification: edit(levels.content),
    can_view_staff: view(levels.system_setting),
    can_manage_staff: edit(levels.system_setting),
    can_manage_position: edit(levels.system_setting),
    can_manage_store_setting: edit(levels.system_setting),
    can_edit_store_photo: edit(levels.system_setting),
    can_edit_store_business_hours: edit(levels.system_setting),
    can_edit_store_basic_info: edit(levels.system_setting),
    can_edit_gate_stop: edit(levels.system_setting),
    can_export_member_csv: levels.csv === 'edit',
    can_export_gate_log_csv: levels.csv === 'edit',
    can_export_survey_csv: levels.csv === 'edit',
  };
}

const SEED_CREATED_AT = '2026-06-05T09:00:00Z';
const SEED_UPDATED_AT = '2026-06-20T09:00:00Z';

function seedRow(
  id: number,
  role: Position['role'],
  position_name: string,
  description: string,
  levels: CategoryLevels,
  flags: PermissionFlags = NO_FLAGS,
): Position {
  return {
    id,
    role,
    position_name,
    description,
    permissions: buildPermissions(levels, flags),
    is_system_managed: false,
    created_at: SEED_CREATED_AT,
    updated_at: SEED_UPDATED_AT,
  };
}

export const SEED_POSITION_ROWS: Position[] = [
  seedRow(
    1,
    'headquarter',
    '本部管理者',
    '全店舗・全機能にアクセスできる最上位の職位',
    {
      member: 'edit',
      gate: 'edit',
      application: 'edit',
      lesson: 'edit',
      facility: 'edit',
      sales: 'edit',
      promotion: 'edit',
      content: 'edit',
      system_setting: 'edit',
      csv: 'edit',
    },
    {
      afterBillingConfirmed: true,
      proxyApplication: true,
      surveyCreation: true,
      forceWithdrawal: true,
      refund: true,
    },
  ),
  seedRow(
    2,
    'manager',
    'ブロック長',
    '複数エリアを横断して管理する職位',
    {
      member: 'edit',
      gate: 'edit',
      application: 'edit',
      lesson: 'edit',
      facility: 'view',
      sales: 'edit',
      promotion: 'edit',
      content: 'view',
      system_setting: 'none',
      csv: 'edit',
    },
    {
      afterBillingConfirmed: true,
      proxyApplication: true,
      surveyCreation: false,
      forceWithdrawal: true,
      refund: false,
    },
  ),
  seedRow(
    3,
    'manager',
    'テリトリーマネージャー',
    '複数店舗を横断して管理する職位',
    {
      member: 'edit',
      gate: 'edit',
      application: 'edit',
      lesson: 'view',
      facility: 'view',
      sales: 'edit',
      promotion: 'view',
      content: 'none',
      system_setting: 'none',
      csv: 'edit',
    },
    {
      afterBillingConfirmed: true,
      proxyApplication: true,
      surveyCreation: false,
      forceWithdrawal: false,
      refund: false,
    },
  ),
  seedRow(
    4,
    'manager',
    'テリトリーMGR（アンケート作成）',
    'テリトリーマネージャーにアンケート作成権限を追加した職位',
    {
      member: 'edit',
      gate: 'edit',
      application: 'edit',
      lesson: 'view',
      facility: 'view',
      sales: 'edit',
      promotion: 'edit',
      content: 'view',
      system_setting: 'none',
      csv: 'edit',
    },
    {
      afterBillingConfirmed: true,
      proxyApplication: true,
      surveyCreation: true,
      forceWithdrawal: false,
      refund: false,
    },
  ),
  seedRow(
    5,
    'staff',
    '店舗責任者',
    '店舗全般を管理する職位',
    {
      member: 'edit',
      gate: 'edit',
      application: 'edit',
      lesson: 'edit',
      facility: 'view',
      sales: 'edit',
      promotion: 'none',
      content: 'none',
      system_setting: 'none',
      csv: 'none',
    },
    {
      afterBillingConfirmed: true,
      proxyApplication: true,
      surveyCreation: false,
      forceWithdrawal: false,
      refund: false,
    },
  ),
  seedRow(
    6,
    'staff',
    '正社員スタッフ',
    '店舗日常業務全般を担当する正社員向け職位',
    {
      member: 'edit',
      gate: 'edit',
      application: 'edit',
      lesson: 'view',
      facility: 'none',
      sales: 'view',
      promotion: 'none',
      content: 'none',
      system_setting: 'none',
      csv: 'none',
    },
    {
      afterBillingConfirmed: false,
      proxyApplication: true,
      surveyCreation: false,
      forceWithdrawal: false,
      refund: false,
    },
  ),
  seedRow(7, 'staff', '契約社員スタッフ', '店舗日常業務全般を担当する契約社員向け職位', {
    member: 'edit',
    gate: 'edit',
    application: 'view',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
  seedRow(8, 'staff', 'アルバイト（スーパー）', '店舗業務を幅広く担当するアルバイト向け職位', {
    member: 'edit',
    gate: 'edit',
    application: 'view',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
  seedRow(9, 'staff', 'アルバイト（一般）', '限定的な店舗業務を担当するアルバイト向け職位', {
    member: 'view',
    gate: 'edit',
    application: 'none',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
  seedRow(10, 'staff', 'FC企業管理者', 'FC企業管轄店舗を参照できる職位', {
    member: 'edit',
    gate: 'view',
    application: 'edit',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
  seedRow(11, 'trainer', '社員トレーナー', 'レッスン業務に特化した社員向け職位', {
    member: 'view',
    gate: 'view',
    application: 'none',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
  seedRow(12, 'trainer', '社外トレーナー', 'レッスン業務に特化した外部トレーナー向け職位', {
    member: 'none',
    gate: 'view',
    application: 'none',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
  seedRow(13, 'observer', '閲覧専任', '全機能を参照のみできる職位', {
    member: 'none',
    gate: 'none',
    application: 'none',
    lesson: 'none',
    facility: 'none',
    sales: 'none',
    promotion: 'none',
    content: 'none',
    system_setting: 'none',
    csv: 'none',
  }),
];

export function positionNameById(id: number): string {
  return SEED_POSITION_ROWS.find((p) => p.id === id)?.position_name ?? '';
}

export function defaultPositionIdByRole(role: StaffListItem['role']): number {
  return SEED_POSITION_ROWS.find((position) => position.role === role)?.id ?? 6;
}
