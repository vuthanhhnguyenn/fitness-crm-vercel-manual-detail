# Tasks: Staff List — Y-01 スタッフ・権限管理 (`001-staff-list`)

**Input**: `specs/staff-management/` — plan.md, spec.md, data-model.md, contracts/api-contracts.md, research.md, quickstart.md  
**Date**: 2026-04-08

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no cross-task dependency)
- **[Story]**: User story this task belongs to — [US1]…[US6]
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create types, schemas, and mock DB — the data layer everything depends on. No UI work yet.

- [x] T001 Create `src/types/staff.type.ts` — define `StaffRole` enum (6 values), `StaffStatus` enum, `StaffBrand` type, `SubBrand` type, `StaffListItem` interface, `StaffPosition` interface, `Branch` interface, `StaffInvitationEntry` interface (see `data-model.md` §1)
- [x] T002 Create `src/app/api/_schemas/staff.schema.ts` — define `StaffRoleSchema`, `StaffStatusSchema`, `StaffBrandSchema`, `SubBrandSchema`, `StaffListItemSchema`, `GetStaffQuerySchema`, `GetStaffResponseSchema`, `PaginationSchema`, `GetPositionsResponseSchema`, `DeleteStaffBodySchema`, `DeleteStaffResponseSchema`, `InviteStaffBodySchema`, `InviteStaffResponseSchema`, `StaffErrorResponseSchema` (all with `.openapi({example})` annotations)
- [x] T003 Extend `src/app/api/_mock-db.ts` — add `MOCK_BRANCHES` (2 entries), `MOCK_POSITIONS` (11 entries), `MOCK_STAFF` (8 records STF-001…STF-008) seed arrays and expose via `db.branches`, `db.positions`, `db.staff` accessor objects with `getList()`, `getById()`, `delete()` methods (see `data-model.md` §3)

**Checkpoint**: Run `npm run type-check` — no errors. Types and schemas are the single source of truth from this point.

---

## Phase 2: Foundational (API Routes + Client Codegen)

**Purpose**: All four API routes must exist and be registered before `npm run generate-api` can generate the client. Nothing on the frontend can proceed without the generated option-factories.

**⚠️ CRITICAL**: Phases 3–8 all depend on `T007` (regenerated client) completing first.

- [x] T004 Create `src/app/api/crm/staff/route.ts` — `GET /crm/staff`: register OpenAPI route via `registerRoute(...)`, validate query with `GetStaffQuerySchema.safeParse`, apply role-scoped filtering (HQ = all; Manager = `branch_id → store_ids[]` IN filter), apply free-text search on `name_kanji`/`name_kana`/`email`, apply `position_id`, `brand`, `sub_brand`, `status` filters, apply `sort_by`/`sort_order` (default `staff_id asc`), paginate with `page`/`limit`, return `GetStaffResponseSchema` envelope (see `contracts/api-contracts.md`)
- [x] T005 [P] Create `src/app/api/crm/staff/positions/route.ts` — `GET /crm/staff/positions`: register OpenAPI route, return `{ positions: MOCK_POSITIONS }` as `GetPositionsResponseSchema` (see `contracts/api-contracts.md`)
- [x] T006 [P] Create `src/app/api/crm/staff/[id]/route.ts` — `DELETE /crm/staff/[id]`: register OpenAPI route, validate `DeleteStaffBodySchema`, check role (403 for non-HQ), find staff by `id` (404 if missing), call `db.staff.delete(id, reason)`, return `DeleteStaffResponseSchema`; also create `src/app/api/crm/staff/invitations/route.ts` — `POST /crm/staff/invitations`: register OpenAPI route, validate `InviteStaffBodySchema` (400 if empty array), mock email-send per entry, return `InviteStaffResponseSchema` with per-entry status (see `contracts/api-contracts.md`)
- [x] T007 Run `npm run generate-openapi` then `npm run generate-api` to regenerate `src/lib/api/types.gen.ts` and `src/lib/api/@tanstack/react-query.gen.ts` — verify `getCrmStaffOptions`, `getCrmStaffPositionsOptions`, `deleteCrmStaffByIdMutation`, `postCrmStaffInvitationsMutation` option-factories are present in the generated output

**Checkpoint**: `GET http://localhost:3000/api/crm/staff` returns 8 staff records. `npm run type-check` passes.

---

## Phase 3: User Story 1 — Basic Staff List Display (Priority: P1) 🎯 MVP

**Goal**: Render a `<DataTable>` at `/settings/staff` with 8 columns, role-scoped rows, and `ステータス` badges. This is the minimum viable screen.

**Independent Test**: Navigate to `http://localhost:3000/settings/staff` as HQ user → table renders 8 rows (STF-001…STF-008) with correct columns; `有効` badge is green, `無効` is muted; footer reads "全 8 件中 1–8 件を表示".

### Contract Tests for US1

- [ ] T008 [P] [US1] Create contract test file — `GET /crm/staff` happy path (HQ, no filters → 200 + `GetStaffResponseSchema` valid), zero results (aggressive filter → 200 + empty `staff[]`, `total=0`), invalid `sort_by` (→ 400 + error schema) — place in project's test directory following existing test patterns

### Implementation for US1

- [x] T009 [US1] Create `src/app/(private)/settings/layout.tsx` — minimal pass-through layout (`export default function SettingsLayout({ children }) { return <>{children}</> }`) so the `/settings` route segment is valid
- [x] T010 [P] [US1] Create `src/app/(private)/settings/staff/_contexts/staff-filters-context.tsx` — React context that exposes `useStaffFiltersContext()` returning the `useStaffFilters` hook return value; provider wraps the page (mirror `src/app/(private)/members/_contexts/members-filters-context.tsx`)
- [x] T011 [P] [US1] Create `src/app/(private)/settings/staff/_hooks/use-staff-filters.ts` — `useStaffFilters()` hook using `useQueryStates` from `nuqs` for params: `q` (string, default `''`), `position_id` (string, default `''`), `brand` (stringEnum `['joyfit','fit365']`, nullable), `sub_brand` (stringEnum `['joyfit_plus','joyfit_yoga','joyfit24']`, nullable), `status` (stringEnum `['active','inactive']`, nullable), `sort_by` (string, default `'staff_id'`), `sort_order` (stringEnum `['asc','desc']`, default `'asc'`), `page` (integer, default `1`); expose `filters`, `setFilters`, `queryParams`, `clearFilters()`, `searchInput`, `setSearchInput` (mirror `use-members-filters.ts` — 300 ms debounce on `q` only)
- [x] T012 [US1] Create `src/app/(private)/settings/staff/_components/staff-table-columns.tsx` — export `staffTableColumns(onDelete, role)` returning `ColumnDef<StaffListItem>[]` for the 8 columns: `staff_id` (monospace, sortable), `name_kanji` (`<TextWithTooltip>`, sortable), `email` (`<TextWithTooltip>`, not sortable), `position_name` (plain text, sortable), `brand` (display "全ブランド" when `null`, not sortable), `status` (`<Badge variant="success">有効` / `<Badge variant="secondary">無効`, sortable), `last_login_at` (`format(parseISO(val), 'yyyy-MM-dd HH:mm', { timeZone: 'Asia/Tokyo' })` via `date-fns`, "—" when null, sortable), `_actions` (`<DropdownMenu>` — stub for now, to be filled in US5); all sortable columns use `<DataTableColumnHeader>`
- [x] T013 [US1] Create `src/app/(private)/settings/staff/page.tsx` — `'use client'`; wrap with `<StaffFiltersProvider>`; call `useQuery(getStaffOptions({ query: { page, limit: 50, ...queryParams } }))` inside `StaffPageContent`; derive `sorting: SortingState` from `filters.sort_by/sort_order`; render `<BreadcrumbNav items={[{ url: '/settings', label: 'システム設定' }, { label: 'スタッフ・権限管理' }]}>`; render page title row ("スタッフ管理" + total count badge + `スタッフを招待` button stub for HQ); render `<DataTable columns={staffTableColumns(...)} data={staff} ...>`; render `<Pagination>` wired to `page` nuqs param; handle loading/error states with `<DataStateBoundary>`; render `<Empty>` for zero results

**Checkpoint**: `/settings/staff` renders the full table with correct data, badges, and column headers. Pagination footer shows "全 8 件中 1–8 件を表示". `npm run type-check` passes. Contract test T008 passes.

---

## Phase 4: User Story 2 — Quick Search (Priority: P2)

**Goal**: Free-text search on name/email with 300 ms debounce, URL-persisted via nuqs `q` param.

**Independent Test**: Type "佐藤" → after 300 ms, table shows only rows matching; clear input → full list returns; URL shows `?q=佐藤`.

### Implementation for US2

- [x] T014 [US2] Create `src/app/(private)/settings/staff/_components/staff-filters.tsx` (initial version) — render Filter Bar Row 1 only: `<Input placeholder="名前・メールアドレスで検索...">` wired to `searchInput`/`setSearchInput` from context; `<Button>詳細フィルター ▾</Button>` toggle (open/close state as `useState<boolean>(false)` — local, NOT nuqs); active-filter count badge beside toggle label (count non-null values of `position_id`, `brand`, `sub_brand`, `status`); Filter Bar Row 2 collapsed for now (placeholder `null`); consume via `useStaffFiltersContext()`
- [x] T015 [US2] Wire `staff-filters.tsx` into `page.tsx` — replace the inline filter stub added in T013 with `<StaffFilters />`; confirm debounce fires after 300 ms and URL updates with `?q=...`

**Checkpoint**: Search works end-to-end. Debounce fires at 300 ms. Clearing input restores full list. URL param `q` is set/cleared correctly.

---

## Phase 5: User Story 3 — Advanced Filter Panel (Priority: P2)

**Goal**: Collapsible 詳細フィルター panel with 職位/ブランド/ステータス selects, すべてクリア, URL persistence.

**Independent Test**: Click `詳細フィルター ▾` → panel expands, label changes to `閉じる ▴`; set ステータス = `無効` → table shows only inactive rows, URL has `?status=inactive`; click `すべてクリア` → filters reset, full list returns, `q` untouched.

### Contract Test for US3

- [ ] T016 [P] [US3] Add to contract test file — `GET /crm/staff/positions` happy path (→ 200 + 11-item `GetPositionsResponseSchema`)

### Implementation for US3

- [x] T017 [US3] Extend `staff-filters.tsx` — add Filter Bar Row 2 (visible when `isPanelOpen`): `<Select>` for 職位 (options from `useQuery(getStaffPositionsOptions(), { enabled: isPanelOpen })` — lazy fetch, shared React Query cache); `<Select>` for ブランド (static 5-option list: JOYFIT, JOYFIT+, JOYFIT YOGA, JOYFIT24, FIT365 — maps to `brand`+`sub_brand` nuqs params per spec `data-model.md` §ブランドフィルター); `<Select>` for ステータス (static: 有効/無効); `<Button variant="ghost">すべてクリア</Button>` (calls `clearFilters()` for the 3 filter selects only, NOT `q`); active-filter indicator badge on toggle button updates as filters change

**Checkpoint**: All 3 selects work. Filter panel collapses/expands correctly. すべてクリア resets only the 3 selects. Active-filter badge shows correct count. Collapse with active filters preserves filter values. Hard reload restores filter values from URL but panel is collapsed.

---

## Phase 6: User Story 4 — Column Sorting (Priority: P3)

**Goal**: Server-side sort on 5 columns via `sort_by`/`sort_order` URL params; default `staff_id asc` shown on initial load.

**Independent Test**: Initial load → `スタッフID` header shows active ascending indicator (STF-001 first); click `最終ログイン` header → rows reorder; click again → reverses; refresh → sort state preserved via URL.

### Implementation for US4

- [x] T018 [US4] Update `staff-table-columns.tsx` — add `enableSorting: true` on the 5 sortable columns (`staff_id`, `name_kanji`, `position_name`, `status`, `last_login_at`) using `<DataTableColumnHeader>`; ensure `enableSorting: false` on `email`, `brand`, `_actions`
- [x] T019 [US4] Update `page.tsx` — wire `sorting: SortingState` (derived from `filters.sort_by` / `filters.sort_order`) into `DataTable`'s `tableOptions.sorting`; implement `handleSortingChange` that calls `setFilters({ sort_by, sort_order })` and resets `page` to 1 on sort change (mirror `members/page.tsx` pattern); pass `manualSorting: true` in `tableOptions`

**Checkpoint**: Clicking any sortable column header sends the correct `sort_by`/`sort_order` params to the API. Default load shows STF-001 first with ascending indicator on `スタッフID`. Refresh preserves sort state.

---

## Phase 7: User Story 5 — Row Actions / Delete (Priority: P3)

**Goal**: `…` menu with 編集+削除 (HQ) or 編集 only (Manager); delete flow via `<AlertDialog>` with 削除理由, optimistic removal, sonner toasts.

**Independent Test**: Click `…` → see exactly 2 items (HQ) or 1 item (Manager); click 削除 → AlertDialog opens with correct copy; submit with reason → row disappears instantly, sonner success toast; simulate API error → row restores, error toast.

### Contract Tests for US5

- [ ] T020 [P] [US5] Add to contract test file — `DELETE /crm/staff/[id]` valid ID (→ 200 + `DeleteStaffResponseSchema`); non-existent ID (→ 404 + error schema)

### Implementation for US5

- [x] T021 [US5] Create `src/app/(private)/settings/staff/_components/staff-delete-dialog.tsx` — `<AlertDialog>` controlled by `open`/`onOpenChange` props; render title "スタッフを削除しますか？", body copy per spec, `<Textarea placeholder="削除理由を入力してください（任意）">` (optional), `<Button variant="outline">キャンセル</Button>`, `<Button variant="destructive">削除する</Button>`; wire `useMutation({ mutationFn: (id) => deleteCrmStaffById({ path: { id }, body: { reason } }), onMutate: optimistic remove from query cache, onError: rollback, onSuccess: invalidate staff query + toast.success('スタッフを削除しました'), onError: toast.error('削除に失敗しました。再度お試しください。') })`
- [x] T022 [US5] Update `staff-table-columns.tsx` — replace `_actions` column stub with full `<DropdownMenu>`: render `<DropdownMenuItem>✏ 編集</DropdownMenuItem>` (navigate to `/settings/staff/[staffId]`) for all HQ+Manager users; render `<DropdownMenuItem className="text-destructive">🗑 削除</DropdownMenuItem>` only when `role === 'headquarter'` (absent from DOM for Manager — conditional render, not CSS hide); wire 削除 item to open `<StaffDeleteDialog>` with `staffId` state

**Checkpoint**: `…` menu shows correct items per role. Delete dialog opens with all correct elements. Optimistic removal works. Rollback works on error. Both toasts fire correctly. Manager sees only 編集.

---

## Phase 8: User Story 6 — Invite Staff (Priority: P3)

**Goal**: `スタッフを招待` `<Dialog>` with 職位/ブランド selects, bulk email textarea, 招待リスト staging, and `POST /crm/staff/invitations` call.

**Independent Test**: Click `スタッフを招待` → Dialog opens; select 正社員スタッフ + JOYFIT; type two emails (newline-separated); click `+ リストに追加` → 2 rows appear in 招待リスト; click `招待メールを送信` → dialog closes, sonner success toast; `招待メールを送信` is disabled when 招待リスト is empty.

### Contract Tests for US6

- [ ] T023 [P] [US6] Add to contract test file — `POST /crm/staff/invitations` valid payload (→ 201 + `InviteStaffResponseSchema`); empty `invitations[]` (→ 400 + error schema)

### Implementation for US6

- [x] T024 [US6] Create `src/app/(private)/settings/staff/_components/staff-invite-dialog.tsx` — controlled by `open`/`onOpenChange` props; local state: `position` (default `'pos-staff-fulltime'`), `brand: StaffBrand` (default `null`), `emailInput: string` (default `''`), `stagingList: StaffInvitationEntry[]` (default `[]`); render Dialog with title "スタッフを招待", description text; `<Select>` for 招待時の職位 (options from `getStaffPositionsOptions` — reuse same query key as filter panel, no extra fetch); `<Select>` for 招待時のブランド (static 5-option list); `<Textarea>` for メールアドレス (required, newline-delimited); `<Button>+ リストに追加</Button>` (disabled when `emailInput.trim() === ''`) — on click: split `emailInput` by newline, filter valid emails, append `{ email, position_id: position, brand }` rows to `stagingList`, clear textarea; 招待リスト section (empty state when `stagingList.length === 0`); `<Button>招待メールを送信</Button>` (disabled when `stagingList.length === 0`); `キャンセル` closes dialog; wire `useMutation({ mutationFn: postCrmStaffInvitations, onSuccess: toast.success + close, onError: toast.error (dialog stays open) })`
- [x] T025 [US6] Update `page.tsx` — add `inviteOpen: boolean` state; render `<Button>✉ スタッフを招待</Button>` in page title row (visible only when `role === 'headquarter'`; absent from DOM otherwise); wire to `<StaffInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />`

**Checkpoint**: Full invite flow works end-to-end. `スタッフを招待` button absent from DOM for non-HQ. 招待リスト staging works. `招待メールを送信` disabled when list empty. Success/error toasts fire correctly.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, accessibility, performance validation, and cleanup across all user stories.

- [ ] T026 [P] Add empty state to `page.tsx` — render `<Empty icon={Users} title="スタッフが見つかりません" description="条件を変えて再度お試しください" />` (when filters active) or `"スタッフを招待してください"` (HQ only, no staff at all); import `Users` from `lucide-react`
- [ ] T027 [P] Add `<DataStateBoundary>` error state to `page.tsx` — wrap `<DataTable>` in `<DataStateBoundary>` so network errors render a retry button instead of a raw error message
- [ ] T028 [P] Verify `last_login_at` null handling in `staff-table-columns.tsx` — display "—" when `last_login_at` is null; confirm `format(parseISO(...))` is not called on null
- [ ] T029 [P] Verify `brand = null` display in `staff-table-columns.tsx` — column renders "全ブランド" (plain string, no badge) when `brand` is null
- [ ] T030 [P] Verify `<TextWithTooltip>` applied in `staff-table-columns.tsx` — `name_kanji` and `email` columns use `<TextWithTooltip>` for overflow truncation
- [ ] T031 Run `npm run lint` and fix all ESLint/Prettier violations across all new files in `src/app/(private)/settings/staff/` and `src/app/api/crm/staff/`
- [ ] T032 Run `npm run type-check` — confirm zero TypeScript errors across all 16 new files
- [ ] T033 Run `npm run build` and verify `/settings/staff` route chunk gzip ≤ 250 kB (Constitution Principle V — SC-004)
- [ ] T034 Manual accessibility check — verify `<DataTableColumnHeader>` sort buttons, filter `<Select>` controls, `<DropdownMenu>` items, `<AlertDialog>`, and `<Dialog>` are all keyboard-navigable and pass WCAG 2.1 AA colour contrast (SC-006)

**Checkpoint**: All 6 user stories pass their independent tests. `npm run lint`, `npm run type-check`, `npm run build` all pass. Bundle size within budget.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: T001–T003)
  └─► Phase 2 (Foundational: T004–T007)
        └─► Phase 3 (US1: T008–T013)  ← MVP — stop here to validate
              ├─► Phase 4 (US2: T014–T015)
              │     └─► Phase 5 (US3: T016–T017)
              ├─► Phase 6 (US4: T018–T019)
              ├─► Phase 7 (US5: T020–T022)
              └─► Phase 8 (US6: T023–T025)
                    └─► Phase 9 (Polish: T026–T034)
```

### User Story Dependencies

| Story    | Depends on                       | Can parallelise with |
| -------- | -------------------------------- | -------------------- |
| US1 (P1) | Phase 2 complete                 | — (first story)      |
| US2 (P2) | US1 complete                     | US4, US5, US6        |
| US3 (P2) | US2 complete (reuses filter bar) | US4, US5, US6        |
| US4 (P3) | US1 complete                     | US2, US3, US5, US6   |
| US5 (P3) | US1 complete                     | US2, US3, US4, US6   |
| US6 (P3) | US1 complete                     | US2, US3, US4, US5   |

### Critical Path (single developer)

`T001 → T002 → T003 → T004 → T005 + T006 → T007 → T009 → T010 + T011 → T012 → T013` = **MVP live**

---

## Parallel Opportunities

### Phase 1 (all parallelisable after T001)

```
T001 (types) → T002 (schemas, needs T001) → T003 (mock DB, needs T001+T002)
```

### Phase 2

```
T004 (GET /staff) → T005 [P] (positions route) + T006 [P] (DELETE + POST routes) → T007 (codegen, needs T004+T005+T006)
```

### Phase 3 (after T007)

```
T009 (settings layout)
T010 [P] (filters context)     ← can start together
T011 [P] (useStaffFilters hook)  ←
T012 (columns, needs T007)
T013 (page, needs T009+T010+T011+T012)
```

### Phases 4–8 (after US1 = T013 complete)

```
T014+T015 (US2) ──► T016+T017 (US3, needs US2 filter bar)
T018+T019 (US4) ─┐
T020+T021+T022 (US5) ─┤ all can start in parallel
T023+T024+T025 (US6) ─┘
```

---

## Implementation Strategy

### MVP First (User Stories 1 only)

1. Complete **Phase 1** — types, schemas, mock DB
2. Complete **Phase 2** — API routes + codegen
3. Complete **Phase 3** — page renders with DataTable
4. **STOP and VALIDATE**: visit `/settings/staff`, confirm 8 rows, correct columns, badges, footer
5. Run contract test T008

### Incremental Delivery

| Milestone | Stories | What it delivers                       |
| --------- | ------- | -------------------------------------- |
| MVP       | US1     | Table renders with data                |
| + Search  | US1+US2 | Can find staff by name/email           |
| + Filters | US1–US3 | Can filter by 職位/ブランド/ステータス |
| + Sort    | US1–US4 | Can sort all 5 sortable columns        |
| + Delete  | US1–US5 | Can remove staff accounts              |
| Full      | US1–US6 | Can invite new staff                   |

---

## Summary

| Metric                   | Count                         |
| ------------------------ | ----------------------------- |
| Total tasks              | 34                            |
| Phase 1 (Setup)          | 3                             |
| Phase 2 (Foundational)   | 4                             |
| Phase 3 (US1 — P1)       | 6                             |
| Phase 4 (US2 — P2)       | 2                             |
| Phase 5 (US3 — P2)       | 2                             |
| Phase 6 (US4 — P3)       | 2                             |
| Phase 7 (US5 — P3)       | 3                             |
| Phase 8 (US6 — P3)       | 3                             |
| Phase 9 (Polish)         | 9                             |
| Parallelisable tasks [P] | 14                            |
| Contract test tasks      | 4 (T008, T016, T020, T023)    |
| New files to create      | 16                            |
| Files to extend          | 2 (`_mock-db.ts`, `page.tsx`) |
