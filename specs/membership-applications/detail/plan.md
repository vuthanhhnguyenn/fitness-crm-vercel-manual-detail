# C-01-01 Membership Application Detail — Technical Plan

> **SpecKit Step**: 3 — speckit.plan
> **Status**: Awaiting Approval
> **Created**: 2026-05-06
> **Spec reference**: `specs/membership-applications/detail/spec.md`
> **UI Prototype**: `fitness-crm-ui/src/pages/enrollment-application-detail.tsx`

---

## UI Prototype Registry (updated)

| Branch               | Screen name                   | UI slug                         | Cache path                                                          | Spec IDs |
| -------------------- | ----------------------------- | ------------------------------- | ------------------------------------------------------------------- | -------- |
| `feat/update-agents` | Membership Application Detail | `enrollment-application-detail` | `.cache/fitness-crm-ui/src/pages/enrollment-application-detail.tsx` | C-01-01  |

---

## 1. Summary of Changes

| Layer                | Action                              | Scope                                                     |
| -------------------- | ----------------------------------- | --------------------------------------------------------- |
| New shared component | Create `PageHeader`                 | `src/components/common/page-header.tsx`                   |
| Page component       | Full rewrite                        | `src/app/(private)/membership-applications/[id]/page.tsx` |
| New components       | Create 13 new files                 | `[id]/_components/`                                       |
| Delete components    | Delete 9 old files                  | `[id]/_components/` + shared `_components/`               |
| Delete schemas       | Delete 2 old files                  | `[id]/_schemas/`                                          |
| API schema           | Extend detail Zod schema            | `src/app/api/_schemas/membership-application.schema.ts`   |
| API route GET        | Extend response handler             | `src/app/api/crm/membership-applications/[id]/route.ts`   |
| API route PATCH      | Remove PATCH registration + handler | same route file                                           |
| Mock DB              | Extend `_details` seed data         | `src/app/api/_mock-db.ts`                                 |
| Reject schema        | Add `note` optional field           | `membership-application.schema.ts` (RejectRequestSchema)  |
| Re-generate          | Run generate-openapi + generate-api | CLI                                                       |

---

## 2. New Shared Component: `PageHeader`

**File**: `src/components/common/page-header.tsx`

Copied verbatim from prototype (`fitness-crm-ui/src/components/page-header.tsx`) with minor adaptation:

```tsx
// src/components/common/page-header.tsx
import type { ReactNode } from 'react';

interface PageHeaderProps {
  breadcrumb?: ReactNode;
  title: string;
  badge?: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  sticky?: boolean; // default true
}

export function PageHeader({
  breadcrumb,
  title,
  badge,
  subtitle,
  actions,
  sticky = true,
}: PageHeaderProps) {
  return (
    <header
      className={
        sticky
          ? 'bg-muted/40 sticky top-0 z-10 -mx-6 mb-4 border-b px-6 pt-2 pb-3 backdrop-blur-sm'
          : 'mb-4'
      }
    >
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-xl font-bold">{title}</h1>
          {badge}
        </div>
        <div className="flex min-h-8 shrink-0 items-center gap-2">{actions}</div>
      </div>
      {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
    </header>
  );
}
```

---

## 3. Files to Delete

| File                                                                | Why                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| `[id]/_components/basic-info-card.tsx`                              | Replaced by `applicant-info-card.tsx`                       |
| `[id]/_components/risk-details-section.tsx`                         | Replaced by `blacklist-result-card.tsx`                     |
| `[id]/_components/member-info-tab.tsx`                              | Folded into `applicant-info-card.tsx`                       |
| `[id]/_components/contract-info-tab.tsx`                            | Replaced by `contract-info-card.tsx`                        |
| `[id]/_components/payment-info-tab.tsx`                             | Replaced by `fee-payment-card.tsx`                          |
| `[id]/_components/history-tab.tsx`                                  | Replaced by `activity-timeline-card.tsx`                    |
| `[id]/_components/edit-membership-application-modal.tsx`            | Edit action removed from new design                         |
| `[id]/_components/application-detail-footer.tsx`                    | Actions moved to right-column status card                   |
| `[id]/_components/membership-application-detail-skeleton.tsx`       | Will be recreated to match new layout                       |
| `[id]/_schemas/edit-membership-application-form.schema.ts`          | Edit modal deleted                                          |
| `[id]/_schemas/reject-form.schema.ts`                               | Reject reason handled inline in reject-dialog               |
| `membership-applications/_components/approve-application-modal.tsx` | Only used from footer (deleted); replaced by approve-dialog |
| `membership-applications/_components/reject-application-modal.tsx`  | Same                                                        |

---

## 4. Files to Create

```
src/components/common/
└── page-header.tsx                              ← NEW shared component

src/app/(private)/membership-applications/[id]/
├── page.tsx                                     ← REWRITE (RSC shell)
└── _components/
    ├── membership-application-detail.tsx        ← NEW ('use client', main layout + all state)
    ├── applicant-info-card.tsx                  ← NEW
    ├── blacklist-result-card.tsx                ← NEW
    ├── contract-info-card.tsx                   ← NEW
    ├── fee-payment-card.tsx                     ← NEW
    ├── activity-timeline-card.tsx               ← NEW
    ├── status-action-card.tsx                   ← NEW
    ├── application-meta-card.tsx                ← NEW
    ├── approve-dialog.tsx                       ← NEW
    ├── reject-dialog.tsx                        ← NEW
    ├── cancel-dialog.tsx                        ← NEW
    ├── cancel-error-dialog.tsx                  ← NEW
    └── membership-application-detail-skeleton.tsx ← RECREATE
```

---

## 5. API Schema Changes

### 5.1 `GetApplicationDetailResponseSchema` — extend with new fields

**File**: `src/app/api/_schemas/membership-application.schema.ts`

Add the following fields inside the `.extend({...})` call of `GetApplicationDetailResponseSchema`. Fields that already exist in the schema are noted — do not duplicate them.

| Field                  | Zod type                                                                  | Already exists? | Notes                                                                |
| ---------------------- | ------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| `applicant_kana`       | `z.string().optional()`                                                   | ✗               | Furigana                                                             |
| `birth_date`           | `z.string().date().optional()`                                            | ✗               | `YYYY-MM-DD` (existing `birthday` field kept for backward compat)    |
| `age`                  | `z.number().int().optional()`                                             | ✗               | Calculated age                                                       |
| `gender`               | `z.enum([...]).optional()`                                                | ✓ already       | Keep as-is                                                           |
| `phone`                | `z.string().optional()`                                                   | ✗               | Masked display value                                                 |
| `phone_real`           | `z.string().optional()`                                                   | ✗               | Unmasked (Phase 1 only)                                              |
| `email_masked`         | `z.string().optional()`                                                   | ✗               | Masked email (existing `applicant_email` = real; add masked variant) |
| `address`              | `z.string().optional()`                                                   | ✗               | Masked address display                                               |
| `address_real`         | `z.string().optional()`                                                   | ✗               | Unmasked address                                                     |
| `blacklist_conditions` | `z.array(z.string()).optional()`                                          | ✗               | e.g. `["氏名＆生年月日一致"]`                                        |
| `usage_start_date`     | `z.string().date().optional()`                                            | ✗               | Usage start (distinct from contract `start_date`)                    |
| `monthly_fee`          | `z.number().optional()`                                                   | ✗               | Plan monthly fee                                                     |
| `campaign`             | `z.string().nullable().optional()`                                        | ✗               | Campaign name, null if none                                          |
| `options`              | `z.array(z.string()).optional()`                                          | ✗               | Option names                                                         |
| `fee_rows`             | `z.array(z.object({ label: z.string(), amount: z.number() })).optional()` | ✗               | Brand-specific fee breakdown                                         |
| `card_last4`           | `z.string().optional()`                                                   | ✗               | Last 4 digits of card                                                |
| `application_source`   | `z.enum(["アプリ", "管理画面"]).optional()`                               | ✗               | Application origin                                                   |
| `is_minor`             | `z.boolean().optional()`                                                  | ✗               | Under 18                                                             |
| `parental_consent`     | `z.boolean().optional()`                                                  | ✗               | Parental consent obtained                                            |
| `proxy_applicant`      | `z.string().nullable().optional()`                                        | ✗               | e.g. `"管理者A（STAFF-001）"`                                        |
| `agreement_date`       | `z.string().nullable().optional()`                                        | ✗               | Consent datetime string                                              |
| `approved_by`          | `z.string().nullable().optional()`                                        | ✓ check         | Verify exists; add if not                                            |
| `approved_at`          | `z.string().nullable().optional()`                                        | ✓ check         | Verify exists; add if not                                            |
| `rejected_by`          | `z.string().nullable().optional()`                                        | ✓ check         | Verify exists; add if not                                            |
| `rejected_at`          | `z.string().nullable().optional()`                                        | ✓ check         | Verify exists; add if not                                            |
| `rejected_reason`      | `z.string().nullable().optional()`                                        | ✗               | Rejection reason label                                               |
| `timeline`             | `z.array(TimelineEntrySchema).optional()`                                 | ✗               | See TimelineEntrySchema below                                        |

**Add `TimelineEntrySchema`** (new top-level export before `GetApplicationDetailResponseSchema`):

```ts
export const TimelineEntrySchema = z
  .object({
    id: z.string(),
    kind: z.enum(['system', 'memo']),
    date: z.string(), // "YYYY/MM/DD HH:MM"
    operator: z.string(), // staff name or "システム"
    content: z.string(),
  })
  .openapi({ title: 'TimelineEntry' });

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
```

### 5.2 `RejectRequestSchema` — add `note` field

Current schema only has `rejection_reason` + `staff_id`. Add:

```ts
note: z.string().optional().openapi({
  example: '本人確認書類の有効期限切れを確認。',
  description: 'Supplementary note for rejection',
}),
```

### 5.3 Remove PATCH from `[id]/route.ts`

The `PATCH /crm/membership-applications/{id}` endpoint and its `registerRoute` call should be removed from `src/app/api/crm/membership-applications/[id]/route.ts`. The `UpdateMembershipApplicationRequestSchema` and `UpdateMembershipApplicationResponseSchema` can remain in the schema file (they are already exported and may be used for type compatibility) but are no longer used by any route.

---

## 6. Mock DB Changes

**File**: `src/app/api/_mock-db.ts`

### 6.1 Extend `_details` seed entries

Currently `getDetails()` returns a `_details[id]` object with basic fields. The GET route handler needs to compose the full detail response from `_applications` (list item) + `_details` (extended info).

Add the following to each seed detail entry in `_seed()` (or build them dynamically in `getDetails()`):

```ts
// Per-application detail additions (extend the existing seed loop):
this._details[app.id] = {
  // existing fields
  applicant_name: app.applicant_name,
  applicant_kana: '...フリガナ...',        // NEW
  birth_date: '1990-01-15',               // NEW (same as existing birthday)
  age: 36,                                // NEW (calculated)
  gender: 'male',
  phone: '090-****-5678',                 // NEW (masked)
  phone_real: '090-1234-5678',            // NEW (unmasked)
  email_masked: 'ap***@example.jp',       // NEW
  applicant_email: `${app.id.toLowerCase()}@example.jp`,
  address: '東京都渋谷区****',            // NEW (masked)
  address_real: '東京都渋谷区1-2-3',      // NEW
  applicant_address: '東京都渋谷区1-2-3',
  blacklist_conditions: app.blacklist_match    // NEW
    ? ['氏名＆生年月日一致', '電話番号一致']
    : [],
  usage_start_date: app.start_date,           // NEW
  monthly_fee: 7700,                          // NEW
  campaign: app.campaign === 'なし' ? null : app.campaign,  // NEW
  options: ['水素水', 'ロッカー'],             // NEW
  fee_rows: app.brand_name === 'FIT365'       // NEW
    ? [
        { label: 'カード発行料', amount: 5500 },
        { label: '初月会費（日割）', amount: 990 },
        { label: '翌月会費', amount: 7700 },
      ]
    : [
        { label: '入会金', amount: 2200 },
        { label: '登録事務手数料', amount: 3300 },
        { label: '初月会費（日割）', amount: 990 },
        { label: '翌月会費', amount: 7700 },
      ],
  payment_method: 'クレジットカード',          // NEW
  card_last4: '1234',                         // NEW
  application_source: app.is_proxy ? '管理画面' : 'アプリ',  // NEW
  is_minor: app.is_minor ?? false,             // NEW
  parental_consent: app.is_minor ?? false,     // NEW
  proxy_applicant: app.is_proxy ? '管理者A（STAFF-001）' : null,  // NEW
  agreement_date: app.is_proxy ? '2026/03/30 09:00' : null,       // NEW
  approved_by: app.status === '承認済' ? '管理者A' : null,         // NEW
  approved_at: app.status === '承認済' ? app.application_date : null,  // NEW
  rejected_by: app.status === '否認' ? '管理者B' : null,           // NEW
  rejected_at: app.status === '否認' ? app.application_date : null,    // NEW
  rejected_reason: app.status === '否認' ? '本人確認不備' : null,   // NEW
  timeline: [                                  // NEW
    {
      id: `tl-${app.id}-1`,
      kind: 'system',
      date: app.application_date.replace('T', ' ').slice(0, 16).replace(/-/g, '/'),
      operator: app.is_proxy ? '管理者A' : 'システム',
      content: app.is_proxy ? '管理画面から代理申請を登録' : '申請受付（アプリ経由）',
    },
  ],
  // existing emergency contact fields
  emergency_contact_name: '佐藤 太郎',
  emergency_contact_relationship: '配偶者',
  emergency_contact_phone: '090-8765-4321',
  contract_details: { ... },  // keep as-is
};
```

> For APP-2026-0017 (minor): set `applicant_kana: 'ワカバヤシ ミナミ'`, `birth_date: '2009-05-15'`, `age: 16`.
> For APP-2026-0018 (proxy): set `application_source: '管理画面'`, `proxy_applicant: '管理者A（STAFF-001）'`, `agreement_date: '2026/03/30 09:00'`.
> For APP-2026-0003, 0007, 0016 (BL match): set `blacklist_conditions: ['氏名＆生年月日一致', '電話番号一致']`.

### 6.2 No new DB methods needed

`getDetails()` already exists and returns the `_details[id]` object. The GET route handler will merge `getById()` + `getDetails()` to build the full response.

---

## 7. GET `[id]` Route Handler Changes

**File**: `src/app/api/crm/membership-applications/[id]/route.ts`

### Current structure

- `registerRoute` for GET + `registerRoute` for PATCH
- GET handler: calls `db.membershipApplications.getById(id)` + `db.membershipApplications.getDetails(id)`, merges into response
- PATCH handler: validates body, calls `db.membershipApplications.updateDetails()`

### Changes required

1. **Remove** the `registerRoute` call for `PATCH` and the `export async function PATCH` handler entirely.
2. **Extend GET response mapping** to include all new fields from `_details`:

```ts
// In GET handler, after fetching app + details:
const response = {
  application: {
    // existing list fields from app:
    id: app.id,
    applicant_name: details.applicant_name ?? app.applicant_name,
    status: app.status,
    blacklist_match: app.blacklist_match,
    brand_name: app.brand_name,
    store_name: app.store_name,
    plan_name: app.plan_name,
    campaign: details.campaign ?? (app.campaign === 'なし' ? null : app.campaign),
    application_date: app.application_date,
    start_date: app.start_date,
    is_minor: app.is_minor ?? false,
    is_proxy: app.is_proxy ?? false,

    // NEW detail fields:
    applicant_kana: details.applicant_kana ?? '',
    birth_date: details.birth_date ?? details.birthday ?? '',
    age: details.age ?? 0,
    gender: details.gender ?? 'other',
    phone: details.phone ?? '',
    phone_real: details.phone_real ?? details.applicant_phone ?? '',
    email_masked: details.email_masked ?? '',
    applicant_email: details.applicant_email ?? '',
    address: details.address ?? '',
    address_real: details.address_real ?? details.applicant_address ?? '',
    blacklist_conditions: details.blacklist_conditions ?? [],
    usage_start_date: details.usage_start_date ?? app.start_date,
    monthly_fee: details.monthly_fee ?? 0,
    options: details.options ?? [],
    fee_rows: details.fee_rows ?? [],
    payment_method: details.payment_method ?? 'クレジットカード',
    card_last4: details.card_last4 ?? '0000',
    application_source: details.application_source ?? 'アプリ',
    parental_consent: details.parental_consent ?? false,
    proxy_applicant: details.proxy_applicant ?? null,
    agreement_date: details.agreement_date ?? null,
    approved_by: details.approved_by ?? null,
    approved_at: details.approved_at ?? null,
    rejected_by: details.rejected_by ?? null,
    rejected_at: details.rejected_at ?? null,
    rejected_reason: details.rejected_reason ?? null,
    updated_at: app.application_date, // use application_date as updated_at for now
    timeline: details.timeline ?? [],

    // existing fields kept for compatibility:
    gender: details.gender,
    blood_type: details.blood_type,
    birthday: details.birthday,
    applicant_address: details.applicant_address,
    applicant_phone: details.applicant_phone,
    emergency_contact_name: details.emergency_contact_name,
    emergency_contact_relationship: details.emergency_contact_relationship,
    emergency_contact_phone: details.emergency_contact_phone,
    payment_status: 'pending',
    contract_details: details.contract_details,
    ekyc: details.ekyc,
  },
};
```

---

## 8. Component Design

### 8.1 `page.tsx` (RSC shell)

```tsx
// Server Component (no 'use client')
import { getCrmMembershipApplicationsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';

import { MembershipApplicationDetail } from './_components/membership-application-detail';
import { MembershipApplicationDetailSkeleton } from './_components/membership-application-detail-skeleton';

// Use React Query dehydration or keep as client boundary:
export default function MembershipApplicationDetailPage() {
  return (
    <Suspense fallback={<MembershipApplicationDetailSkeleton />}>
      <MembershipApplicationDetailContent />
    </Suspense>
  );
}

// Inner client wrapper
('use client');
function MembershipApplicationDetailContent() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery(
    getCrmMembershipApplicationsByIdOptions({ path: { id } }),
  );
  if (isLoading) return <MembershipApplicationDetailSkeleton />;
  if (error || !data?.application) return <ErrorState />;
  return <MembershipApplicationDetail application={data.application} />;
}
```

> **Note**: Keep all data-fetching in `page.tsx` (or its inner client wrapper). Pass `application` as a prop to the main detail component. This avoids prop-drilling through multiple levels.

### 8.2 `membership-application-detail.tsx` (`'use client'`)

- Receives `application: GetCrmMembershipApplicationsByIdResponse['application']` as prop
- Owns all `useState` (listed in spec Section 8)
- Uses `useMutation` from React Query for approve / reject / cancel (calling existing API routes)
- On mutation success: calls `queryClient.invalidateQueries(getCrmMembershipApplicationsByIdQueryKey(...))` to refetch — **do not** manage status optimistically; let the refetch update state
- Renders two-column layout: left 60% + right 40%
- Passes slice of state + handlers down to each card component as props

**Mutation hooks**:

```ts
// approve
const approveMutation = useMutation({
  mutationFn: () => postCrmMembershipApplicationsByIdApprove({ path: { id } }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: getCrmMembershipApplicationsByIdQueryKey(...) });
    toast.success('入会申請を承認しました');
    setApproveDialogOpen(false);
  },
  onError: () => toast.error('承認に失敗しました'),
});

// reject
const rejectMutation = useMutation({
  mutationFn: (body: { rejection_reason: string; note?: string }) =>
    postCrmMembershipApplicationsByIdReject({ path: { id }, body }),
  onSuccess: () => { ... },
});

// cancel
const cancelMutation = useMutation({
  mutationFn: (body: { cancellation_reason: string }) =>
    postCrmMembershipApplicationsByIdCancel({ path: { id }, body }),
  onSuccess: () => { ... },
});
```

> **Note**: After mutation success + cache invalidation, the `application` prop will be stale until the parent re-renders with fresh data. Use `useQuery` in page.tsx and pass the live data down. The component re-renders automatically when the query cache updates.

### 8.3 `applicant-info-card.tsx`

Props: `{ application, allPersonalVisible, onToggleAllPersonal }`

- Internal `MaskedField` sub-component (inline, not exported) — receives `label`, `maskedValue`, `realValue`, `forceVisible`
- Individual `visible` state per masked field via `useState` inside `MaskedField`

### 8.4 `blacklist-result-card.tsx`

Props: `{ blacklistMatch: boolean, blacklistConditions: string[] }`

- Pure presentational, no state

### 8.5 `contract-info-card.tsx`

Props: `{ application }` (uses brand, store_name, plan_name, monthly_fee, start_date, usage_start_date, campaign, options)

- Internal `Field` sub-component (label + value display, shared pattern)

### 8.6 `fee-payment-card.tsx`

Props: `{ feeRows, paymentMethod, cardLast4 }`

- Renders `<Table>` integrated inside Card (no Card padding on table section)
- Shows JACCS `Alert` when `paymentMethod !== "クレジットカード"`

### 8.7 `activity-timeline-card.tsx`

Props: `{ timeline, onAddMemo, onDeleteMemo, memoText, onMemoTextChange }`

- Memo add/delete: local state only (Phase 1); `onAddMemo` and `onDeleteMemo` are callbacks in `membership-application-detail.tsx` that mutate the local `timeline` array state

### 8.8 `status-action-card.tsx`

Props: `{ application, currentStatus, todayCancelCount, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectedReason, onApprove, onReject }`

- Pre-approval checklist: reads `blacklist_match`, `is_minor`, `age`, `brand_name`, `parental_consent` from `application`
- Action buttons: always rendered when `currentStatus === "未審査"`; pending `isPending` state from mutation passed as prop to disable buttons during flight

### 8.9 `application-meta-card.tsx`

Props: `{ application }` (uses id, application_date, application_source, updated_at, proxy_applicant, agreement_date)

Pure presentational.

### 8.10 `approve-dialog.tsx`

Props: `{ open, onOpenChange, application, feeRows, onConfirm, isPending }`

### 8.11 `reject-dialog.tsx`

Props: `{ open, onOpenChange, onConfirm, isPending }`

- Internal state: `rejectReason`, `rejectNote`

### 8.12 `cancel-dialog.tsx`

Props: `{ open, onOpenChange, paymentMethod, onConfirm, isPending }`

- Internal state: `cancelReason`

### 8.13 `cancel-error-dialog.tsx`

Props: `{ open, onOpenChange, message }`

### 8.14 `membership-application-detail-skeleton.tsx`

New skeleton matching two-column layout: left column (4 card skeletons stacked) + right column (2 card skeletons sticky).

---

## 9. Cancel Button Click Logic

The `handleCancelButtonClick` function in `membership-application-detail.tsx`:

```ts
function handleCancelButtonClick() {
  // Guard 1: status not 承認済
  if (currentStatus !== '承認済') {
    setCancelErrorMessage('この申請はキャンセルできません。');
    setCancelErrorOpen(true);
    return;
  }
  // Guard 2: usage start date has passed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = application.usage_start_date.split('-').map(Number);
  const usageStart = new Date(y!, m! - 1, d!);
  if (usageStart <= today) {
    setCancelErrorMessage('利用開始日を過ぎた申請はキャンセルできません。');
    setCancelErrorOpen(true);
    return;
  }
  // Guard 3: daily cancel count
  if (todayCancelCount >= 2) {
    setCancelErrorMessage('当日のキャンセル操作は2回までです。');
    setCancelErrorOpen(true);
    return;
  }
  setCancelDialogOpen(true);
}
```

---

## 10. Type Mapping

After `npm run generate-api`, the generated type `GetCrmMembershipApplicationsByIdResponse['application']` will include all new fields. Until re-generation, use the Zod schema's inferred type directly from `membership-application.schema.ts`:

```ts
import type { GetApplicationDetailResponse } from '@/app/api/_schemas/membership-application.schema';

type ApplicationDetail = GetApplicationDetailResponse['application'];
```

---

## 11. Execution Order

```
Step 1  Create src/components/common/page-header.tsx
Step 2  Update GetApplicationDetailResponseSchema (add TimelineEntrySchema + new fields)
Step 3  Update RejectRequestSchema (add note field)
Step 4  Remove PATCH from [id]/route.ts
Step 5  Extend GET handler mapping in [id]/route.ts
Step 6  Extend mock DB _details seed in _mock-db.ts
Step 7  Run: npm run generate-openapi && npm run generate-api
Step 8  Delete 13 old files (components + schemas)
Step 9  Create membership-application-detail-skeleton.tsx
Step 10 Create applicant-info-card.tsx
Step 11 Create blacklist-result-card.tsx
Step 12 Create contract-info-card.tsx
Step 13 Create fee-payment-card.tsx
Step 14 Create activity-timeline-card.tsx
Step 15 Create approve-dialog.tsx
Step 16 Create reject-dialog.tsx
Step 17 Create cancel-dialog.tsx
Step 18 Create cancel-error-dialog.tsx
Step 19 Create application-meta-card.tsx
Step 20 Create status-action-card.tsx
Step 21 Create membership-application-detail.tsx (main layout, wires all cards + dialogs)
Step 22 Rewrite page.tsx (RSC shell + query)
Step 23 UI Review — open browser at `/membership-applications/[id]`, compare side-by-side with prototype (`enrollment-application-detail.tsx`); fix any layout, spacing, color, or component divergence
Step 24 npm run type-check
Step 25 npm run lint
```

---

## 12. Risk & Constraints

| Risk                                                                   | Mitigation                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generated types (`lib/api/`) lag behind schema changes                 | Always run generate-openapi + generate-api (Step 7) before writing component code                                                                    |
| Reject API uses `rejection_reason` field name (not `reason`)           | Map carefully in `reject-dialog.tsx`: `body = { rejection_reason: rejectReason, note: rejectNote }`                                                  |
| Cancel API uses `cancellation_reason` field name (not `cancel_reason`) | Map in `cancel-dialog.tsx`: `body = { cancellation_reason: cancelReason }`                                                                           |
| `updated_at` not stored in mock DB application records                 | Use `application_date` as fallback for `updated_at` in GET response                                                                                  |
| PATCH route removal may break existing imports                         | Search for all `patch` / `UpdateMembershipApplication` usages before deleting — only `edit-membership-application-modal.tsx` uses it (being deleted) |
| `approved_by` / `rejected_by` already exist in schema                  | Verify before adding; only add missing ones to avoid Zod duplicate key errors                                                                        |

---

## Handoff

```
Next agent: speckit.tasks
Task: Break down this technical plan into a granular, ordered task list for implementation
```
