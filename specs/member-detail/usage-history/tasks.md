# Tasks: 利用履歴タブ（A-01-01-e）

> **Pipeline Step**: 4 / 5 — `speckit.tasks`
> **Plan**: `specs/member-detail/usage-history/plan.md`
> **Branch**: `feat/member-detail-usage-history`
> **Date**: 2026-04-23

---

## Overview

This document breaks down the technical plan into **atomic, actionable tasks** for implementation. Each task is:

- **Scoped**: Single file or logical concern
- **Ordered**: Critical path dependency respected
- **Testable**: Acceptance criteria defined
- **Reviewable**: Clear before/after state

**Total Tasks**: 14
**Estimated Effort**: 8–12 developer hours

---

## Phase 1: Backend Setup (API & Mock Data)

> **Duration**: ~2–3 hours
> **Prerequisite**: None
> **Output**: Functional API endpoint returning new response structure

### Task 1.1: Update Zod Schemas (`src/app/api/_schemas/member.schema.ts`)

**Objective**: Define Zod schemas for new data types (VisitRow extended, LessonReservationRow, MemberAccessSettings).

**Changes**:

1. Add `EntryMethodSchema = z.enum([...])` with values: `'qr_code'`, `'ic_card'`, `'face_recognition'`, `'member_card'`
2. Update existing `VisitRowSchema` to include:
   - `exit_time: z.string().nullable()` (NEW)
   - `stay_time: z.number().optional()` (NEW)
   - `entry_method: z.string()` (NEW)
3. Add new `LessonReservationRowSchema` with fields:
   - `id: z.string()`
   - `lesson_date: z.string()` (format YYYY-MM-DD)
   - `lesson_name: z.string()`
   - `instructor_name: z.string()`
   - `status: z.enum(['attended', 'absent', 'cancelled', 'reserved'])`
4. Add new `MemberAccessSettingsSchema` with fields:
   - `auth_method: z.string()`
   - `ic_card_number: z.string().nullable()`
   - `qr_code: z.string().nullable()`
   - `gate_stop: z.boolean()`
5. Update `GetUsageHistoryResponseSchema` to only include:
   - `visitRecords: z.array(VisitRowSchema)`
   - `lessonReservations: z.array(LessonReservationRowSchema)`
   - `memberAccessSettings: MemberAccessSettingsSchema`
   - _Remove_ `summary` and `storeUsage` fields
6. Export type aliases: `GetUsageHistoryResponse`, `VisitRow`, `LessonReservationRow`, `MemberAccessSettings`

**Acceptance Criteria**:

- ✅ All schemas compile without errors
- ✅ Type exports available for use in API route
- ✅ No `@ts-ignore` needed
- ✅ Zod validation will enforce nullable/optional fields correctly

**Files Changed**: 1 (edit)

---

### Task 1.2: Update Mock DB Seed Data (`src/app/api/_mock-db.ts`)

**Objective**: Populate mock database with extended visit records, lesson reservations, and access settings.

**Changes**:

1. **Update existing `visitRecords` array**:
   - For each existing record, add: `exit_time` (ISO8601 string or null), `stay_time` (number, minutes), `entry_method` (one of: 'qr_code', 'ic_card', 'face_recognition', 'member_card')
   - Example: `{ id: 'vr-001', entry_time: '2026-04-23T18:00:00Z', exit_time: '2026-04-23T19:30:00Z', stay_time: 90, store_id: 'store-001', store_name: 'JOYFIT渋谷店', entry_method: 'qr_code' }`
   - Ensure at least 2–3 records with `exit_time: null` (still in building)
   - Ensure varied entry_method values across records

2. **Add new array `MOCK_LESSON_RESERVATIONS`**:
   - 10 records total, distributed across statuses:
     - 3–4 with `status: 'attended'`
     - 1–2 with `status: 'absent'`
     - 1–2 with `status: 'cancelled'`
     - 3–4 with `status: 'reserved'`
   - Dates: Mix of past (March–April) and future (May) lesson dates
   - Lesson names: Variety (e.g., ボクシング基礎, ヨガ、パーソナルトレーニング)
   - Instructor names: Japanese names (e.g., 田中太郎、鈴木花子)

3. **Add new object `MOCK_MEMBER_ACCESS_SETTINGS`**:
   - One per member ID (or function to generate)
   - Example:
     ```typescript
     MOCK_MEMBER_ACCESS_SETTINGS = {
       'member-001': {
         auth_method: 'QRコード',
         ic_card_number: null,
         qr_code: 'QR123456789',
         gate_stop: false,
       },
       'member-002': {
         auth_method: 'ICカード',
         ic_card_number: 'IC-0002',
         qr_code: null,
         gate_stop: true, // Example: gate-stop is active
       },
     };
     ```

4. **Remove legacy seed data** (if any):
   - Delete `summary` object or array
   - Delete `storeUsage` array

**Acceptance Criteria**:

- ✅ Mock data compiles without errors
- ✅ At least 10 lesson reservation records with all 4 statuses represented
- ✅ Access settings available for all test members
- ✅ Visit records include mixed `exit_time` values (null and present)
- ✅ All `entry_method` values are valid enum members

**Files Changed**: 1 (edit)

---

### Task 1.3: Update API Route (`src/app/api/crm/members/[id]/usage-history/route.ts`)

**Objective**: Extend the GET route to handle new query parameters and return the simplified response.

**Changes**:

1. **Add query parameter handling**:
   - `store` (optional, default: `"all"`): Filter visitRecords by store_id
   - `period` (optional, default: `"this_month"`): Filter visitRecords by date range
     - Valid values: `"this_month"`, `"last_month"`, `"3months"`, `"6months"`
     - Implement as calendar-based filtering (e.g., this_month = [2026-04-01, 2026-04-30])

2. **Update response structure**:
   - Fetch from mock DB:
     - `visitRecords` filtered by `store` and `period`
     - `lessonReservations` (unfiltered, all records for member)
     - `memberAccessSettings` (for specific member)
   - Return shape: `{ visitRecords, lessonReservations, memberAccessSettings }`
   - _Remove_ any `summary` or `storeUsage` fields from response

3. **Add validation** (optional but recommended):
   - Validate `period` enum value
   - Validate `store` is either `"all"` or a valid store ID
   - On invalid value: either ignore and use default, or return 400 error (consistent with existing error handling)

4. **Update response type** to use new `GetUsageHistoryResponseSchema`

**Acceptance Criteria**:

- ✅ Route accepts `?store=store-001&period=this_month` query params
- ✅ Response matches `GetUsageHistoryResponse` Zod schema
- ✅ Filter logic: `store="all"` returns all records; `store="store-001"` filters correctly
- ✅ Filter logic: `period="this_month"` returns only April 2026 records
- ✅ Existing auth middleware still enforces member access control
- ✅ Test via curl: `GET /crm/members/member-001/usage-history?store=all&period=this_month`

**Files Changed**: 1 (edit)

---

### Task 1.4: Generate OpenAPI & React Query Types

**Objective**: Regenerate type definitions and React Query factories to reflect API changes.

**Changes**:

1. Run: `npm run generate-openapi`
   - Validates that route is properly registered in `_routes/index.ts`
   - Outputs: `src/lib/openapi.json` (updated)

2. Run: `npm run generate-api`
   - Generates: `src/lib/api/types.gen.ts` (updated)
   - Generates: `src/lib/api/@tanstack/react-query.gen.ts` (updated)
   - Includes new `getCrmMembersByIdUsageHistoryOptions` factory with extended response type

3. Verify:
   - No TypeScript errors in generated files
   - Types available for UI component imports

**Acceptance Criteria**:

- ✅ Both commands run without errors
- ✅ Generated files exist and are syntactically valid
- ✅ TypeScript compilation passes (`npm run type-check`)
- ✅ `GetUsageHistoryResponse` type is exported from generated types

**Files Changed**: 3 (regenerate)

---

## Phase 2: UI Components (Frontend)

> **Duration**: ~4–6 hours
> **Prerequisite**: Phase 1 complete (API types available)
> **Output**: All UI components rendering correctly with mock data

### Task 2.1: Create Helper Component — `auth-method-label.ts`

**Objective**: Utility function to map entry_method enum → Japanese label.

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/auth-method-label.ts

export function getAuthMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    qr_code: 'QRコード',
    ic_card: 'ICカード',
    face_recognition: '顔認証',
    member_card: '会員カード',
  };
  return labels[method] ?? method;
}
```

**Acceptance Criteria**:

- ✅ Function exports correctly
- ✅ All 4 entry_method values map to correct Japanese labels
- ✅ Unknown values return the input string
- ✅ No prop drilling needed; can be called from any component

**Files Changed**: 1 (new)

---

### Task 2.2: Create Badge Component — `lesson-status-badge.tsx`

**Objective**: Status badge component for lesson reservations (attended, absent, cancelled, reserved).

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/lesson-status-badge.tsx

import { Badge } from '@/components/ui/badge';

interface LessonStatusBadgeProps {
  status: 'attended' | 'absent' | 'cancelled' | 'reserved';
}

export function LessonStatusBadge({ status }: LessonStatusBadgeProps) {
  const config: Record<typeof status, { label: string; className: string }> = {
    attended: {
      label: '参加済み',
      className: 'bg-success/15 text-success border-success/20',
    },
    absent: {
      label: '欠席',
      className: 'bg-warning/15 text-warning border-warning/20',
    },
    cancelled: {
      label: 'キャンセル',
      className: 'bg-muted text-muted-foreground border-muted',
    },
    reserved: {
      label: '予約済み',
      className: 'bg-info/15 text-info border-info/20',
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>
      {label}
    </Badge>
  );
}
```

**Acceptance Criteria**:

- ✅ Component compiles without errors
- ✅ All 4 status types display correct Japanese label
- ✅ Styling follows shadcn/ui Badge pattern with color variants
- ✅ TypeScript enforces valid status enum values

**Files Changed**: 1 (new)

---

### Task 2.3: Update Table Columns (`columns.tsx`)

**Objective**: Define VisitRow table columns with new fields (entry_time, store_name, type badge, auth_method).

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/columns.tsx

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { VisitRow } from '@/lib/api/types.gen';
import { getAuthMethodLabel } from './auth-method-label';

export const VISIT_COLUMNS: ColumnDef<VisitRow>[] = [
  {
    accessorKey: 'entry_time',
    header: '日時',
    size: 200,
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
              : 'text-muted-foreground border-muted'
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

**Acceptance Criteria**:

- ✅ All 4 columns render correctly
- ✅ DateTime formatting works (e.g., "2026/04/23 18:00")
- ✅ Type badge shows 入館 (LogIn icon) or 退館 (LogOut icon) based on exit_time
- ✅ Auth method displays correctly using `getAuthMethodLabel()`
- ✅ Columns integrate with TanStack React Table

**Files Changed**: 1 (edit)

---

### Task 2.4: Create Entry/Exit Table (`entry-exit-table.tsx`)

**Objective**: Table component with filters (store, period) and pagination.

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/entry-exit-table.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { VisitRow } from '@/lib/api/types.gen';
import { VISIT_COLUMNS } from './columns';

interface EntryExitTableProps {
  records: VisitRow[];
  page: number;
  onPageChange: (page: number) => void;
  storeFilter: string;
  periodFilter: string;
  onStoreFilterChange: (value: string) => void;
  onPeriodFilterChange: (value: string) => void;
  stores: Array<{ id: string; name: string }>;
}

const ROWS_PER_PAGE = 50;
const PERIOD_OPTIONS = [
  { value: 'this_month', label: '今月' },
  { value: 'last_month', label: '先月' },
  { value: '3months', label: '過去3ヶ月' },
  { value: '6months', label: '過去6ヶ月' },
];

export function EntryExitTable({
  records,
  page,
  onPageChange,
  storeFilter,
  periodFilter,
  onStoreFilterChange,
  onPeriodFilterChange,
  stores,
}: EntryExitTableProps) {
  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const pageRecords = records.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>入退館履歴</CardTitle>
        <div className="flex gap-3">
          <Select value={storeFilter} onValueChange={onStoreFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全店舗</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={onPeriodFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {records.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            該当の入退館履歴がありません。
          </div>
        ) : (
          <>
            <DataTable columns={VISIT_COLUMNS} data={pageRecords} />
            {totalPages > 1 && (
              <TablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria**:

- ✅ Component renders with 2 filter controls (store, period)
- ✅ Filter dropdowns populate with store list and period options
- ✅ Table displays paginated records (50 per page)
- ✅ Pagination controls show/hide based on total records
- ✅ Empty state displays "該当の入退館履歴がありません。"
- ✅ Filter changes trigger parent callback (`onStoreFilterChange`, `onPeriodFilterChange`)

**Files Changed**: 1 (new)

---

### Task 2.5: Create Lesson Table (`lesson-table.tsx`)

**Objective**: Table component for lesson reservations (no filters, no pagination).

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/lesson-table.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { LessonReservationRow } from '@/lib/api/types.gen';
import { LessonStatusBadge } from './lesson-status-badge';

interface LessonTableProps {
  reservations: LessonReservationRow[];
}

export function LessonTable({ reservations }: LessonTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>レッスン予約履歴</CardTitle>
      </CardHeader>

      <CardContent>
        {reservations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            レッスン予約履歴がありません。
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>レッスン名</TableHead>
                <TableHead>担当</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm">
                    {format(parseISO(row.lesson_date), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell className="text-sm">{row.lesson_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.instructor_name}
                  </TableCell>
                  <TableCell>
                    <LessonStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria**:

- ✅ Component renders all lesson records
- ✅ Date formatting works (e.g., "2026/04/23")
- ✅ Status badges display with correct colors
- ✅ Empty state shows "レッスン予約履歴がありません。"
- ✅ No filters or pagination needed

**Files Changed**: 1 (new)

---

### Task 2.6: Create Access Settings Card (`access-settings-card.tsx`)

**Objective**: Sticky card displaying member access settings with optional gate-stop release button.

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/access-settings-card.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberAccessSettings } from '@/lib/api/types.gen';
import { getAuthMethodLabel } from './auth-method-label';

interface AccessSettingsCardProps {
  settings: MemberAccessSettings;
  onGateStopRelease?: () => void;
}

export function AccessSettingsCard({ settings, onGateStopRelease }: AccessSettingsCardProps) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>入退館設定</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium">認証方法</span>
          <span className="text-sm text-muted-foreground">
            {getAuthMethodLabel(settings.auth_method)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium">ICカード番号</span>
          <span className="font-mono text-sm text-muted-foreground">
            {settings.ic_card_number ?? '—'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm font-medium">QRコード</span>
          <span className="font-mono text-sm text-muted-foreground">
            {settings.qr_code ?? '—'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">ゲートストップ</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${settings.gate_stop ? 'text-warning' : 'text-muted-foreground'}`}>
              {settings.gate_stop ? '設定中' : '設定なし'}
            </span>
            {settings.gate_stop && onGateStopRelease && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGateStopRelease}
              >
                解除
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria**:

- ✅ Component renders all 4 settings rows
- ✅ Auth method displays correctly
- ✅ Nullable fields (ic_card_number, qr_code) show "—" when null
- ✅ Gate-stop shows "設定中" when true, "設定なし" when false
- ✅ Release button appears only when gate_stop=true AND onGateStopRelease is defined
- ✅ Card has `sticky top-6` positioning for right-column stickiness

**Files Changed**: 1 (new)

---

### Task 2.7: Rewrite UsageHistoryTab (`index.tsx`)

**Objective**: Main tab component with 2-column layout, state management, and React Query integration.

**Implementation**:

```typescript
// src/app/(private)/members/[id]/_components/tabs/usage-history-tab/index.tsx

'use client';

import { useState, useMemo } from 'react';
import { getCrmMembersByIdUsageHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { EntryExitTable } from './entry-exit-table';
import { LessonTable } from './lesson-table';
import { AccessSettingsCard } from './access-settings-card';

interface UsageHistoryTabProps {
  memberId: string;
  onGateStopAction?: () => void;
}

export function UsageHistoryTab({ memberId, onGateStopAction }: UsageHistoryTabProps) {
  const [storeFilter, setStoreFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('this_month');
  const [entryExitPage, setEntryExitPage] = useState(1);

  const { data } = useSuspenseQuery(
    getCrmMembersByIdUsageHistoryOptions({
      path: { id: memberId },
      query: { store: storeFilter, period: periodFilter },
    })
  );

  // Extract unique stores from visitRecords for filter dropdown
  const stores = useMemo(() => {
    const storeSet = new Map<string, string>();
    data.visitRecords.forEach((record) => {
      storeSet.set(record.store_id, record.store_name);
    });
    return Array.from(storeSet, ([id, name]) => ({ id, name }));
  }, [data.visitRecords]);

  return (
    <DataStateBoundary>
      <div className="flex gap-4">
        {/* Left Column: Entry/Exit & Lesson Tables */}
        <div className="flex w-[60%] flex-col gap-4">
          <EntryExitTable
            records={data.visitRecords}
            page={entryExitPage}
            onPageChange={setEntryExitPage}
            storeFilter={storeFilter}
            periodFilter={periodFilter}
            onStoreFilterChange={(store) => {
              setStoreFilter(store);
              setEntryExitPage(1); // Reset to page 1 on filter change
            }}
            onPeriodFilterChange={(period) => {
              setPeriodFilter(period);
              setEntryExitPage(1); // Reset to page 1 on filter change
            }}
            stores={stores}
          />

          <LessonTable reservations={data.lessonReservations} />
        </div>

        {/* Right Column: Access Settings Card */}
        <div className="w-[40%]">
          <AccessSettingsCard
            settings={data.memberAccessSettings}
            onGateStopRelease={onGateStopAction}
          />
        </div>
      </div>
    </DataStateBoundary>
  );
}
```

**Acceptance Criteria**:

- ✅ Component uses `useSuspenseQuery` to fetch usage history data
- ✅ 2-column layout (60/40) renders correctly
- ✅ Filter state managed locally (store, period)
- ✅ Pagination state managed separately for entry/exit table
- ✅ Unique stores extracted from visitRecords for dropdown
- ✅ Filter changes reset pagination to page 1
- ✅ All subcomponents receive correct props
- ✅ DataStateBoundary wraps content (handles loading/error)

**Files Changed**: 1 (edit)

---

### Task 2.8: Update Parent Page Integration (`page.tsx`)

**Objective**: Pass `onGateStopAction` callback to UsageHistoryTab component.

**Changes**:

1. Locate the `<TabsContent value="usage">` section in `src/app/(private)/members/[id]/page.tsx`
2. Update to pass `onGateStopAction` prop:
   ```tsx
   <TabsContent value="usage">
     <UsageHistoryTab
       memberId={memberId}
       onGateStopAction={() => setShowGateStopReleaseSheet(true)}
     />
   </TabsContent>
   ```
3. Verify existing gate-stop handler exists (should already be defined in parent)

**Acceptance Criteria**:

- ✅ Page compiles without errors
- ✅ `onGateStopAction` callback is accessible from parent state
- ✅ UsageHistoryTab props match interface

**Files Changed**: 1 (edit, minimal)

---

## Phase 3: Validation & Testing

> **Duration**: ~1–2 hours
> **Prerequisite**: Phases 1 & 2 complete
> **Output**: Feature works end-to-end with all acceptance criteria passing

### Task 3.1: Manual Testing Checklist

**Objective**: Verify all functionality works correctly.

**Test Cases**:

1. **Page Load**:
   - ✅ Navigate to member detail page → click "利用履歴" tab
   - ✅ Tab loads without errors
   - ✅ Layout displays 60/40 columns correctly
   - ✅ All three sections visible (entry/exit table, lesson table, access settings card)

2. **Entry/Exit Table**:
   - ✅ Table displays all records for default period (this_month)
   - ✅ Store filter dropdown contains "全店舗" and all available stores
   - ✅ Period filter dropdown contains 4 options (今月, 先月, 過去3ヶ月, 過去6ヶ月)
   - ✅ Filtering by store reduces records to matching store_id only
   - ✅ Filtering by period changes date range in response
   - ✅ Pagination shows when >50 records, hides when ≤50
   - ✅ 入館 badge appears for records with exit_time=null (with LogIn icon)
   - ✅ 退館 badge appears for records with exit_time≠null (with LogOut icon)
   - ✅ Auth method displays correctly (QRコード, ICカード, etc.)
   - ✅ Empty state message shows when no records match filters

3. **Lesson Table**:
   - ✅ Table displays all lesson records
   - ✅ Date formatted as YYYY/MM/DD (e.g., 2026/04/23)
   - ✅ Status badges display with correct colors:
     - 参加済み = success/green
     - 欠席 = warning/yellow
     - キャンセル = muted/gray
     - 予約済み = info/blue
   - ✅ Empty state message shows when no lessons

4. **Access Settings Card**:
   - ✅ Card sticky positioned on right column
   - ✅ All 4 rows display: 認証方法, ICカード番号, QRコード, ゲートストップ
   - ✅ Auth method displays Japanese label
   - ✅ Nullable fields show "—" when null
   - ✅ Gate-stop shows "設定中" when true, "設定なし" when false
   - ✅ Release button appears only when gate_stop=true
   - ✅ Release button calls `onGateStopAction` callback

5. **Responsive Behavior**:
   - ✅ Sticky right card stays visible while scrolling left column
   - ✅ Layout maintains 60/40 split on various screen sizes
   - ✅ Tables scroll horizontally on small screens

6. **Error Handling**:
   - ✅ DataStateBoundary shows error state on query failure
   - ✅ Filter validation: invalid period values handled gracefully

**Files Affected**: All files from Phases 1 & 2

---

### Task 3.2: TypeScript Type Checking

**Objective**: Ensure no TypeScript errors in any component.

**Commands**:

```bash
npm run type-check
```

**Acceptance Criteria**:

- ✅ No TypeScript errors reported
- ✅ All imports resolve correctly
- ✅ Generated types from `@/lib/api/types.gen.ts` are available
- ✅ React Query types match component usage

**Files Affected**: All TypeScript files

---

### Task 3.3: ESLint & Prettier Linting

**Objective**: Ensure code style compliance.

**Commands**:

```bash
npm run lint
```

**Acceptance Criteria**:

- ✅ No ESLint errors
- ✅ No Prettier formatting violations
- ✅ Code follows project style guide (100-char line width, etc.)

**Files Affected**: All modified files

---

## Summary

### File Changes

| File                                                                                         | Phase | Action     | Lines Affected                            |
| -------------------------------------------------------------------------------------------- | ----- | ---------- | ----------------------------------------- |
| `src/app/api/_schemas/member.schema.ts`                                                      | 1.1   | Edit       | Add 5 schemas, remove 2 legacy fields     |
| `src/app/api/_mock-db.ts`                                                                    | 1.2   | Edit       | Update visitRecords, add 2 new arrays     |
| `src/app/api/crm/members/[id]/usage-history/route.ts`                                        | 1.3   | Edit       | Add query param handling, update response |
| `src/lib/openapi.json`                                                                       | 1.4   | Regenerate | Auto-generated                            |
| `src/lib/api/types.gen.ts`                                                                   | 1.4   | Regenerate | Auto-generated                            |
| `src/lib/api/@tanstack/react-query.gen.ts`                                                   | 1.4   | Regenerate | Auto-generated                            |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/auth-method-label.ts`     | 2.1   | New        | ~15 lines                                 |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/lesson-status-badge.tsx`  | 2.2   | New        | ~35 lines                                 |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/columns.tsx`              | 2.3   | Edit       | Update VISIT_COLUMNS                      |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/entry-exit-table.tsx`     | 2.4   | New        | ~90 lines                                 |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/lesson-table.tsx`         | 2.5   | New        | ~65 lines                                 |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/access-settings-card.tsx` | 2.6   | New        | ~60 lines                                 |
| `src/app/(private)/members/[id]/_components/tabs/usage-history-tab/index.tsx`                | 2.7   | Edit       | Rewrite main layout (~100 lines)          |
| `src/app/(private)/members/[id]/page.tsx`                                                    | 2.8   | Edit       | Minor: add onGateStopAction prop          |

**Total**: 14 tasks, 12 files modified, ~6 new components

---

## Deployment Checklist

Before merging to `main`:

- [ ] All 14 tasks completed
- [ ] Phase 3 testing passed (manual checklist)
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] ESLint & Prettier pass (`npm run lint`)
- [ ] API responds with correct structure on test member
- [ ] Feature branch: `feat/member-detail-usage-history`
- [ ] PR description includes spec, plan, and tasks links
- [ ] Code review approved
- [ ] Merge to main

---

## Handoff

> Tasks complete. All 14 actionable items defined with clear dependencies and acceptance criteria.
>
> **Next Step**: When ready to begin implementation, trigger:
>
> **"Follow instructions in speckit.implement.prompt.md"**
>
> (Or, if specific guidance needed on any task, request clarification before proceeding.)
