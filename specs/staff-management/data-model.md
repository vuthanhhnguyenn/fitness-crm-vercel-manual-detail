# Data Model: Staff List — Y-01 スタッフ・権限管理

**Feature**: `001-staff-list`  
**Date**: 2026-04-08  
**Phase**: 1 — Design & Contracts

---

## 1. TypeScript Enums & Types

### `src/types/staff.type.ts` (new file)

```typescript
/**
 * Staff role — 6 fixed system roles
 * Maps to JWT claim `role` on the authenticated session.
 */
export enum StaffRole {
  SYSTEM = 'system',
  HEADQUARTER = 'headquarter',
  MANAGER = 'manager',
  STAFF = 'staff',
  TRAINER = 'trainer',
  OBSERVER = 'observer',
}

/**
 * Staff account status
 */
export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Staff brand affiliation (staff-level only; sub-brands are Store attributes)
 * null = 全ブランド (HQ-level roles: headquarter, system)
 */
export type StaffBrand = 'joyfit' | 'fit365' | null;

/**
 * Sub-brand filter values (store-level attribute, used only for filtering)
 */
export type SubBrand = 'joyfit_plus' | 'joyfit_yoga' | 'joyfit24';

/**
 * Staff list item — shape returned by GET /crm/staff
 */
export interface StaffListItem {
  staff_id: string; // Display format "STF-###"
  name_kanji: string;
  name_kana: string;
  email: string;
  role: StaffRole;
  position_id: string;
  position_name: string;
  brand: StaffBrand; // 'joyfit' | 'fit365' | null
  status: StaffStatus;
  last_login_at: string | null; // ISO 8601 or null
  branch_id: string | null;
  store_id: string | null;
  fc_company_id: string | null;
}

/**
 * Staff position (職位マスター entry)
 */
export interface StaffPosition {
  id: string; // e.g. "pos-hq-admin"
  name: string; // e.g. "本部管理者"
}

/**
 * Branch (ブランチ) — organisational unit above Store
 */
export interface Branch {
  branch_id: string;
  name: string;
  store_ids: string[];
}

/**
 * Invitation entry in the 招待リスト staging area
 */
export interface StaffInvitationEntry {
  email: string;
  position_id: string;
  brand: StaffBrand;
}
```

---

## 2. Zod Schemas

### `src/app/api/_schemas/staff.schema.ts` (new file)

```typescript
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ── Enums ────────────────────────────────────────────────────────────────────

export const StaffRoleSchema = z.enum([
  'system',
  'headquarter',
  'manager',
  'staff',
  'trainer',
  'observer',
]);

export const StaffStatusSchema = z.enum(['active', 'inactive']);

export const StaffBrandSchema = z.enum(['joyfit', 'fit365']).nullable();

export const SubBrandSchema = z.enum(['joyfit_plus', 'joyfit_yoga', 'joyfit24']).nullable();

// ── Core entity schemas ──────────────────────────────────────────────────────

export const StaffListItemSchema = z.object({
  staff_id: z.string().openapi({ example: 'STF-001' }),
  name_kanji: z.string().openapi({ example: '田中 太郎' }),
  name_kana: z.string().openapi({ example: 'タナカ タロウ' }),
  email: z.string().email().openapi({ example: 'tanaka@joyfit.co.jp' }),
  role: StaffRoleSchema.openapi({ example: 'headquarter' }),
  position_id: z.string().openapi({ example: 'pos-hq-admin' }),
  position_name: z.string().openapi({ example: '本部管理者' }),
  brand: StaffBrandSchema.openapi({ example: 'joyfit' }),
  status: StaffStatusSchema.openapi({ example: 'active' }),
  last_login_at: z.string().nullable().openapi({ example: '2026-04-01T09:00:00+09:00' }),
  branch_id: z.string().nullable().openapi({ example: 'BRN-001' }),
  store_id: z.string().nullable().openapi({ example: 'STR-001' }),
  fc_company_id: z.string().nullable().openapi({ example: null }),
});

export const StaffPositionSchema = z.object({
  id: z.string().openapi({ example: 'pos-hq-admin' }),
  name: z.string().openapi({ example: '本部管理者' }),
});

// ── Query schemas ────────────────────────────────────────────────────────────

export const GetStaffQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  q: z.string().optional(), // search: name_kanji | name_kana | email
  position_id: z.string().optional(),
  brand: z.enum(['joyfit', 'fit365']).optional(),
  sub_brand: z.enum(['joyfit_plus', 'joyfit_yoga', 'joyfit24']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sort_by: z
    .enum(['staff_id', 'name_kanji', 'position_name', 'status', 'last_login_at'])
    .default('staff_id'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export type GetStaffQuery = z.infer<typeof GetStaffQuerySchema>;

// ── Response schemas ─────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
});

export const GetStaffResponseSchema = z.object({
  staff: z.array(StaffListItemSchema),
  pagination: PaginationSchema,
});

export type GetStaffResponse = z.infer<typeof GetStaffResponseSchema>;

export const GetPositionsResponseSchema = z.object({
  positions: z.array(StaffPositionSchema),
});

export type GetPositionsResponse = z.infer<typeof GetPositionsResponseSchema>;

// ── Mutation schemas ─────────────────────────────────────────────────────────

export const DeleteStaffBodySchema = z.object({
  reason: z.string().optional().openapi({ example: '退職のため' }),
});

export type DeleteStaffBody = z.infer<typeof DeleteStaffBodySchema>;

export const DeleteStaffResponseSchema = z.object({
  success: z.boolean(),
  deleted_id: z.string(),
});

export const InvitationEntrySchema = z.object({
  email: z.string().email().openapi({ example: 'new-staff@joyfit.co.jp' }),
  position_id: z.string().openapi({ example: 'pos-staff-fulltime' }),
  brand: z.enum(['joyfit', 'fit365']).nullable().openapi({ example: 'joyfit' }),
});

export const InviteStaffBodySchema = z.object({
  invitations: z.array(InvitationEntrySchema).min(1),
});

export type InviteStaffBody = z.infer<typeof InviteStaffBodySchema>;

export const InviteStaffResponseSchema = z.object({
  invited_count: z.number().int(),
  invitations: z.array(
    z.object({
      email: z.string().email(),
      status: z.enum(['sent', 'already_exists', 'failed']),
    }),
  ),
});

// ── Shared error schema (re-export from member schema or define independently) ─

export const StaffErrorResponseSchema = z.object({
  error: z.string(),
});
```

---

## 3. Mock DB Extensions

### Additions required in `src/app/api/_mock-db.ts`

#### 3a. New types and seed data

```typescript
// ── Staff entities ───────────────────────────────────────────────────────────

interface Branch {
  branch_id: string;
  name: string;
  store_ids: string[];
}

interface StaffPosition {
  id: string;
  name: string;
}

interface StaffRecord {
  staff_id: string;
  name_kanji: string;
  name_kana: string;
  email: string;
  role: 'system' | 'headquarter' | 'manager' | 'staff' | 'trainer' | 'observer';
  position_id: string;
  position_name: string;
  brand: 'joyfit' | 'fit365' | null;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  branch_id: string | null;
  store_id: string | null;
  fc_company_id: string | null;
}

// Seed data — 8 records matching spec screenshots STF-001 … STF-008
const MOCK_BRANCHES: Branch[] = [
  { branch_id: 'BRN-001', name: '東京ブロック', store_ids: ['STR-001', 'STR-002', 'STR-003'] },
  { branch_id: 'BRN-002', name: '大阪ブロック', store_ids: ['STR-004', 'STR-005'] },
];

const MOCK_POSITIONS: StaffPosition[] = [
  { id: 'pos-hq-admin', name: '本部管理者' },
  { id: 'pos-block-manager', name: 'ブロック長' },
  { id: 'pos-territory-manager', name: 'テリトリーマネージャー' },
  { id: 'pos-store-manager', name: '店舗責任者' },
  { id: 'pos-staff-fulltime', name: '正社員スタッフ' },
  { id: 'pos-staff-contract', name: '契約社員スタッフ' },
  { id: 'pos-part-super', name: 'アルバイト（スーパー）' },
  { id: 'pos-part-general', name: 'アルバイト（一般）' },
  { id: 'pos-trainer-employee', name: '社員トレーナー' },
  { id: 'pos-trainer-external', name: '社外トレーナー' },
  { id: 'pos-observer', name: '閲覧専任' },
];

const MOCK_STAFF: StaffRecord[] = [
  {
    staff_id: 'STF-001',
    name_kanji: '田中 太郎',
    name_kana: 'タナカ タロウ',
    email: 'tanaka@joyfit.co.jp',
    role: 'headquarter',
    position_id: 'pos-hq-admin',
    position_name: '本部管理者',
    brand: null,
    status: 'active',
    last_login_at: '2026-04-01T09:00:00+09:00',
    branch_id: 'BRN-001',
    store_id: null,
    fc_company_id: null,
  },
  {
    staff_id: 'STF-002',
    name_kanji: '鈴木 花子',
    name_kana: 'スズキ ハナコ',
    email: 'suzuki@joyfit.co.jp',
    role: 'manager',
    position_id: 'pos-block-manager',
    position_name: 'ブロック長',
    brand: 'joyfit',
    status: 'active',
    last_login_at: '2026-03-31T14:30:00+09:00',
    branch_id: 'BRN-001',
    store_id: 'STR-001',
    fc_company_id: null,
  },
  {
    staff_id: 'STF-003',
    name_kanji: '佐藤 次郎',
    name_kana: 'サトウ ジロウ',
    email: 'sato@joyfit.co.jp',
    role: 'manager',
    position_id: 'pos-territory-manager',
    position_name: 'テリトリーマネージャー',
    brand: 'joyfit',
    status: 'active',
    last_login_at: '2026-03-30T11:00:00+09:00',
    branch_id: 'BRN-001',
    store_id: 'STR-002',
    fc_company_id: null,
  },
  {
    staff_id: 'STF-004',
    name_kanji: '高橋 三郎',
    name_kana: 'タカハシ サブロウ',
    email: 'takahashi@fit365.co.jp',
    role: 'staff',
    position_id: 'pos-store-manager',
    position_name: '店舗責任者',
    brand: 'fit365',
    status: 'active',
    last_login_at: '2026-04-01T08:00:00+09:00',
    branch_id: 'BRN-002',
    store_id: 'STR-004',
    fc_company_id: null,
  },
  {
    staff_id: 'STF-005',
    name_kanji: '山田 四郎',
    name_kana: 'ヤマダ シロウ',
    email: 'yamada@joyfit.co.jp',
    role: 'staff',
    position_id: 'pos-staff-fulltime',
    position_name: '正社員スタッフ',
    brand: 'joyfit',
    status: 'active',
    last_login_at: '2026-03-28T17:00:00+09:00',
    branch_id: 'BRN-001',
    store_id: 'STR-003',
    fc_company_id: null,
  },
  {
    staff_id: 'STF-006',
    name_kanji: '伊藤 五郎',
    name_kana: 'イトウ ゴロウ',
    email: 'ito@joyfit.co.jp',
    role: 'trainer',
    position_id: 'pos-trainer-employee',
    position_name: '社員トレーナー',
    brand: 'joyfit',
    status: 'inactive',
    last_login_at: '2026-02-15T10:00:00+09:00',
    branch_id: 'BRN-001',
    store_id: 'STR-001',
    fc_company_id: null,
  },
  {
    staff_id: 'STF-007',
    name_kanji: '渡辺 六助',
    name_kana: 'ワタナベ ロクスケ',
    email: 'watanabe@fit365.co.jp',
    role: 'staff',
    position_id: 'pos-part-general',
    position_name: 'アルバイト（一般）',
    brand: 'fit365',
    status: 'active',
    last_login_at: null,
    branch_id: 'BRN-002',
    store_id: 'STR-005',
    fc_company_id: null,
  },
  {
    staff_id: 'STF-008',
    name_kanji: '中村 七海',
    name_kana: 'ナカムラ ナナミ',
    email: 'nakamura@joyfit.co.jp',
    role: 'observer',
    position_id: 'pos-observer',
    position_name: '閲覧専任',
    brand: null,
    status: 'inactive',
    last_login_at: '2026-01-10T09:00:00+09:00',
    branch_id: 'BRN-002',
    store_id: 'STR-004',
    fc_company_id: null,
  },
];
```

#### 3b. `db.staff` accessor methods

```typescript
staff: {
  getList:   () => [...MOCK_STAFF],
  getById:   (id: string) => MOCK_STAFF.find(s => s.staff_id === id) ?? null,
  delete:    (id: string) => { /* splice from array */ },
},
branches: {
  getById:   (id: string) => MOCK_BRANCHES.find(b => b.branch_id === id) ?? null,
},
positions: {
  getList:   () => [...MOCK_POSITIONS],
},
```

---

## 4. Entity Relationships

```
Branch (BRN-###)
  └─► Store[] (STR-###) — via branch_id on Store (or store_ids[] on Branch)

Staff (STF-###)
  ├─► branch_id  (FK → Branch)   — Manager-role scope anchor
  ├─► store_id   (FK → Store)    — Store affiliation (all staff)
  ├─► position_id (FK → Position) — 職位マスター
  └─► fc_company_id (FK → FcCompany | null)

Position (pos-***)  — 職位マスター; static for this feature
```

---

## 5. State Transitions

### Staff Status

```
active ──[DELETE]──► (removed from DB; deletion audit log entry created)
inactive ──[DELETE]──► (removed from DB; deletion audit log entry created)
```

No `active ↔ inactive` toggle is exposed on this screen (no 無効化 action — confirmed Q-07).

### Invite Flow

```
(not in DB)
  ──[POST /crm/staff/invitations]──►  InvitationSent (audit log)
                                       (triggers email send in production)
  ──[user clicks link in email]──►    StaffRecord created (out of scope Y-01-01)
```

---

## 6. Validation Rules

| Field                    | Rule                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `staff_id`               | Non-empty; `STF-\d{3}` format (display only; assigned by server) |
| `email`                  | RFC 5322 valid; unique across all staff                          |
| `role`                   | One of 6 `StaffRole` enum values                                 |
| `position_id`            | Must match an active Position in 職位マスター                    |
| `brand`                  | `'joyfit' \| 'fit365' \| null`; null allowed for HQ-level roles  |
| `status`                 | `'active' \| 'inactive'`                                         |
| `last_login_at`          | ISO 8601 datetime string or null                                 |
| `branch_id`              | Required for Manager-role; optional for others                   |
| `store_id`               | Required for Store-level staff; nullable for HQ                  |
| Invite `invitations[]`   | `min(1)` — at least one entry required                           |
| Invite `email` per entry | RFC 5322 valid                                                   |
| Invite `position_id`     | Must be a valid position ID                                      |
| Delete `reason`          | Optional string; no min/max length enforced server-side          |
