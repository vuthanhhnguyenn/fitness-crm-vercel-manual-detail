# Research: Lesson Content Master Form (009)

> **Phase 0 output** — resolves all `NEEDS CLARIFICATION` items from Technical Context.

## Decisions

### D1. Form Component Architecture

**Decision**: A single `LessonForm` client component with a `mode` discriminated union prop.

```ts
type LessonFormMode = 'create' | 'edit' | 'duplicate';
```

- Uses `react-hook-form` + `zod` via `@hookform/resolvers/zod` (matches constitution Principle III / existing brand-form-sheet pattern).
- `mode` drives: page title, submit button label, confirmation dialog title/wording, success toast message, warning banner visibility, pre-fill behaviour.
- **Duplicate** is a distinct mode (not a create sub-case) so the component has a single source of truth for mode-dependent rendering. The name pre-fill value comes from the source master's detail (fetched via `GET /api/crm/lesson-contents/{id}`) — the `name` query param is NOT used (unlike the current prototype); instead the "（コピー）" suffix is appended client-side after fetching the detail, ensuring all fields are faithfully copied.
- **Rationale**: The user explicitly asked for a single component with three modes. The prototype's query-param approach (`copyFrom` + `name`) loses non-name fields (restrictions, images, description, etc.). Fetching the full detail and appending the suffix client-side is more correct and aligns with how edit pre-fill works.

**Alternative considered**: Prototype approach — duplicate as create mode with `copyFrom` & `name` query params. Rejected because it cannot pre-fill non-name fields without an additional fetch anyway.

---

### D2. Page Routes

**Decision**: Three Next.js App Router page files, each passing the appropriate `mode` and `defaultValues` to `LessonForm`:

| Route                     | Mode        | Default Values                                                                     | Page Title                                            |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `/lessons/create`         | `create`    | Empty (all defaults)                                                               | "新規レッスン作成"                                    |
| `/lessons/[id]/edit`      | `edit`      | Fetched from `GET /api/crm/lesson-contents/{id}`                                   | "スタジオレッスン編集" / "パーソナルトレーニング編集" |
| `/lessons/[id]/duplicate` | `duplicate` | Fetched from `GET /api/crm/lesson-contents/{id}` (name suffixed with "（コピー）") | "新規レッスン作成"                                    |

**Duplicate differs from Edit**:

- Duplicate uses create-mode labels (title, submit, confirm dialog wording, success toast).
- Duplicate clears the `id` field so submission goes to `POST` (create), not `PATCH` (update).
- Name gets "（コピー）" suffix appended client-side in the page file.

**Route registration**: Add three entries to `src/lib/routes/routes.config.ts`.

**Rationale**: Colocation keeps each page thin (~15 lines) — just `useParams` + `useQuery` (for edit/duplicate) → render `<LessonForm>`.

---

### D3. Form Sections Layout

**Decision**: The form body has 6 `Card` sections, each rendered as a sub-component with `useFormContext`:

| #   | Section                 | Sub-component            | Key Fields                                                |
| --- | ----------------------- | ------------------------ | --------------------------------------------------------- |
| 1   | 基本情報 (Basic Info)   | `LessonFormBasicInfo`    | name, lessonType, brand, duration, pricingType, perUseFee |
| 2   | 予約制限 (Restrictions) | `LessonFormRestrictions` | restrictedMainContracts[], restrictedOptionContracts[]    |
| 3   | レッスン画像 (Images)   | `LessonFormImages`       | images[] (add/delete/reorder drag)                        |
| 4   | 説明 (Description)      | `LessonFormDescription`  | description (QuillJS rich-text editor)                    |
| 5   | 備考 (Notes)            | `LessonFormNotes`        | notes                                                     |
| 6   | ステータス (Status)     | `LessonFormStatus`       | status (active/inactive switch)                           |

**Conditional rendering**:

- `perUseFee` field visible only when `pricingType === 'per_use'` (watched via `useWatch`).
- Duration options filtered by `lessonType`: personal → 30/60; studio/bodycare → 15/30/45/50/60/90/120.
- Description section heading changes by lessonType: personal → "トレーニング内容説明"; studio/bodycare → "レッスン内容説明".
- Edit-mode warning banner visible only when `mode === 'edit'`.

---

### D4. Zod Schemas

**Decision**: Two schemas:

1. **`lesson-form.schema.ts`** (client-side, in `lessons/_schemas/`):
   - Full form shape including conditional validation (perUseFee required only when pricingType === 'per_use').
   - Uses Zod's `superRefine` or `discriminatedUnion` for the conditional field.
   - Exports `LessonFormValues` type.

2. **`lesson-content-form.schema.ts`** (server-side, in `_schemas/`):
   - `CreateLessonContentSchema` — payload for `POST /api/crm/lesson-contents`.
   - `UpdateLessonContentSchema` — payload for `PATCH /api/crm/lesson-contents/{id}`.
   - Response schemas for the mock routes.
   - Reuses enums from `lesson-content.schema.ts` (`LessonBrandSchema`, `LessonContentStatusSchema`, `LessonKindSchema` for lessonType).

**Rationale**: Constitution Principle III mandates Zod schemas in `_schemas/`, with client-side validation reusing the same shape.

---

### D5. Mock API Routes

**Decision**: Add two new route handlers:

| Route                           | Method  | Purpose                | Request Schema              | Response Schema                               |
| ------------------------------- | ------- | ---------------------- | --------------------------- | --------------------------------------------- |
| `/api/crm/lesson-contents`      | `POST`  | Create new master      | `CreateLessonContentSchema` | `CreateLessonContentResponse` + toast message |
| `/api/crm/lesson-contents/{id}` | `PATCH` | Update existing master | `UpdateLessonContentSchema` | `UpdateLessonContentResponse` + toast message |

**Mock DB enrichment**: Add `db.lessonContents.create()` and `db.lessonContents.update()` methods to `_mock-db.ts`.

**Rationale**: Consistent with existing locker pattern (`POST /api/crm/lockers`, `PATCH /api/crm/lockers/{id}`). Required so `npm run generate-client` generates the option factories.

---

### D6. React Query Hooks

**Decision**: Use auto-generated option factories from `npm run generate-client`:

- `getCrmLessonContentsByIdOptions` — fetch source master for edit/duplicate pre-fill (already exists).
- `getCrmLessonContentsCreateOptions` / `getCrmLessonContentsUpdateOptions` — generated after registering POST/PATCH routes.

No direct `fetch` calls. Form submission uses `useMutation` wrapping the generated options.

---

### D7. Page-level Loading (Skeleton)

**Decision**:

- **Create mode**: Renders immediately (no loading).
- **Edit/Duplicate mode**: Shows `<LessonFormSkeleton />` while `useQuery` fetches the source master.

Matches the `007`/`008` skeleton pattern (`DataStateBoundary`).

---

### D8. Submit Behaviour (Phase 1)

**Decision**:

- Validation: Zod schema + `form.handleSubmit`. Inline `"{項目名}は必須です。"` per-field errors + footer summary on validation failure.
- On valid submit: open confirmation `AlertDialog`.
- On confirm: call `useMutation` → show success toast → `router.push(navigate('/lessons'))`.
- No dedicated submit-error UI (loading spinner on button only). Phase 1 UI only — consistent with spec Out of Scope note.

---

### D9. Images & Rich Text (Phase 1)

**Decision**:

- **Image upload zone**: visual drag-and-drop zone only, with "画像を追加" button. No actual upload binding.
- **Image grid**: sortable (drag handles), removable (trash button), first-image "メイン" marker.
- **Rich-text editor**: QuillJS via `react-quill-new` — a maintained React wrapper for QuillJS v2. The editor provides a full rich-text toolbar (headings, bold, italic, underline, strikethrough, lists) out of the box. The raw HTML/Delta output is stored in the `description` form field as a string.
- Install command: `npm install react-quill-new`
- Image upload zone is a visual affordance per spec Section "Out of Scope for Phase 1"; the rich-text editor is a real functional widget in Phase 1.

---

### D10. Confirmation Dialog

**Decision**: `AlertDialog` component with:

- Title varies by mode: "以下の内容で登録します。よろしいですか？" (create/duplicate) / "この内容で変更を保存しますか？" (edit).
- Body summarizes: レッスン区分, レッスン名, 料金種別, ステータス (有効/無効).
- Actions: "キャンセル" (outline → close dialog) + "この内容で登録する" / "この内容で保存する" (primary → submit).
- On confirm: close dialog → toast → navigate to lesson list.

---

### D11. Permission Gating

**Decision**: Entry-point gating only (per FR-009-P1-01):

- `/lessons/create` already gated via `PAGE_PERMISSIONS` → `LessonContentsCreate`.
- `/lessons/[id]/edit` new route → add to `PAGE_PERMISSIONS` → `LessonContentsEdit`.
- `/lessons/[id]/duplicate` new route → add to `PAGE_PERMISSIONS` → `LessonContentsCreate`.
- List-screen "新規レッスン作成" button: wrapped in `RoleGatedButton allowedRoles={["Headquarter", "System"]}` (matching detail-screen entry points).
- The form component itself is ungated.

---

### D12. Navigation Updates

**Decision**: Update `lesson-detail-header-actions.tsx` to navigate:

- Edit: `navigate('/lessons/[id]/edit', detail.id)` (after registering the route).
- Duplicate: `navigate('/lessons/[id]/duplicate', detail.id)` (after registering the route) instead of the current `/lessons/create?copyFrom=...`.

**Rationale**: Consistent 3-route architecture. The detail screen triggers edit/duplicate with the source master's `id`; the page files handle the fetch.

---

### D13. Route Registration

**Decision**: Add to `src/lib/routes/routes.config.ts`:

```ts
'/lessons/[id]/edit': { router: (id) => `/lessons/${id}/edit`, pattern: '/lessons/:id/edit' }
'/lessons/[id]/duplicate': { router: (id) => `/lessons/${id}/duplicate`, pattern: '/lessons/:id/duplicate' }
```

Both marked `private: true`.

---

### D14. Store Scoping

**Decision**: The form does NOT include a store selector. The new master is created for the user's current store (from `useAuthUser()`). Edit preserves the existing `store_id`. Consistent with the spec and the existing detail pattern.

---

## References

- Spec: `specs/009-lesson-content-form/spec.md`
- Existing form pattern: `lockers/_components/locker-form.tsx` (mode prop, sub-section composition)
- Existing form schema pattern: `brands/_schemas/brand-form.schema.ts` (Zod + react-hook-form)
- Existing mock route pattern: `lockers/route.ts` (POST create) + `lockers/[id]/route.ts` (PATCH update)
- Existing mock DB: `_mock-db.ts` (lesson contents, personal plans, lesson details)
- Parent spec: `specs/008-lesson-content-detail/plan.md` (skeleton + DataStateBoundary pattern, route design)
- Route config: `src/lib/routes/routes.config.ts`
- Permission config: `src/lib/permission.config.ts`
