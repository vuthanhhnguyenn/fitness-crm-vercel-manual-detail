# Developer Quickstart: Visit/Experience Management — Detail Page

**Branch**: `003-visit-experience-detail`  
**Route**: `/visit-experiences/[id]`  
**Phase**: 1 (mock API — no backend required)

---

## Prerequisites

- Node.js ≥ 24.0.0
- Repo cloned and `npm install` run
- On branch `003-visit-experience-detail`
- `001-visit-experience-list` implementation merged (list page, existing mock route handler stubs, and seed data are present)

---

## Implementation Order

Work through the steps in sequence — each step's output is consumed by the next.

---

### Step 1 — Extend TypeScript Types

**File**: `src/types/api/visit-experience.type.ts`

Append the new types to the **bottom** of the existing file (do not modify existing types):

```typescript
export interface VisitTimelineEntry {
  timestamp: string;
  operator: string;
  content: string;
}

export interface VisitExperienceDetail extends VisitExperience {
  customer_name_kana: string;
  birth_date: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  id_document_type: string | null;
  id_document_verified: boolean;
  bl_match_reason: string | null;
  permit_issued_at: string | null;
  b01_auth_method: string | null;
  b01_gate: string | null;
  b01_entry_at: string | null;
  b01_exit_at: string | null;
  timeline: VisitTimelineEntry[];
}

export interface PermitVisitExperienceResponse {
  record: VisitExperienceDetail;
}
```

Full type block in [data-model.md](./data-model.md#typescript-type-additions).

---

### Step 2 — Extend Zod Schemas

**File**: `src/app/api/_schemas/visit-experience.schema.ts`

Append the new schemas to the **bottom** of the existing file (do not modify existing schemas):

```typescript
export const VisitTimelineEntrySchema = z.object({
  timestamp: z.string().datetime({ offset: true }),
  operator: z.string(),
  content: z.string(),
});

export const VisitExperienceDetailSchema = VisitExperienceSchema.extend({
  customer_name_kana: z.string(),
  birth_date: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  id_document_type: z.string().nullable(),
  id_document_verified: z.boolean(),
  bl_match_reason: z.string().nullable(),
  permit_issued_at: z.string().datetime({ offset: true }).nullable(),
  b01_auth_method: z.string().nullable(),
  b01_gate: z.string().nullable(),
  b01_entry_at: z.string().datetime({ offset: true }).nullable(),
  b01_exit_at: z.string().datetime({ offset: true }).nullable(),
  timeline: z.array(VisitTimelineEntrySchema),
});

export const PermitVisitExperienceResponseSchema = z.object({
  record: VisitExperienceDetailSchema,
});

export type VisitTimelineEntry = z.infer<typeof VisitTimelineEntrySchema>;
export type VisitExperienceDetail = z.infer<typeof VisitExperienceDetailSchema>;
export type PermitVisitExperienceResponse = z.infer<typeof PermitVisitExperienceResponseSchema>;
```

Full schema block in [data-model.md](./data-model.md#zod-schema-additions).

---

### Step 3 — Extend Mock Seed Data

**File**: `src/app/api/_mock-db.ts`

#### 3a — Change seed array type

Change the existing `SEED_VISIT_EXPERIENCES` type annotation from `VisitExperience[]` to `VisitExperienceDetail[]` (update import accordingly).

#### 3b — Add detail fields to every record

For each existing record in `SEED_VISIT_EXPERIENCES`, add the detail fields. Use the templates in [data-model.md § Mock DB Seed](./data-model.md#mock-db-seed-detail-fields--additions-to-existing-records).

**Minimum coverage requirements**:

| Scenario                 | Record(s) to cover                           |
| ------------------------ | -------------------------------------------- |
| Normal permit-ready      | ≥ 1 `application_received` record            |
| Info-missing (blocked)   | ≥ 1 `info_missing` with `phone/address null` |
| BL match (risk override) | ≥ 1 `bl_checking` with `bl_match: true`      |
| Currently visiting       | ≥ 1 `visiting` with `b01_entry_at` set       |
| Visit completed          | ≥ 1 `visit_completed` with `b01_exit_at` set |
| Every record             | ≥ 2 `timeline` entries                       |

#### 3c — Add `update()` method to visitExperiences collection

The permit action mutates a record in-place. Add an `update` method to the mock collection:

```typescript
update(id: string, record: VisitExperienceDetail): void {
  const idx = this._rows.findIndex((r) => r.id === id);
  if (idx !== -1) this._rows[idx] = record;
},
```

#### 3d — Update collection type

Change `visitExperiences._rows` and the `getAll()` / `getById()` return types from `VisitExperience` to `VisitExperienceDetail`.

> **List endpoint compatibility**: The existing `GET /api/crm/visit-experiences/route.ts` returns `VisitExperience[]`. Since `VisitExperienceDetail extends VisitExperience`, the existing list code continues to work without changes — TypeScript will accept the wider type where the narrower is expected. No list route changes needed.

---

### Step 4 — Upgrade GET Detail Route Handler

**File**: `src/app/api/crm/visit-experiences/[id]/route.ts`

Replace the existing stub with the full implementation:

```typescript
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = db.visitExperiences.getById(id);
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching visit experience detail:', error);
    return NextResponse.json({ error: 'Failed to fetch visit experience' }, { status: 500 });
  }
}
```

Full contract in [contracts/GET-visit-experience-detail.md](./contracts/GET-visit-experience-detail.md).

---

### Step 5 — Create Permit Route Handler

**File**: `src/app/api/crm/visit-experiences/[id]/permit/route.ts` _(new file)_

```typescript
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import type { VisitExperienceDetail } from '@/app/api/_schemas/visit-experience.schema';

const PERMITTABLE_STATUSES = ['application_received', 'bl_checking'] as const;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = db.visitExperiences.getById(id);

    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!PERMITTABLE_STATUSES.includes(record.status as (typeof PERMITTABLE_STATUSES)[number])) {
      return NextResponse.json(
        { error: 'Permit cannot be issued', reason: 'Reservation is not in a permittable state' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const updated: VisitExperienceDetail = {
      ...record,
      status: 'visiting',
      permit_issued_at: now,
      b01_gate: 'メインエントランス',
      b01_auth_method: '顔認証',
      timeline: [
        { timestamp: now, operator: '管理者A', content: '見学許可を発行（30分間の時間制限入館）' },
        ...record.timeline,
      ],
    };

    db.visitExperiences.update(id, updated);
    return NextResponse.json({ record: updated });
  } catch (error) {
    console.error('Error issuing visit permit:', error);
    return NextResponse.json({ error: 'Failed to issue permit' }, { status: 500 });
  }
}
```

Full contract in [contracts/POST-visit-experience-permit.md](./contracts/POST-visit-experience-permit.md).

---

### Step 6 — Extend React Query Option-Factories

**File**: `src/lib/api/@tanstack/visit-experience.query.ts`

Add to the **bottom** of the existing file:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  PermitVisitExperienceResponse,
  VisitExperienceDetail,
} from '@/types/api/visit-experience.type';

export const getCrmVisitExperienceDetailOptions = (id: string) =>
  queryOptions<VisitExperienceDetail>({
    queryKey: ['crm', 'visit-experiences', id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/visit-experiences/${id}`);
      if (!res.ok) throw new Error('Failed to fetch visit experience detail');
      return res.json() as Promise<VisitExperienceDetail>;
    },
  });

export const usePermitVisitExperienceMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<PermitVisitExperienceResponse, Error>({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/visit-experiences/${id}/permit`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to issue permit');
      return res.json() as Promise<PermitVisitExperienceResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'visit-experiences', id] });
    },
  });
};
```

> **Note**: The existing `getCrmVisitExperiencesByIdOptions` in this file returns `VisitExperience` (list type). Replace its usages in the detail page with `getCrmVisitExperienceDetailOptions` which returns `VisitExperienceDetail`.

---

### Step 7 — Build the Detail Page

**File**: `src/app/(private)/visit-experiences/[id]/page.tsx`

Replace the "coming soon" stub with the real RSC shell:

```typescript
import { Suspense } from 'react';
import { VisitExperienceDetailView } from './_components/visit-experience-detail-view';
import { VisitExperienceDetailSkeleton } from './_components/visit-experience-detail-skeleton';

export default async function VisitExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<VisitExperienceDetailSkeleton />}>
      <VisitExperienceDetailView id={id} />
    </Suspense>
  );
}
```

---

### Step 8 — Build Detail Components

Create the following `'use client'` components under `src/app/(private)/visit-experiences/[id]/_components/`. Each component receives the full `VisitExperienceDetail` record as a prop (fetched once in a parent wrapper component).

#### `visit-experience-detail-view.tsx` _(parent wrapper — 'use client')_

- Fetches `getCrmVisitExperienceDetailOptions(id)` via `useQuery`
- Wraps content in `DataStateBoundary` (or equivalent loading/error states)
- Renders the 2-column layout shell
- Passes the record down to child components as props

#### `visit-experience-personal-info.tsx`

- Displays: face-photo placeholder, 氏名, フリガナ, 生年月日
- Second grid: 電話番号, メールアドレス, 住所
- Shows `"未登録"` in `text-warning` colour for `null` phone/address
- Shows `info_missing` alert when `status === "info_missing"`

#### `visit-experience-id-document.tsx`

- Shows document image placeholder (Phase 1: always a placeholder), 書類種別, 確認ステータス badge (`確認済み` / `未確認`)
- When `id_document_type === null && !id_document_verified`: renders blocking alert only — hides image and fields

#### `visit-experience-bl-result.tsx`

- `bl_match === false`: success icon + "照合済み：該当なし"
- `bl_match === true`: destructive card, alert icon, `bl_match_reason`, link to blacklist detail via `navigate('blacklist-detail')`

#### `visit-experience-timeline.tsx`

- Maps `timeline` array (newest first) to timeline nodes
- System operator → neutral (`bg-muted-foreground`) dot
- Other operator → primary (`bg-primary`) dot
- Vertical connector line between entries

#### `visit-experience-status-panel.tsx`

- `StatusCard` with tone/icon/label from status-to-config map (see design)
- Below: `来店詳細情報` card — `reserved_at`, conditional `permit_issued_at`, `残り時間` countdown (visiting only), `visit_end_actual_at` (completed only)
- Countdown timer: `useEffect` + `setInterval(1000)` computing `permit_issued_at + 30min - now`

#### `visit-experience-actions.tsx`

- Renders the 操作 card based on `status` (see spec FR-007)
- Uses `RoleGatedButton` pattern for `見学を許可する` and `入会申請へ誘導`
- Integrates `usePermitVisitExperienceMutation(id)` for permit action
- Uses `AlertDialog` for permit confirmation
- On "入会申請へ誘導" click: `navigate('enrollment-application-form')` with applicable pre-fill query params

#### `visit-experience-b01-info.tsx`

- Renders only when `b01_entry_at !== null` (visiting or completed state)
- Fields: 認証方式, 許可ゲート, 入館時刻
- 退館時刻 shown only when `b01_exit_at !== null` (completed state)

---

### Step 9 — Role-Gated Button Pattern

The design uses `RoleGatedButton` from `@/components/role-gated-button`. Use it for both permit and enrollment navigation buttons:

```typescript
<RoleGatedButton
  allowedRoles={['Headquarter', 'System', 'Manager', 'Staff']}
  denyTooltip="見学許可の権限がありません"
  onClick={() => setConfirmDialogOpen(true)}
>
  <DoorOpen className="size-4" />
  見学を許可する（30分）
</RoleGatedButton>
```

---

### Step 10 — Type Check + Lint

```bash
npm run type-check   # must exit 0
npm run lint         # must exit 0
```

Fix all errors before opening a PR.

---

## Phase 2 Migration Checklist (future)

When DEV-BE publishes the OpenAPI spec for visit-experiences:

- [ ] Run `npm run generate-api` to regenerate `src/lib/api/`
- [ ] Delete `src/lib/api/@tanstack/visit-experience.query.ts`
- [ ] Update component imports to use generated option-factories from `react-query.gen`
- [ ] Remove `VisitExperienceDetail`, `VisitTimelineEntry`, `PermitVisitExperienceResponse` from `src/types/api/visit-experience.type.ts` (now in `types.gen.ts`)
- [ ] Remove added schemas from `src/app/api/_schemas/visit-experience.schema.ts`
- [ ] Remove mock Route Handlers: `[id]/route.ts` (upgrade removed) and `[id]/permit/route.ts`
- [ ] Remove detail fields from `_mock-db.ts` seed data
- [ ] Implement real B-01 integration in permit flow
