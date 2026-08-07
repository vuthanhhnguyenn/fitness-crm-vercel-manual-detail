# Technical Plan: 利用履歴タブ（A-01-01-e）

> **Pipeline Step**: 3 / 5 — `speckit.plan`
> **Spec**: `specs/member-detail/usage-history/spec.md`
> **Branch**: `feat/member-detail-usage-history`
> **Date**: 2026-04-23
> **Author**: speckit.plan

---

## 0. Prerequisites

- Spec approved ✅
- All `[NEEDS CLARIFICATION]` items resolved ✅
- UI prototype reference: `fitness-crm-ui/src/pages/member-detail.tsx` → `UsageTab()` (L1022–L1185)
- Existing implementation reference: `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/`

---

## 1. Architectural Overview

This feature adds a new **"利用履歴"** tab section to `MemberDetailPage` (`src/app/(private)/members/[id]/page.tsx`) implementing FR-010 specification. It introduces a **2-column layout** (left 60%: entry/exit + lesson history, right 40%: access settings card).

**Note**: This implementation focuses on the three new sections (entry/exit history, lesson reservations, access settings). Existing items (utilization summary, store usage, pattern analysis) are **out of scope** and will be removed.

```
MemberDetailPage
  └── TabsTrigger value="usage"
        └── UsageHistoryTab (新規実装)
              ├── [Left Column 60%]
              │   ├── EntryExitTable      (新規: 入退館履歴 + フィルター + ページネーション)
              │   └── LessonTable         (新規: レッスン予約履歴)
              │
              └── [Right Column 40%]
                  └── AccessSettingsCard (新規: 入退館設定, sticky)
```

Single React Query call (existing endpoint, extended):

| Query          | Endpoint                              | Purpose                                     |
| -------------- | ------------------------------------- | ------------------------------------------- |
| `usageHistory` | `GET /crm/members/{id}/usage-history` | Fetch entry/exit + lesson + access settings |

Query response structure:

```typescript
{
  visitRecords: VisitRow[]              // Entry/exit history (with exit_time, stay_time, entry_method)
  lessonReservations: LessonReservationRow[]  // Lesson history (NEW)
  memberAccessSettings: MemberAccessSettings // Access settings (NEW)
}
```

---

## 2. Data Model & Types

### 2.1 Zod Schemas — `src/app/api/_schemas/member.schema.ts` (append)

```typescript
// --- Visit Record (extend existing) ---

export const EntryMethodSchema = z.enum(['qr_code', 'ic_card', 'face_recognition', 'member_card']);

export const VisitRowSchema = z.object({
  id: z.string(),
  entry_time: z.string(), // ISO8601
  exit_time: z.string().nullable(), // ISO8601 or null (still in building)
  stay_time: z.number().optional(), // minutes
  store_id: z.string(),
  store_name: z.string(),
  entry_method: z.string(), // 'qr_code', 'ic_card', etc.
});

// --- Lesson Reservation (NEW) ---

export const LessonReservationRowSchema = z.object({
  id: z.string(),
  lesson_date: z.string(), // YYYY-MM-DD
  lesson_name: z.string(),
  instructor_name: z.string(),
  status: z.enum(['attended', 'absent', 'cancelled', 'reserved']),
});

// --- Member Access Settings (NEW) ---

export const MemberAccessSettingsSchema = z.object({
  auth_method: z.string(), // "QRコード", "ICカード", etc.
  ic_card_number: z.string().nullable(),
  qr_code: z.string().nullable(),
  gate_stop: z.boolean(),
});

// --- Extended Response ---

export const GetUsageHistoryResponseSchema = z.object({
  summary: z.object({
    total_visits: z.number(),
    average_stay_time: z.number(),
    last_visit_date: z.string().nullable(),
    frequent_time_slot: z.string().nullable(),
    frequent_day_of_week: z.string().nullable(),
  }),
  storeUsage: z.array(
    z.object({
      store_id: z.string(),
      store_name: z.string(),
      visit_count: z.number(),
      usage_rate: z.number(),
      average_stay_time: z.number(),
    }),
  ),
  visitRecords: z.array(VisitRowSchema),
  lessonReservations: z.array(LessonReservationRowSchema),
  memberAccessSettings: MemberAccessSettingsSchema,
});

export type GetUsageHistoryResponse = z.infer<typeof GetUsageHistoryResponseSchema>;
export type VisitRow = z.infer<typeof VisitRowSchema>;
export type LessonReservationRow = z.infer<typeof LessonReservationRowSchema>;
export type MemberAccessSettings = z.infer<typeof MemberAccessSettingsSchema>;
```

### 2.2 TypeScript Types — `src/types/`

Types derive from Zod schemas via `z.infer<>`. The generated `src/lib/api/types.gen.ts` will expose them after `npm run generate-api`.

---

## 3. API Route Changes

### 3.1 `GET /crm/members/{id}/usage-history` (EXTEND existing)

**File**: `src/app/api/crm/members/[id]/usage-history/route.ts` (existing — modify)

**New Query Parameters** (optional, no validation error if omitted):

| Param    | Type                                                     | Default        | Notes                                               |
| -------- | -------------------------------------------------------- | -------------- | --------------------------------------------------- |
| `store`  | `string` (store_id or `"all"`)                           | `"all"`        | Filter visitRecords by store_id; "all" = unfiltered |
| `period` | `"this_month" \| "last_month" \| "3months" \| "6months"` | `"this_month"` | Filter visitRecords by date range (calendar month)  |

**Response Changes**:

```typescript
{
  // Only include these 3 sections (legacy fields removed)
  visitRecords: [
    {
      id: string,
      entry_time: ISO8601,
      exit_time: ISO8601 | null,        // NEW
      stay_time: number | undefined,    // NEW (minutes)
      store_id: string,
      store_name: string,
      entry_method: string,             // NEW
    }
  ],
  lessonReservations: [
    {
      id: string,
      lesson_date: YYYY-MM-DD,
      lesson_name: string,
      instructor_name: string,
      status: 'attended' | 'absent' | 'cancelled' | 'reserved',
    }
  ],
  memberAccessSettings: {
    auth_method: string,
    ic_card_number: string | null,
    qr_code: string | null,
    gate_stop: boolean,
  }
}
```

**Note**: `summary` and `storeUsage` are removed (not needed for this feature).

---

## 4. OpenAPI & Client Generation

After modifying the route, run:

```bash
npm run generate-openapi   # writes src/lib/openapi.json
npm run generate-api       # writes src/lib/api/ (types.gen.ts + react-query.gen.ts)
```

The existing generated option factory will be updated:

- `getCrmMembersByIdUsageHistoryOptions` (extended response type)

---

## 5. UI Components

### 5.1 Directory Structure

```
src/app/(private)/members/[id]/_components/tabs/usage-history-tab/
├── index.tsx                      ← UsageHistoryTab (existing — REWRITE layout)
├── columns.tsx                    ← EDIT: Add VisitRow columns for exit_time, auth_method, type
├── entry-exit-table.tsx           ← NEW: Entry/exit history + filters + pagination
├── lesson-table.tsx               ← NEW: Lesson reservation history
├── access-settings-card.tsx       ← NEW: Access settings (right sidebar, sticky)
├── auth-method-label.ts           ← NEW: Helper to map 'qr_code' → 'QRコード', etc.
└── lesson-status-badge.tsx        ← NEW: Lesson status badge component
```

### 5.2 `index.tsx` — `UsageHistoryTab` (REWRITE)

**Signature**:

```typescript
interface UsageHistoryTabProps {
  memberId: string;
  onGateStopAction?: () => void; // Callback to open gate-stop release sheet (optional)
}

export function UsageHistoryTab({ memberId, onGateStopAction }: UsageHistoryTabProps);
```

**Changes**:

- Implement **2-column layout**: `<div className="flex gap-4">`
  - Left: `w-[60%] flex flex-col gap-4`
  - Right: `w-[40%]`
- Local state (new):
  - `storeFilter: string` (default `"all"`)
  - `periodFilter: string` (default `"this_month"`)
  - `entryExitPage: number` (default `1`)
- Single `useQuery` call (from existing endpoint, but with new response structure)
- Wrap sections in `<DataStateBoundary>`

**Layout**:

```tsx
<div className="flex gap-4">
  <div className="flex w-[60%] flex-col gap-4">
    <EntryExitTable
      records={data.visitRecords}
      total={/* calculated from pagination */}
      page={entryExitPage}
      onPageChange={setEntryExitPage}
      storeFilter={storeFilter}
      periodFilter={periodFilter}
      onStoreFilterChange={setStoreFilter}
      onPeriodFilterChange={setPeriodFilter}
      stores={/* extract from visitRecords */}
    />

    <LessonTable reservations={data.lessonReservations} />
  </div>

  <div className="w-[40%]">
    <AccessSettingsCard settings={data.memberAccessSettings} onGateStopRelease={onGateStopAction} />
  </div>
</div>
```

### 5.3 `columns.tsx` (EDIT)

**Current VisitRow columns**:

```typescript
export const VISIT_COLUMNS = [
  {
    accessorKey: 'entry_time',
    header: '来館日時',
    cell: ({ row }) => formatDateTime(row.original.entry_time),
  },
  // ... stay_time, store_name, entry_method
];
```

**New columns layout** (per UI prototype):

| Column   | Field                     | Format                                                                        |
| -------- | ------------------------- | ----------------------------------------------------------------------------- |
| 日時     | `entry_time`              | `formatDateTime(entry_time)` (e.g., "2026/04/23 18:00")                       |
| 店舗     | `store_name`              | Text                                                                          |
| 種別     | computed from `exit_time` | Badge: "入館" (if exit_time is null) OR "退館" (if exit_time present)         |
| 認証方法 | `entry_method`            | Call `getAuthMethodLabel(entry_method)` to convert `'qr_code'` → `'QRコード'` |

**New column definition**:

```typescript
export const VISIT_COLUMNS: ColumnDef<VisitRow>[] = [
  {
    accessorKey: 'entry_time',
    header: '日時',
    cell: ({ row }) => (
      <span className="text-sm">
        {format(parseISO(row.original.entry_time), 'yyyy/MM/dd HH:mm')}
      </span>
    ),
  },
  {
    accessorKey: 'store_name',
    header: '店舗',
    cell: ({ row }) => <span className="text-sm">{row.original.store_name}</span>,
  },
  {
    id: 'type',
    header: '種別',
    cell: ({ row }) => {
      const isEntry = !row.original.exit_time;
      return (
        <Badge
          variant="outline"
          className={`text-[10px] gap-1 ${
            isEntry
              ? 'bg-info/15 text-info border-info/20'
              : 'text-muted-foreground'
          }`}
        >
          {isEntry ? <LogIn className="size-3" /> : <LogOut className="size-3" />}
          {isEntry ? '入館' : '退館'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'entry_method',
    header: '認証方法',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {getAuthMethodLabel(row.original.entry_method)}
      </span>
    ),
  },
];
```

### 5.4 `entry-exit-table.tsx` (NEW)

**Props**:

```typescript
interface EntryExitTableProps {
  records: VisitRow[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  storeFilter: string;
  periodFilter: string;
  onStoreFilterChange: (value: string) => void;
  onPeriodFilterChange: (value: string) => void;
  stores: Array<{ id: string; name: string }>; // Extracted from storeUsage
}
```

**Structure**:

- `<Card>` wrapper
- Header:
  - Left: `<CardTitle>入退館履歴</CardTitle>`
  - Right: Two `<Select>` controls
    - Store selector: `<SelectItem value="all">全店舗</SelectItem>` + items from `props.stores`
    - Period selector: predefined options (今月 / 先月 / 過去3ヶ月 / 過去6ヶ月)
- `<Table>` with `VISIT_COLUMNS`
- Footer: `<TablePagination>` (50 rows/page)
- Empty state: "該当の入退館履歴がありません。"
- On filter change: trigger parent refetch with `store` / `period` params

### 5.5 `lesson-table.tsx` (NEW)

**Props**:

```typescript
interface LessonTableProps {
  reservations: LessonReservationRow[];
}
```

**Structure**:

- `<Card>` wrapper
- Header: `<CardTitle>レッスン予約履歴</CardTitle>` (no filters)
- `<Table>` with columns:
  - 日付 (format as YYYY/MM/DD)
  - レッスン名
  - 担当 (instructor_name, muted color)
  - 状態 (status badge via `<LessonStatusBadge>`)
- No pagination (display all, max 50 seed records)
- Empty state: "レッスン予約履歴がありません。"

### 5.6 `access-settings-card.tsx` (NEW)

**Props**:

```typescript
interface AccessSettingsCardProps {
  settings: MemberAccessSettings;
  onGateStopRelease: (() => void) | undefined;
}
```

**Structure**:

- `<Card>` wrapper with `sticky top-6` positioning (right column)
- Header: `<CardTitle>入退館設定</CardTitle>`
- Content (4 rows):
  - 認証方法: `getAuthMethodLabel(settings.auth_method)`
  - ICカード番号: `settings.ic_card_number || '—'` (font-mono)
  - QRコード: `settings.qr_code || '—'`
  - ゲートストップ:
    - Status text: `settings.gate_stop ? '設定中' : '設定なし'`
    - If `settings.gate_stop === true` AND `onGateStopRelease` is defined:
      - Show `<Button variant="outline">解除</Button>` to the right of label
      - On click: call `onGateStopRelease()`
    - If `settings.gate_stop === false` or `onGateStopRelease` undefined: no button

### 5.7 `auth-method-label.ts` (NEW)

```typescript
export function getAuthMethodLabel(method: string): string {
  switch (method) {
    case 'qr_code':
      return 'QRコード';
    case 'ic_card':
      return 'ICカード';
    case 'face_recognition':
      return '顔認証';
    case 'member_card':
      return '会員カード';
    default:
      return method;
  }
}
```

### 5.8 `lesson-status-badge.tsx` (NEW)

Maps status → Japanese label + color:

```typescript
export function LessonStatusBadge({ status }: { status: string }) {
  const config = {
    attended: { label: '参加済み', className: 'bg-success/15 text-success border-success/20' },
    absent: { label: '欠席', className: 'bg-warning/15 text-warning border-warning/20' },
    cancelled: { label: 'キャンセル', className: 'bg-muted text-muted-foreground' },
    reserved: { label: '予約済み', className: 'bg-info/15 text-info border-info/20' },
  };

  const { label, className } = config[status] || { label: status, className: '' };

  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>
      {label}
    </Badge>
  );
}
```

### 5.9 Empty & Error States

- All sections wrapped in `<DataStateBoundary>` from existing pattern
- Loading: skeleton via DataStateBoundary
- Error: show error message + "リトライ" button
- Empty: show appropriate message per section

---

## 6. Integration into `MemberDetailPage`

**File**: `src/app/(private)/members/[id]/page.tsx` (MINOR EDIT)

**Changes**:

1. Update import (if needed):

   ```typescript
   import { UsageHistoryTab } from './_components/tabs/usage-history-tab';
   ```

   (Already present in existing code)

2. Update the `TabsContent` for `usage` tab:
   ```tsx
   <TabsContent value="usage">
     <UsageHistoryTab
       memberId={memberId}
       onGateStopAction={() => setShowGateStopReleaseSheet(true)}
     />
   </TabsContent>
   ```
   (Pass the existing gate-stop handler callback)

---

## 7. Mock DB Seed Data

**File**: `src/app/api/_mock-db.ts` (EDIT)

**Changes**:

1. **Extend existing `visitRecords` array**:
   - Add `exit_time`, `stay_time`, `entry_method` fields to each seed record
   - Example:
     ```typescript
     {
       id: 'vr-001',
       entry_time: '2026-04-23T18:00:00Z',
       exit_time: '2026-04-23T19:30:00Z',    // NEW
       stay_time: 90,                         // NEW (minutes)
       store_id: 'store-001',
       store_name: 'JOYFIT渋谷店',
       entry_method: 'qr_code',               // NEW
     }
     ```

2. **Add new seed array**: `MOCK_LESSON_RESERVATIONS`
   - 8–10 records covering all 4 statuses: `'attended'`, `'absent'`, `'cancelled'`, `'reserved'`
   - Example:
     ```typescript
     {
       id: 'lr-001',
       lesson_date: '2026-04-23',
       lesson_name: 'ボクシング基礎',
       instructor_name: '田中太郎',
       status: 'attended',
     }
     ```

3. **Add new seed object**: `MOCK_MEMBER_ACCESS_SETTINGS`
   - One record per member (or a function to generate per memberId)
   - Example:
     ```typescript
     {
       auth_method: 'QRコード',
       ic_card_number: null,
       qr_code: 'QR123456789',
       gate_stop: false,
     }
     ```

4. **Update route response** to include new fields in visitRecords and append lessonReservations + memberAccessSettings

---

## 8. Access Control

- No additional middleware changes required
- The tab already exists and is unconditionally rendered
- The API route returns filtered data based on member access (existing auth middleware via `src/middleware.ts`)
- 403 for unauthorized member access already handled at the member level

---

## 9. File Change Summary

| File                                                                                         | Action     | Notes                                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/_schemas/member.schema.ts`                                                      | Edit       | Append/update Zod schemas for VisitRow, LessonReservationRow, MemberAccessSettings (remove summary/storeUsage)                                                 |
| `src/app/api/_mock-db.ts`                                                                    | Edit       | Update visitRecords (add exit_time, stay_time, entry_method); add MOCK_LESSON_RESERVATIONS, MOCK_MEMBER_ACCESS_SETTINGS (remove summary/store usage seed data) |
| `src/app/api/crm/members/[id]/usage-history/route.ts`                                        | Edit       | Update response schema, add query params (store, period), integrate new mock data (remove summary/storeUsage responses)                                        |
| `src/lib/openapi.json` _(generated)_                                                         | Regenerate | `npm run generate-openapi`                                                                                                                                     |
| `src/lib/api/types.gen.ts` _(generated)_                                                     | Regenerate | `npm run generate-api`                                                                                                                                         |
| `src/lib/api/@tanstack/react-query.gen.ts` _(generated)_                                     | Regenerate | `npm run generate-api`                                                                                                                                         |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/index.tsx`                | Edit       | Rewrite to 2-column layout, new state, integrate new components (remove old cards)                                                                             |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/columns.tsx`              | Edit       | Update VISIT_COLUMNS (日時 / 店舗 / 種別 / 認証方法 only)                                                                                                      |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/entry-exit-table.tsx`     | **New**    | Entry/exit table with filters + pagination                                                                                                                     |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/lesson-table.tsx`         | **New**    | Lesson reservation table                                                                                                                                       |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/access-settings-card.tsx` | **New**    | Access settings card (sticky right)                                                                                                                            |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/auth-method-label.ts`     | **New**    | Helper: entry_method enum → Japanese label                                                                                                                     |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/lesson-status-badge.tsx`  | **New**    | Lesson status badge component                                                                                                                                  |
| `src/app/(private)/members/[id]/page.tsx`                                                    | Edit       | Update UsageHistoryTab props (pass onGateStopAction)                                                                                                           |

**Total**: 3 API edits, 8 UI component files (5 new, 3 edit), 3 regenerations.

---

## 10. Implementation Order (Critical Path)

1. **Schemas & Mock DB** → API routes → Generate types
   - Edit `_schemas/member.schema.ts` + `_mock-db.ts`
   - Edit `usage-history/route.ts`
   - Run `npm run generate-openapi && npm run generate-api`

2. **UI Components** (in parallel or sequence)
   - Create `auth-method-label.ts`, `lesson-status-badge.tsx`
   - Create `entry-exit-table.tsx`, `lesson-table.tsx`, `access-settings-card.tsx`
   - Edit `columns.tsx`
   - Rewrite `index.tsx`

3. **Integration**
   - Edit `page.tsx` (minor: pass props)

4. **Validation**
   - Test tab rendering, filters, pagination, empty states
   - Verify 2-column layout (60/40 split)
   - Check sticky right card behavior

---

## 11. UI Prototype Registry Entry

| Branch                             | Screen name  | UI slug         | Cache path                                                                  | Spec IDs    |
| ---------------------------------- | ------------ | --------------- | --------------------------------------------------------------------------- | ----------- |
| `feat/member-detail-usage-history` | 利用履歴タブ | `member-detail` | `.cache/remote-ui/fitness-crm-ui/src/pages/member-detail.tsx` (L1022–L1185) | A-01 FR-010 |

---

## 12. Out of Scope

- Utilization summary card (removed from this feature)
- Store usage statistics (removed)
- Utilization pattern analysis (removed)
- Edit / delete of usage records or access settings (read-only per spec)
- Lessons detailed view or booking interface (display only)
- Exporting usage/lesson history (display only)
- URL state for filters (local state only; no `nuqs` needed)
- Real gate-stop API call (delegates to existing page.tsx handler)

---

## 13. Dependencies

- No new npm packages required
- Uses existing utilities:
  - `format`, `parseISO` from `date-fns`
  - `cn()` from `src/lib/utils.ts`
  - `DataTable`, `DataStateBoundary`, `TablePagination` from existing components
  - `Badge`, `Button`, `Card`, `Select`, `Table`, `Tabs` from shadcn/ui

---

## Handoff

> Plan complete. Please review and approve, then trigger the next step:
>
> **"Follow instructions in speckit.tasks.prompt.md"**
