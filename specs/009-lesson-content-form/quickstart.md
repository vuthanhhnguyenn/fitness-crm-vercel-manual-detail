# Quickstart: Lesson Content Master Form (009)

> Build order for implementation. Each step is blocked on the previous one.

## Build Order

### Step 1 — Route Registration

- Add `/lessons/[id]/edit` and `/lessons/[id]/duplicate` to `src/lib/routes/routes.config.ts`.
- Add both routes to `PAGE_PERMISSIONS` in `src/lib/permission.config.ts` (edit → `LessonContentsEdit`, duplicate → `LessonContentsCreate`).
- **Depends on**: Nothing.
- **Verification**: `npm run typecheck`.

### Step 2 — Mock API: Zod Schemas

- Create `src/app/api/_schemas/lesson-content-form.schema.ts` with `CreateLessonContentSchema`, `UpdateLessonContentSchema`, and response schemas.
- Reuse enums from `lesson-content.schema.ts`.
- **Depends on**: Nothing.
- **Verification**: `tsc --noEmit` passes.

### Step 3 — Mock API: Route Handlers

- Enrich `src/app/api/crm/lesson-contents/route.ts` with `POST` handler.
- Enrich `src/app/api/crm/lesson-contents/[id]/route.ts` with `PATCH` handler.
- Ensure they're auto-loaded via `src/app/api/_routes/index.ts`.
- **Depends on**: Step 2 (schemas).
- **Verification**: `npm run dev` + curl both routes.

### Step 4 — Mock DB: Create/Update Methods

- Add `db.lessonContents.create()` and `db.lessonContents.update()` to `_mock-db.ts`.
- `create()`: generate new ID, insert into `_rows`, return full detail.
- `update()`: merge fields, return updated detail.
- **Depends on**: Step 2 (shape of payload matches schema).
- **Verification**: Step 3 routes return correct data.

### Step 5a — Install QuillJS

- Run `npm install react-quill-new` (maintained React wrapper for QuillJS v2).
- Import `react-quill-new` stylesheet: add `import 'react-quill-new/dist/quill.snow.css';` to the description component.
- **Depends on**: Nothing.
- **Verification**: QuillJS editor renders with full toolbar in the form.

### Step 5b — Generate Client

- Run `npm run generate-client` to regenerate `types.gen.ts` and `@tanstack/react-query.gen.ts`.
- Verify new option factories exist for `postCrmLessonContents` and `patchCrmLessonContentsById`.
- **Depends on**: Step 3 (routes registered with `registerRoute()`).
- **Verification**: Import the new factories in a temporary file.

### Step 6 — Client Schema

- Create `src/app/(private)/lessons/_schemas/lesson-form.schema.ts` with `LessonFormSchema` (client-side validation) and `LessonFormValues` type.
- Include conditional perUseFee validation via `superRefine`.
- **Depends on**: Nothing.
- **Verification**: `tsc --noEmit` passes.

### Step 7 — Form Sub-components

- Create `src/app/(private)/lessons/_components/lesson-form/` directory.
- Implement each section as a sub-component using `useFormContext`:
  - `lesson-form-basic-info.tsx` — Input/Select fields + conditional perUseFee + dynamic duration.
  - `lesson-form-restrictions.tsx` — Popover + Command multi-select + Badge list.
  - `lesson-form-images.tsx` — Sortable grid + upload zone (visual only).
  - `lesson-form-description.tsx` — QuillJS rich-text editor (`react-quill-new`).
  - `lesson-form-notes.tsx` — Textarea.
  - `lesson-form-status.tsx` — Switch + Badge + helper text.
  - `lesson-form-skeleton.tsx` — Skeleton loading state.
  - `lesson-form-confirm-dialog.tsx` — AlertDialog with mode-dependent labels.
- **Depends on**: Step 6 (schema types).
- **Verification**: Each sub-component renders in isolation.

### Step 8 — Main Form Component

- Create `src/app/(private)/lessons/_components/lesson-form/lesson-form.tsx`.
- Accepts `mode` prop and optional `defaultValues`.
- Orchestrates all 6 sections + edit-mode warning banner + footer actions + confirmation dialog.
- Uses `useMutation` with generated option factories for submit.
- **Depends on**: Step 5 (option factories) + Step 7 (sub-components).
- **Verification**: Form renders with correct labels for each mode.

### Step 9 — Page Files

- **Replace** `src/app/(private)/lessons/create/page.tsx` — render `<LessonForm mode="create" />`.
- **Create** `src/app/(private)/lessons/[id]/edit/page.tsx` — fetch detail via `useQuery(getCrmLessonContentsByIdOptions)` → show skeleton while loading → render `<LessonForm mode="edit" />`.
- **Create** `src/app/(private)/lessons/[id]/duplicate/page.tsx` — fetch detail via `useQuery` → append "（コピー）" to name → render `<LessonForm mode="duplicate" />`.
- **Depends on**: Step 8 (LessonForm component) + Step 1 (route registration).
- **Verification**: Navigate to each route; verify mode-specific behaviour.

### Step 10 — Update Detail Page Navigation

- Update `src/app/(private)/lessons/[id]/_components/lesson-detail-header-actions.tsx`:
  - Edit: `navigate('/lessons/[id]/edit', detail.id)` (already using this pattern).
  - Duplicate: `navigate('/lessons/[id]/duplicate', detail.id)` (was `/lessons/create?copyFrom=...`).
- **Depends on**: Step 1 (routes registered) + Step 9 (pages exist).
- **Verification**: Click Edit/Duplicate from detail screen → correct form page with pre-filled data.

## Verification Checklist

- [ ] `npm run typecheck` passes (tsc --noEmit)
- [ ] `npm run lint` passes (ESLint zero errors)
- [ ] All three routes render with correct mode-specific labels
- [ ] Duration options switch by lesson type
- [ ] Per-use fee field shows/hides by pricing type
- [ ] Required-field validation blocks submit with inline errors + footer summary
- [ ] Edit-mode warning banner visible only in edit mode
- [ ] Confirmation dialog shows correct mode-dependent wording
- [ ] Success toast shown after confirm → navigates to lesson list
- [ ] Skeleton shown during edit/duplicate pre-fill fetch
- [ ] Cancel/back navigates without committing
- [ ] Contract tests for POST + PATCH routes pass
