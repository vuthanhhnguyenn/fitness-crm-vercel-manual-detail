# Quickstart: D-03 Studio Management — FR-001 Studio List Display

**Goal**: 5-minute setup guide for Phase 1 implementation.

---

## Phase 1 Deliverables Checklist

- [ ] Create Zod schemas: `src/app/api/_schemas/studio.schema.ts`
- [ ] Add mock data to `src/app/api/_mock-db.ts`
- [ ] Create mock route: `src/app/api/crm/studios/route.ts`
- [ ] Create page: `src/app/crm/studios/page.tsx`
- [ ] Create table component: `src/components/crm/studio-list/studio-list-table.tsx`
- [ ] Create filter panel: `src/components/crm/studio-list/studio-list-filters.tsx`
- [ ] Create search input: `src/components/crm/studio-list/studio-search.tsx`
- [ ] Create empty state: `src/components/crm/studio-list/empty-state.tsx`
- [ ] Create action buttons: `src/components/crm/studio-list/studio-actions.tsx`
- [ ] Implement `useStudioList` hook
- [ ] Add role-based permission checks: `src/lib/utils/studio-permissions.ts`
- [ ] Write unit tests for all components
- [ ] Write acceptance tests for 5 user stories

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── crm/studios/
│   │   │   └── route.ts              # Mock GET endpoint
│   │   ├── _schemas/
│   │   │   └── studio.schema.ts      # ✨ NEW
│   │   └── _mock-db.ts               # Add studio mock data
│   ├── crm/studios/
│   │   └── page.tsx                  # ✨ NEW Page component
│   └── ...
├── components/crm/studio-list/       # ✨ NEW Feature folder
│   ├── studio-list-table.tsx
│   ├── studio-search.tsx
│   ├── studio-list-filters.tsx
│   ├── studio-actions.tsx
│   └── empty-state.tsx
├── hooks/
│   └── useStudioList.ts              # ✨ NEW (state management via nuqs)
├── lib/
│   └── utils/
│       └── studio-permissions.ts     # ✨ NEW (role checks)
└── ...
```

---

## Step 1: Create Zod Schemas

**File**: `src/app/api/_schemas/studio.schema.ts`

```typescript
import { z } from 'zod';

export const StudioTypeSchema = z
  .enum(['studio-lesson', 'pt', 'body-care'])
  .openapi({ example: 'studio-lesson' });

export const BrandSchema = z
  .enum(['JOYFIT', 'JOYFIT24', 'JOYFIT_YOGA', 'JOYFIT_PLUS', 'FIT365'])
  .openapi({ example: 'JOYFIT' });

export const StudioStatusSchema = z.enum(['active', 'inactive']).openapi({ example: 'active' });

export const StudioListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  store_id: z.string().uuid(),
  store_name: z.string(),
  studio_type: StudioTypeSchema,
  capacity: z.number().int().min(1).max(1000),
  available_hours: z.string(),
  brand: BrandSchema,
  status: StudioStatusSchema,
});

export const StudioListResponseSchema = z.object({
  items: z.array(StudioListItemSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int(),
  has_next: z.boolean(),
});

export const GetStudiosQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z
    .number()
    .int()
    .refine((v) => [25, 50, 100, 200].includes(v), 'Must be 25, 50, 100, or 200')
    .default(50),
  search: z.string().optional(),
  store_id: z.string().uuid().optional(),
  studio_type: StudioTypeSchema.optional(),
  brand: BrandSchema.optional(),
  status: StudioStatusSchema.optional(),
  sort_by: z.enum(['id', 'name', 'store_name', 'studio_type', 'capacity']).default('id'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export type StudioListItem = z.infer<typeof StudioListItemSchema>;
export type StudioListResponse = z.infer<typeof StudioListResponseSchema>;
export type GetStudiosQuery = z.infer<typeof GetStudiosQuerySchema>;
```

---

## Step 2: Add Mock Data

**File**: `src/app/api/_mock-db.ts`

Add to the mock DB:

```typescript
// Add studios data structure
const mockStudios: Studio[] = [
  // Shibuya store (JOYFIT)
  {
    id: 'studio-001',
    name: 'スタジオA',
    store_id: 'store-001',
    store_name: '渋谷店',
    studio_type: 'studio-lesson',
    capacity: 30,
    available_hours: '10:00–21:00',
    brand: 'JOYFIT',
    status: 'active',
    remarks: 'Main lesson studio',
    equipment_notes: 'Audio system upgraded 2024',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  // ... more studios (≥ 9 total, covering all types/brands/statuses)
];

// Add retrieval method
export const db = {
  // ... existing methods
  studios: {
    list: (
      query: GetStudiosQuery,
      userRole: StaffRole,
      userStoreIds: string[],
    ): StudioListResponse => {
      // Apply role-based scoping
      let filtered = mockStudios.filter((s) =>
        userRole === 'system' || userRole === 'headquarter'
          ? true
          : userStoreIds.includes(s.store_id),
      );

      // Apply search
      if (query.search) {
        const search = query.search.toLowerCase();
        filtered = filtered.filter((s) => s.name.toLowerCase().includes(search));
      }

      // Apply filters
      if (query.store_id) filtered = filtered.filter((s) => s.store_id === query.store_id);
      if (query.studio_type) filtered = filtered.filter((s) => s.studio_type === query.studio_type);
      if (query.brand) filtered = filtered.filter((s) => s.brand === query.brand);
      if (query.status) filtered = filtered.filter((s) => s.status === query.status);

      // Apply sort
      const sorted = filtered.sort((a, b) => {
        const field = query.sort_by as keyof Studio;
        const aVal = a[field];
        const bVal = b[field];
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return query.sort_order === 'asc' ? cmp : -cmp;
      });

      // Apply pagination
      const start = (query.page - 1) * query.limit;
      const items = sorted.slice(start, start + query.limit);

      return {
        items: items.map((s) => ({
          id: s.id,
          name: s.name,
          store_id: s.store_id,
          store_name: s.store_name,
          studio_type: s.studio_type,
          capacity: s.capacity,
          available_hours: s.available_hours,
          brand: s.brand,
          status: s.status,
        })),
        total: filtered.length,
        page: query.page,
        limit: query.limit,
        has_next: query.page * query.limit < filtered.length,
      };
    },
  },
};
```

---

## Step 3: Create Mock Route

**File**: `src/app/api/crm/studios/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';

import { db } from '../_mock-db';
import { GetStudiosQuerySchema } from '../_schemas/studio.schema';

// Your auth helper

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const query = GetStudiosQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      store_id: searchParams.get('store_id'),
      studio_type: searchParams.get('studio_type'),
      brand: searchParams.get('brand'),
      status: searchParams.get('status'),
      sort_by: searchParams.get('sort_by'),
      sort_order: searchParams.get('sort_order'),
    });

    const response = db.studios.list(query, user.role, user.store_ids);
    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/crm/studios error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Step 4: Create Page Component

**File**: `src/app/crm/studios/page.tsx`

```typescript
'use client';

import { VisitExperienceListSection } from './_components/studio-list-section';

export default function StudiosPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">スタジオ管理</h1>
        <button className="px-4 py-2 bg-primary text-white rounded">+ 新規登録</button>
      </div>
      <StudioListSection />
    </div>
  );
}
```

---

## Step 5: Create Table Component

**File**: `src/components/crm/studio-list/studio-list-table.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { StudioListItem } from '@/app/api/_schemas/studio.schema';

export interface StudioListTableProps {
  items: StudioListItem[];
  isLoading: boolean;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function StudioListTable({
  items,
  isLoading,
  onSort,
  sortBy,
  sortOrder,
}: StudioListTableProps) {
  const sortableColumns = ['id', 'name', 'store_name', 'studio_type', 'capacity'];

  const renderHeader = (label: string, field: string) => {
    const isSortable = sortableColumns.includes(field);
    return (
      <TableHead
        className={isSortable ? 'cursor-pointer' : ''}
        onClick={() => isSortable && onSort(field)}
      >
        {label}
        {isSortable && sortBy === field && (
          <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </TableHead>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {renderHeader('スタジオID', 'id')}
          {renderHeader('スタジオ名', 'name')}
          {renderHeader('店舗', 'store_name')}
          {renderHeader('タイプ', 'studio_type')}
          {renderHeader('定員', 'capacity')}
          <TableHead>利用時間</TableHead>
          <TableHead>ブランド</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>アクション</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((studio) => (
          <TableRow key={studio.id}>
            <TableCell>{studio.id}</TableCell>
            <TableCell>{studio.name}</TableCell>
            <TableCell>{studio.store_name}</TableCell>
            <TableCell>{studio.studio_type}</TableCell>
            <TableCell>{studio.capacity}</TableCell>
            <TableCell>{studio.available_hours}</TableCell>
            <TableCell>{studio.brand}</TableCell>
            <TableCell>
              <Badge variant={studio.status === 'active' ? 'default' : 'secondary'}>
                {studio.status === 'active' ? '有効' : '無効'}
              </Badge>
            </TableCell>
            <TableCell>{/* Actions */}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Step 6: State Management via `nuqs`

**File**: `src/hooks/useStudioList.ts`

```typescript
'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export function useStudioList() {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    store_id: parseAsString.withDefault(''),
    studio_type: parseAsString.withDefault(''),
    brand: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    sort_by: parseAsString.withDefault('id'),
    sort_order: parseAsString.withDefault('asc'),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
  });
}
```

---

## Step 7: Permission Checks

**File**: `src/lib/utils/studio-permissions.ts`

```typescript
import { StaffRole } from '@/types/auth';

// Your auth type

export const STUDIO_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
};

export function canPerformAction(role: StaffRole, action: string): boolean {
  const permissions: Record<StaffRole, string[]> = {
    system: ['view', 'edit', 'delete'],
    headquarter: ['view', 'edit', 'delete'],
    manager: ['view', 'edit', 'delete'],
    staff: ['view', 'edit'],
    trainer: ['view'],
    observer: ['view'],
  };

  return permissions[role]?.includes(action) ?? false;
}
```

---

## Testing Acceptance Scenarios

**Test framework**: Vitest + React Testing Library (or Playwright for E2E)

**Key tests**:

1. **User Story 1**: Authorized user browses the studio list
   - Test: `test('displays all studios for Headquarter role')`

2. **User Story 2**: User searches by name
   - Test: `test('filters studios by name search')`

3. **User Story 3**: User filters the studio list
   - Test: `test('applies multiple filters with AND logic')`

4. **User Story 4**: User sorts the studio list
   - Test: `test('sorts by each sortable column')`

5. **User Story 5**: Authorized roles see contextual action buttons
   - Test: `test('shows edit/delete buttons only for authorized roles')`

---

## Next Steps

After Phase 1 is complete and accepted:

1. Wait for DEV-BE to publish studio OpenAPI spec
2. Run `npm run generate-api` to regenerate `src/lib/api/`
3. Replace mock routes with generated client hooks (minimal client changes)
4. Proceed to Phase 2: Real API integration
