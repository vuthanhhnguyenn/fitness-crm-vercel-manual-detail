# Tasks: FR-002 / FR-004 / FR-006 Lesson Content Master Create · Edit · Duplicate Form (D-02)

**Input**: Design documents from `/specs/009-lesson-content-form/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Contract tests ARE requested for this feature (plan.md "Testing: Contract tests for the two new mock routes" and the Definition of Done in both contract files). Contract test tasks are therefore included alongside the mock routes they verify.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Next.js 16 App Router web app. The form is colocated under `src/app/(private)/lessons/_components/lesson-form/`; Phase 1 mock API routes under `src/app/api/crm/lesson-contents/`. Client schemas under `src/app/(private)/lessons/_schemas/`; server schemas under `src/app/api/_schemas/`. Generated client at `src/lib/api/` (never hand-edited). Routes in `src/lib/routes/routes.config.ts`; permissions in `src/lib/permission.config.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the colocated `lesson-form/` subdirectory and `_schemas/` directory for the form feature.

- [ ] T001 Create the form component folder structure: `src/app/(private)/lessons/_components/lesson-form/` and `src/app/(private)/lessons/_schemas/` (placeholder/ready for the files below)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Register the new routes, add permission entries, create Zod schemas (client + server), enrich the mock DB with create/update methods, add POST/PATCH route handlers, regenerate the generated client, and install `react-quill-new`. ALL user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete (routes and schemas are required by all form sections; mock API methods and generated option factories block form submission).

- [ ] T002 [P] Add route entries to `src/lib/routes/routes.config.ts`: `/lessons/[id]/edit` → `/lessons/:id/edit` and `/lessons/[id]/duplicate` → `/lessons/:id/duplicate`, both marked `private: true` (research D13)
- [ ] T003 [P] Update `src/lib/permission.config.ts`: add `PAGE_PERMISSIONS` for `/lessons/:id/edit` → `Permission.LessonContentsEdit` and `/lessons/:id/duplicate` → `Permission.LessonContentsCreate` (research D11)
- [ ] T004 Create `src/app/api/_schemas/lesson-content-form.schema.ts` — server-side Zod schemas: `CreateLessonContentSchema` (name, lesson_type, brand, duration, pricing_type, per_use_fee nullable, restricted_main_contracts, restricted_option_contracts, description, internal_memo, status), `UpdateLessonContentSchema` (partial of create), `CreateLessonContentResponseSchema`, `UpdateLessonContentResponseSchema`. Reuse `LessonBrandSchema`, `LessonContentStatusSchema`, `LessonKindSchema`, `LessonPricingTypeSchema` from `lesson-content.schema.ts`; reuse `LessonContentDetailSchema` from `lesson-content-detail.schema.ts` (data-model.md / research D4)
- [ ] T005 Create `src/app/(private)/lessons/_schemas/lesson-form.schema.ts` — client-side Zod schema `LessonFormSchema` with `name` (min 1, max 255), `lessonType` (enum studio|personal|bodycare), `brand` (enum joyfit|fit365), `duration` (number), `pricingType` (enum free|monthly|per_use), `perUseFee` (nullable number, conditional via `superRefine` — required when `pricingType === 'per_use'`), `restrictedMainContracts` (string[] default []), `restrictedOptionContracts` (string[] default []), `images` (ImageItem[] default []), `description` (string max 10000 default ''), `notes` (string max 1000 default ''), `status` (enum active|inactive default 'active'); export `LessonFormValues` type (data-model.md / research D4)
- [ ] T006 Enrich `src/app/api/_mock-db.ts`: add `lessonContents.create(data)` — generate new ID (`LSN-XXXX` for studio/bodycare, `PLN-XXXX` for personal), insert into `_rows`, return full `LessonContentDetail`; add `lessonContents.update(id, data)` — merge provided fields into existing record, return updated detail; seed at least 2 new records to enable create/update testing (contracts post-lesson-content.md / patch-lesson-content.md)
- [ ] T007 [P] Enrich `src/app/api/crm/lesson-contents/route.ts` — add `POST` handler: parse body with `CreateLessonContentSchema`, call `db.lessonContents.create()`, return 200 with `CreateLessonContentResponse`; 400 on validation error; 500 fallback (contract `post-lesson-content.md`)
- [ ] T008 [P] Enrich `src/app/api/crm/lesson-contents/[id]/route.ts` — add `PATCH` handler: parse body with `UpdateLessonContentSchema`, call `db.lessonContents.update()`, return 200 with `UpdateLessonContentResponse`; 400 on validation error; 404 on unknown id; 500 fallback (contract `patch-lesson-content.md`)
- [ ] T009 Run `npm run generate-openapi && npm run generate-client` to regenerate OpenAPI spec, then `src/lib/api/types.gen.ts` and `src/lib/api/@tanstack/react-query.gen.ts`; verify new option factories exist for `postCrmLessonContents` (create) and `patchCrmLessonContentsById` (update) — do not hand-edit `src/lib/api/` (depends on T004, T006, T007, T008)
- [ ] T010 [P] Run `npm install react-quill-new` to add the maintained React wrapper for QuillJS v2 (research D9)

**Checkpoint**: Routes registered, mock endpoints accept create/update and return seeded data, client option factories generated, and QuillJS installed — form sub-components and pages can now be built.

---

## Phase 3: User Story 1 — Register a new lesson content master (Priority: P1) 🎯 MVP

**Goal**: Build the full shared `LessonForm` component with all 6 sections, skeleton loading, confirmation dialog, and the create page at `/lessons/create`. Create mode renders empty/default fields, validates required fields on submit, shows a confirmation dialog, and navigates to the lesson list on confirm.

**Independent Test**: Open `/lessons/create`; verify the page title is "新規レッスン作成", the submit button reads "入力内容を確認する", all fields are empty/default with status toggle on (有効). Fill required fields, submit, verify validation errors appear when fields are empty, then fill all required fields, see the confirmation dialog, confirm, and land on the lesson list with a success toast.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-basic-info.tsx` — Section 1: 2-column grid with `FormField` for `name` (Input, required), `lessonType` (Select: スタジオレッスン / パーソナルトレーニング / ボディケア, required), `brand` (Select: JOYFIT / FIT365, required, placeholder "選択してください"), `duration` (Select — dynamic options: personal → 30分/60分, studio/bodycare → 15/30/45/50/60/90/120分, driven by `useWatch('lessonType')`, required), `pricingType` (Select: 無料 / 有料（月払） / 有料（都次）, required), conditional `perUseFee` (Input + "円" suffix, visible only when `useWatch('pricingType') === 'per_use'`, required when shown); error messages per data-model.md (spec FR-002-P1-03/04/05/07/08/09)
- [ ] T012 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-restrictions.tsx` — Section 2: 2-column grid with 制限主契約 and 制限オプション契約, each a `Popover` + `Command` searchable multi-select rendering selected values as removable `Badge`s; empty state shows "制限なし（複数選択可）"; empty-search feedback "該当する契約がありません" / "該当するオプションがありません" (spec FR-002-P1-10/11)
- [ ] T013 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-images.tsx` — Section 3: sortable image grid with drag handles (visual only, no actual drag logic in Phase 1 — provide the layout structure), each card with delete (trash) button and "メイン" marker on first image; dashed drag-and-drop upload zone with "画像を追加" button and guidance text "推奨 1200×800px 3:2; JPG/PNG/WebP; 最大5MB; 複数枚対応"; hidden when no images, only upload zone shown (spec FR-002-P1-12 / research D9)
- [ ] T014 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-description.tsx` — Section 4: QuillJS rich-text editor via `react-quill-new` with full toolbar (block style select: 標準/見出し1/見出し2, Bold/Italic/Underline/Strikethrough buttons); section heading varies by lesson type: useWatch('lessonType') → "トレーニング内容説明" (personal) or "レッスン内容説明" (studio/bodycare); import `react-quill-new/dist/quill.snow.css`; HTML output stored in `description` field (spec FR-002-P1-13 / research D9)
- [ ] T015 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-notes.tsx` — Section 5: `Textarea` with placeholder "内部メモ・備考を入力（会員には表示されません）" (spec FR-002-P1-14)
- [ ] T016 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-status.tsx` — Section 6: "現在のステータス" label, `Switch` (default checked/active), state `Badge` reflecting toggle (有効 green / 無効 muted), helper text "無効にすると、新規スケジュール登録時の選択肢に表示されません。既存のスケジュールは引き続き有効です。" (spec FR-002-P1-15)
- [ ] T017 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-skeleton.tsx` — loading skeleton mirroring the 6-card form layout (header placeholder + 6 card skeletons) (spec FR-007-P1-01 / research D7)
- [ ] T018 [P] [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form-confirm-dialog.tsx` — `AlertDialog` with mode-dependent title ("以下の内容で登録します。よろしいですか？" create/duplicate / "この内容で変更を保存しますか？" edit), body summarizing レッスン区分 / レッスン名 / 料金種別 / ステータス, cancel "キャンセル", confirm "この内容で登録する" / "この内容で保存する"; receives form values as props for summary display (research D10 / data-model.md FormMode table)
- [ ] T019 [US1] Create `src/app/(private)/lessons/_components/lesson-form/lesson-form.tsx` — main `'use client'` component accepting `mode: 'create' | 'edit' | 'duplicate'` and optional `defaultValues: Partial<LessonFormValues>`; wraps `Form` with `useForm<LessonFormValues>` + `zodResolver(LessonFormSchema)`; renders edit-mode warning banner (only when `mode === 'edit'`: "料金や制限条件を変更すると、予約済みの会員にも影響する場合があります。"); orchestrates all 6 section cards in order; footer with "キャンセル" (outline → `router.back()`) + submit button (label by mode: "入力内容を確認する" / "変更を保存する"); submit handler: `form.handleSubmit` → on validation failure show inline errors + footer summary "入力内容に不備があります。エラー表示の項目をご確認ください。"; on valid → open `LessonFormConfirmDialog`; on confirm → `useMutation` via generated option factory (create → `postCrmLessonContents`, edit → `patchCrmLessonContentsById`, duplicate → `postCrmLessonContents`) → success toast by mode → `router.push(navigate('/lessons'))`; maps form shape to API shape (snake_case conversion). Fields clear errors on edit via `form.clearErrors`. No dedicated submit-error UI (Phase 1) (spec FR-002-P1-01/02/16/17/18, FR-004-P1-02/03, FR-006-P1-02)
- [ ] T020 [US1] Replace `src/app/(private)/lessons/create/page.tsx` — import `LessonForm`, render `<LessonForm mode="create" />` with no defaultValues (empty form); page title "新規レッスン作成" via `PageHeader`; breadcrumb back link "レッスン内容管理に戻る" → `/lessons` (depends on T019)

**Checkpoint**: `/lessons/create` renders the full form with all 6 sections; required-field validation works; confirmation dialog opens and submits; user lands on lesson list with a success toast. MVP is functional.

---

## Phase 4: User Story 2 — Edit an existing lesson content master (Priority: P1)

**Goal**: Create the edit page at `/lessons/[id]/edit` that fetches the source master via `useQuery`, shows skeleton loading, pre-populates the form, and uses edit-mode labels/labels/confirmation/toast. Update the detail screen's Edit button to navigate to the new edit route.

**Independent Test**: Open `/lessons/[id]/edit`; verify skeleton on load, then pre-populated fields matching the source master, the warning banner, edit-mode title "スタジオレッスン編集" / "パーソナルトレーニング編集", submit button "変更を保存する", and edit-specific confirmation dialog and toast.

### Implementation for User Story 2

- [ ] T021 [US2] Create `src/app/(private)/lessons/[id]/edit/page.tsx` — read `id` via `useParams`, `useQuery` via `getCrmLessonContentsByIdOptions`, render `LessonFormSkeleton` while loading, `DataStateBoundary` for error/not-found, map fetched detail to `LessonFormValues` (convert snake_case API shape to camelCase form shape — lesson_type → lessonType, per_use_fee → perUseFee, internal_memo → notes, etc.), pass as `defaultValues` to `<LessonForm mode="edit" />`; page title dynamic: "スタジオレッスン編集" (studio/bodycare) or "パーソナルトレーニング編集" (personal); breadcrumb back link → `/lessons/[id]` (spec FR-004-P1-01/02, research D2/D7)
- [ ] T022 [US2] Update `src/app/(private)/lessons/[id]/_components/lesson-detail-header-actions.tsx` — change Edit navigation from current pattern to `navigate('/lessons/[id]/edit', detail.id)` (research D12)

**Checkpoint**: `/lessons/[id]/edit` pre-fills the form from the source master, shows skeleton during load, renders edit-specific UI, and saves via PATCH with edit confirmation dialog. The detail screen's Edit button navigates to the correct route.

---

## Phase 5: User Story 3 — Duplicate a lesson content master into a new draft (Priority: P2)

**Goal**: Create the duplicate page at `/lessons/[id]/duplicate` that fetches the source master, appends "（コピー）" to the name, pre-populates the form with all other fields verbatim, and uses create-mode labels (title "新規レッスン作成", submit "入力内容を確認する", create confirmation dialog, toast "レッスンを登録しました"). Update the detail screen's Duplicate button to navigate to the new route.

**Independent Test**: Open `/lessons/[id]/duplicate`; verify skeleton on load, then all fields pre-populated from source with name suffixed "（コピー）", create-mode UI labels, and create confirmation/toast flow.

### Implementation for User Story 3

- [ ] T023 [US3] Create `src/app/(private)/lessons/[id]/duplicate/page.tsx` — read `id` via `useParams`, `useQuery` via `getCrmLessonContentsByIdOptions`, render `LessonFormSkeleton` while loading, `DataStateBoundary` for error/not-found, map fetched detail to `LessonFormValues` appending "（コピー）" to `name` (maintaining max 255 char limit), pass as `defaultValues` to `<LessonForm mode="duplicate" />`; page title "新規レッスン作成"; breadcrumb back link → `/lessons` (spec FR-006-P1-01/02, research D2/D7)
- [ ] T024 [US3] Update `src/app/(private)/lessons/[id]/_components/lesson-detail-header-actions.tsx` — change Duplicate navigation from `/lessons/create?copyFrom=...` to `navigate('/lessons/[id]/duplicate', detail.id)` (research D12)

**Checkpoint**: `/lessons/[id]/duplicate` pre-fills all fields from the source master with name suffixed "（コピー）", uses create-mode labels, and creates via POST. The detail screen's Duplicate button navigates to the correct route.

---

## Phase 6: Contract Tests (Mock API Validation)

**Purpose**: Verify the two new mock API routes (POST create, PATCH update) behave correctly per the contract definitions. Run after the route handlers are implemented.

- [ ] T025 [P] Contract test for `POST /api/crm/lesson-contents` in `src/app/api/crm/lesson-contents/route.test.ts` covering: happy path (valid payload → 200 with message + data), missing required field (`name` omitted → 400), invalid enum value (`brand: 'invalid'` → 400), conditional required (`pricing_type: 'per_use'` with no `per_use_fee` → 400) (contract `post-lesson-content.md` Definition of Done)
- [ ] T026 [P] Contract test for `PATCH /api/crm/lesson-contents/{id}` in `src/app/api/crm/lesson-contents/[id]/route.test.ts` covering: happy path (valid partial payload → 200 with updated data), not found (non-existent ID → 404), invalid field value (`status: 'invalid'` → 400), full update (all fields provided → 200) (contract `patch-lesson-content.md` Definition of Done)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and final validation across all stories.

- [ ] T027 [P] Run `npm run lint` and resolve all errors across the new form files, page files, mock route handler files, and schema files
- [ ] T028 [P] Run `npx tsc --noEmit` and resolve all type errors (no `any`; form consumes generated `types.gen.ts` + `LessonFormValues`; API schemas reuse existing enums; component props are typed)
- [ ] T029 Execute the `quickstart.md` manual verification table (SC-001 … SC-009) against `npm run dev`: verify all three modes, conditional fields, validation, confirmation dialog, skeleton loading, and navigation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (routes, schemas, mock API, generated client required by form and pages).
- **User Stories (Phase 3–5)**: All depend on Foundational completion.
  - US1 (P1) is the MVP (all form sections + main form + create page).
  - US2 (P1) depends on US1 (reuses `LessonForm` component with edit mode).
  - US3 (P2) depends on US1 (reuses `LessonForm` component with duplicate mode).
- **Contract Tests (Phase 6)**: Depends on Phase 2 (route handlers must exist).
- **Polish (Phase 7)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. Creates all form sub-components, main form, and create page.
- **US2 (P1)**: Starts after US1 (reuses `LessonForm` in edit mode). Page file is independent (new file).
- **US3 (P2)**: Starts after US1 (reuses `LessonForm` in duplicate mode). Page file is independent (new file).

### Within Each Phase

- Form sub-components (T011–T018) before main form (T019); main form before create page (T020).
- Foundational schemas (T004, T005) before mock DB methods (T006); mock DB before route handlers (T007, T008); route handlers before generate-client (T009).
- Route registration (T002) before permission config (T003) — independent otherwise.
- Contract tests (T025, T026) after route handlers (T007, T008) are implemented.

### Parallel Opportunities

- T002 (routes) and T003 (permissions) can run in parallel.
- T004 (server schema) and T005 (client schema) can run in parallel (different directories).
- T007 (POST route) and T008 (PATCH route) are parallel after T004 + T006.
- T010 (install QuillJS) is independent — run anytime in Phase 2.
- US1 form sub-components T011–T018 are all parallel (different files).
- T025 and T026 (contract tests) are parallel.
- T027 and T028 (lint/tsc) are parallel.

---

## Parallel Example: Foundational mock routes

```bash
# After T004 (server schema) + T006 (mock DB enrichment):
Task: "Enrich src/app/api/crm/lesson-contents/route.ts with POST handler"         # T007
Task: "Enrich src/app/api/crm/lesson-contents/[id]/route.ts with PATCH handler"   # T008

# After T009 (generate-client):
Task: "Contract test for POST /api/crm/lesson-contents"                           # T025
Task: "Contract test for PATCH /api/crm/lesson-contents/{id}"                     # T026
```

## Parallel Example: User Story 1 form sub-components

```bash
Task: "Create lesson-form-basic-info.tsx"          # T011
Task: "Create lesson-form-restrictions.tsx"        # T012
Task: "Create lesson-form-images.tsx"              # T013
Task: "Create lesson-form-description.tsx"         # T014
Task: "Create lesson-form-notes.tsx"               # T015
Task: "Create lesson-form-status.tsx"              # T016
Task: "Create lesson-form-skeleton.tsx"            # T017
Task: "Create lesson-form-confirm-dialog.tsx"      # T018
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (routes, permissions, schemas, mock DB + API, generate-client, QuillJS).
3. Complete Phase 3: User Story 1 (all form sub-components → main form → create page).
4. **STOP and VALIDATE**: Open `/lessons/create`, fill fields, submit with validation errors → verify, then fill required fields → confirm dialog → success toast → navigate to list.
5. Demo the create form MVP.

### Incremental Delivery

1. Setup + Foundational → routes, API layer, schemas, client generated.
2. US1 → full form with create flow (MVP — all 6 sections + validation + confirm + toast).
3. US2 → edit page with pre-fill + edit-specific UI.
4. US3 → duplicate page with pre-fill + name suffix.
5. Contract tests → POST and PATCH route validation.
6. Polish → lint, tsc, quickstart verification.

---

## Notes

- [P] tasks = different files, no dependencies.
- All user-visible labels in Japanese; identifiers/comments in English.
- Use `navigate()` from `@/lib/routes/routes.util` for all links — no raw `router.push` strings.
- Form uses `react-hook-form` + `zodResolver` via `@hookform/resolvers/zod`; sub-components use `useFormContext()`.
- Conditional field visibility uses `useWatch()` from `react-hook-form`.
- Loading via `LessonFormSkeleton`; error/not-found via `DataStateBoundary`.
- All images via `next/image` (Principle VI).
- API request/response mapping: camelCase form ↔ snake_case API (converted in page files).
- No `any`; no global state store; URL state via nuqs only. Never hand-edit `src/lib/api/` — regenerate via `npm run generate-client`.
- The list-screen "新規レッスン作成" button must be wrapped in `RoleGatedButton allowedRoles={["Headquarter", "System"]}` (spec FR-009-P1-01). This is a pre-existing button — verify it is already gated; if not, add gating as part of Phase 3.
- Phase 1 mock-only (Principle II): image upload zone is visual affordance only; submit is toast + navigate (no submit-error UI); QuillJS rich-text editor is a real functional widget.
