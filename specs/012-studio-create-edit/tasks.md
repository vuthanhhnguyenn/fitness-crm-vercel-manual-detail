# Tasks: Studio Registration & Space Layout Management

**Input**: Design documents from `specs/012-studio-create-edit/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root
- All paths are relative to repository root `/home/du/WorkSpace/dx-fitness/fitness-crm/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Declare new schemas and types required before endpoint or form work can begin.

- [x] T001 [P] Add `'studio'` category to the upload Zod enum in `src/app/api/_schemas/upload.schema.ts`
- [x] T002 [P] Add `'studio'` to the `UploadCategory` type in `src/hooks/use-image-upload.hook.ts`
- [x] T003 [P] Declare `POST /api/crm/studios` and `PUT /api/crm/studios/{id}` via `registerRoute()` in `src/app/api/_schemas/studio.schema.ts` — define `CreateStudioPayloadSchema`, `UpdateStudioPayloadSchema`, `CreateStudioResponseSchema`, `UpdateStudioResponseSchema` using Zod with `.openapi()` decorators per the contract in `contracts/studio-api.md`

**Checkpoint**: Upload schema supports `'studio'` category; OpenAPI spec has create/update studio endpoint declarations.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend API and shared form schema that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 [P] Define `StudioCreateInput` and `StudioUpdateInput` types in `src/app/api/_mock-db/types/studios.type.ts`
- [x] T005 [P] Add `create()` and `update()` methods to `db.studios` in `src/app/api/_mock-db/lesson.table.ts` — create generates ID `STU-{N}`, stores layout + images alongside studio fields; update merges into existing detail record
- [x] T006 [P] Seed a fresh empty studio detail record structure for new creates in `src/app/api/_mock-db/lesson.seed.ts`
- [x] T007 [P] Implement `POST /api/crm/studios` handler in `src/app/api/crm/studios/route.ts` — parse body with `CreateStudioPayloadSchema`, call `db.studios.create()`, return `{ id }` with 201
- [x] T008 [P] Implement `PUT /api/crm/studios/[id]` handler in `src/app/api/crm/studios/[id]/route.ts` — parse body with `UpdateStudioPayloadSchema`, call `db.studios.update()`, return `{ success: true }` with 200
- [x] T009 [P] Create studio form Zod schema at `src/app/(private)/studios/_components/studio-form.schema.ts` — define `StudioFormValues`, `StudioImageItem`, `LayoutCell`, `SpaceLayout` types with validation rules (capacity ≤ 500, buffer ≤ 500, rows ∈ {2,3,4,5}, columns ∈ {6,8,10}, operating_hours format `HH:mm~HH:mm`)

**Checkpoint**: API can create and update studios in mock DB; form schema defines all validation rules.

---

## Phase 3: User Story 3 — Configure Space Layout (Priority: P1)

**Goal**: Build the `SpaceLayoutEditor` component — an interactive grid for configuring studio floor plans. This component is shared between create and edit forms.

**Independent Test**: Render the editor standalone, click cells to change types, change dimensions via dropdowns, verify summary counts update, verify reset restores default.

### Implementation for User Story 3

- [x] T010 [US3] Create `space-layout-editor.tsx` at `src/app/(private)/studios/_components/studio-form/space-layout-editor.tsx`:
  - CSS Grid with dynamic `grid-template-columns: repeat(N, 1fr)` and `grid-template-rows: repeat(M, 1fr)`
  - Each cell is a `<button>` element with color classes: green (`normal_seat`), orange (`equipment_seat`), grey (`fixed_object`), blank (`empty`)
  - Grid defaults: 2 rows × 8 columns, all cells `empty`
- [x] T011 [P] [US3] Implement placement mode selector — 4 pill buttons: "通常席", "器材席", "固定物", "未使用" with color indicators; selected mode has ring highlight
- [x] T012 [US3] Wire cell click handler — clicking a cell changes it to the currently selected placement type
- [x] T013 [P] [US3] Implement column count `<select>` with options 6, 8, 10 (default 8) — on change, resize grid dynamically, preserve cells within new bounds, discard outside
- [x] T014 [P] [US3] Implement row count `<select>` with options 2, 3, 4, 5 (default 2) — same dynamic resize behavior
- [x] T015 [US3] Implement summary section showing: 総スペース数 (rows × cols), 予約可能スペース (count of `normal_seat`), 利用不可スペース (count of `equipment_seat` + `fixed_object`)
- [x] T016 [US3] Implement legend with 3 color-coded entries: 通常席 (green), 器材席 (orange), 固定物 (grey)
- [x] T017 [US3] Implement "リセット" link button — restores 2×8 grid with all cells `empty`
- [x] T018 [US3] Integrate `SpaceLayoutEditor` as a right panel alongside the form in a two-column layout — receives `value` (layout state) and `onChange` callback; wrap in a `Card` with title "スペースレイアウト"

**Checkpoint**: Space layout editor is fully functional and can be embedded in any form. Grid resizes dynamically, cell types toggle, summary counts are correct.

---

## Phase 4: User Story 1 — Register a New Studio (Priority: P1)

**Goal**: Build the studio creation form with all required fields, image upload, space layout editor, confirmation dialog, and wire to the POST API.

**Independent Test**: Navigate to `/studios/create`, fill all fields, configure layout, submit, confirm dialog appears, confirm, verify redirect to detail page with correct data.

### Implementation for User Story 1

- [x] T019 [P] [US1] Create `studio-form-basic-info.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-basic-info.tsx`:
  - 店舗名 (Store) — `<Select>` populated from `GET /api/crm/stores`, required
  - スタジオ名 (Studio Name) — `<Input>`, required
  - スタジオ区分 (Studio Type) — `<Select>` with options: ノーマル, ホットヨガ, バーチャル, required
  - 利用可能時間 (Operating Hours) — two time `<Input type="time">` for start/end, required
  - 収容人数 (Capacity) — `<Input type="number">`, required, max 500, suffix "名"
  - バッファ値 (Buffer Capacity) — `<Input type="number">`, required, default 0, max 500, suffix "名"
- [x] T020 [P] [US1] Create `studio-form-equipment.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-equipment.tsx` — `<Textarea>` for equipment notes, optional, placeholder: "例: ヨガマット20枚、ミラー壁面、音響設備..."
- [x] T021 [P] [US1] Create `studio-form-notes.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-notes.tsx` — `<Textarea>` for internal notes, optional, placeholder: "管理用のメモを入力してください..."
- [x] T022 [P] [US1] Create `studio-form-status.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-status.tsx` — `<Switch>` toggle with description: "無効にすると新規スケジュール登録時の選択肢に表示されません。"
- [x] T023 [US1] Create `studio-form-images.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-images.tsx` — model after `lesson-form-images.tsx`:
  - Drag-and-drop upload zone with `<input type="file">` fallback
  - Accept JPG/PNG/WebP, max 5MB per file
  - Uses `useImageUpload({ category: 'studio' })`
  - Preview in 3-column grid, remove button per image
  - Recommended specs text: "推奨: 1200 x 800px (3:2) | JPG, PNG, WebP | 最大5MB | 複数枚対応"
- [x] T024 [P] [US1] Create `studio-form-confirm-dialog.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-confirm-dialog.tsx` — `<AlertDialog>` showing: スタジオ名, 所属店舗, スタジオ区分, 定員, 利用可能時間, ステータス; labels: "この内容で登録する" (create) / "この内容で保存する" (edit), "キャンセル" to dismiss
- [x] T025 [US1] Create `studio-form.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form.tsx` — main form component modeled after `lesson-form.tsx`:
  - `useForm<StudioFormInput, unknown, StudioFormValues>` with zod resolver
  - `mode: 'create' | 'edit'` prop, `defaultValues?`, `studioId?`
  - Layout: left column (basic-info, equipment, images, notes, status) + right column (space-layout-editor)
  - Submit flow: validate → show confirm dialog → call create/update mutation
  - Create mutation: `fetch POST /api/crm/studios` → navigate to `/studios/[id]`
  - Cancel button: `window.history.back()`
  - Include helper `formValuesToApiBody()` to transform form values to API shape
- [x] T026 [US1] Create `studio-form-skeleton.tsx` at `src/app/(private)/studios/_components/studio-form/studio-form-skeleton.tsx` — loading skeleton matching form layout (left column skeleton + right column skeleton)
- [x] T027 [US1] Replace create page stub at `src/app/(private)/studios/create/page.tsx` — render `<StudioForm mode="create" />`

**Checkpoint**: Studio creation flow works end-to-end — form renders, validates, uploads images, configures layout, confirms, and navigates to detail page.

---

## Phase 5: User Story 2 — Edit an Existing Studio (Priority: P1)

**Goal**: Build the edit form with data pre-population, update mutation, and warning alert for studios with active scheduled lessons.

**Independent Test**: Navigate to `/studios/{id}/edit`, verify all fields pre-populated, modify a field, save, verify redirect to detail page with updated values.

### Implementation for User Story 2

- [x] T028 [US2] Create edit page at `src/app/(private)/studios/[id]/edit/page.tsx`:
  - Fetch studio data via `GET /api/crm/studios/[id]` in the server component
  - Transform API response shape (`data`, `images`, `layout`) to `StudioFormValues` shape (`defaultValues`)
  - Render `<StudioForm mode="edit" studioId={id} defaultValues={...} />`
  - Page title: "スタジオ編集"
- [x] T029 [US2] Create edit page loading skeleton at `src/app/(private)/studios/[id]/edit/loading.tsx` — render `<StudioFormSkeleton />`
- [x] T030 [US2] Add warning alert to `studio-form.tsx` — when `mode === 'edit'` and studio has `assigned_lesson_count > 0`, show: "料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。" (matching the lesson form edit pattern)
- [x] T031 [US2] Wire update mutation in `studio-form.tsx` — update flow uses `fetch PUT /api/crm/studios/{studioId}`, on success navigate to `/studios/[id]`, on error show toast

**Checkpoint**: Studio editing flow works end-to-end — form pre-populates, modifies, confirms, saves, and navigates to updated detail page.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, edge cases, and quality checks.

- [x] T032 Run TypeScript strict-mode check: `tsc --noEmit` — fix any type errors in new files
- [x] T033 Run ESLint: `npx eslint src/app/(private)/studios/ src/app/api/crm/studios/` — fix any lint violations
- [x] T034 Verify all new files use consistent import order (Prettier sort-imports), run `npx prettier --write "src/app/(private)/studios/**/*" "src/app/api/crm/studios/**/*"`
- [x] T035 Run the quickstart.md checklist manually — verify each create/edit/layout/image scenario works as specified
- [x] T036 Verify edge cases: cancel button navigates back; empty layout sends empty array; buffer_value defaults to 0; capacity/buffer capped at 500; validation messages in "{項目名}は必須です。" format

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **User Story 3 (Phase 3)**: Depends on Foundational (Phase 2) — US3 has NO dependency on US1/US2
- **User Story 1 (Phase 4)**: Depends on Foundational (Phase 2) + US3 (space layout editor)
- **User Story 2 (Phase 5)**: Depends on US1 (shares `StudioForm` component) + US3 (space layout editor)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 3 (P1)**: Can start immediately after Foundational — No dependencies on other stories
- **User Story 1 (P1)**: Depends on US3 (needs SpaceLayoutEditor) — Can start after US3 completes
- **User Story 2 (P1)**: Depends on US1 (shares StudioForm base) + US3 (needs SpaceLayoutEditor) — Starts after US1

### Within Each User Story

- Models/schemas before components
- Sub-components before integration
- Core implementation before integration into page
- Story complete before moving to next priority

### Parallel Opportunities

- T001, T002, T003 (Phase 1) — all independent, can run in parallel
- T004, T005, T006, T007, T008, T009 (Phase 2) — all independent, can run in parallel
- T011, T013, T014 (Phase 3/US3) — independent sub-components, can run in parallel
- T019, T020, T021, T022, T024 (Phase 4/US1) — independent sub-components, can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch all independent sub-components for US3 together:
Task: "Implement placement mode selector in space-layout-editor.tsx"
Task: "Implement column count dropdown in space-layout-editor.tsx"
Task: "Implement row count dropdown in space-layout-editor.tsx"

# Then sequential integration:
Task: "Wire cell click handler"
Task: "Implement summary section"
Task: "Implement legend"
Task: "Implement reset button"
Task: "Integrate as right panel"
```

## Parallel Example: User Story 1

```bash
# Launch all independent form sub-components for US1 together:
Task: "Create studio-form-basic-info.tsx"
Task: "Create studio-form-equipment.tsx"
Task: "Create studio-form-notes.tsx"
Task: "Create studio-form-status.tsx"
Task: "Create studio-form-confirm-dialog.tsx"

# Then sequential integration:
Task: "Create studio-form-images.tsx"
Task: "Create studio-form.tsx (main form)"
Task: "Create studio-form-skeleton.tsx"
Task: "Replace create page stub"
```

---

## Implementation Strategy

### MVP First (User Story 3 + User Story 1)

1. Complete Phase 1: Setup (upload category, OpenAPI declarations)
2. Complete Phase 2: Foundational (mock DB, API routes, form schema)
3. Complete Phase 3: User Story 3 (space layout editor)
4. Complete Phase 4: User Story 1 (studio creation form)
5. **STOP and VALIDATE**: Test create flow independently — form renders, layout editor works, submission saves to mock DB, redirects to detail
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US3 (Space Layout Editor) → Independent component ready
3. Add US1 (Studio Create) → Full create flow, test independently → Deploy/Demo (MVP!)
4. Add US2 (Studio Edit) → Test independently → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US3 (Space Layout Editor) — 8 tasks
   - Developer B: US1 sub-components (basic-info, equipment, notes, status, confirm-dialog) — 5 parallel tasks
3. After US3 + sub-components:
   - Developer A: StudioForm integration, create page — 3 tasks
   - Developer B (or A): US2 (Studio Edit) — 4 tasks
4. Together: Polish phase — 5 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All UI components follow shadcn/ui patterns from the existing lesson form
- No new npm dependencies per Constitution V
- Form validation error messages use format: "{項目名}は必須です。" per FR-002-04
