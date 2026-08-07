# Phase 0 Research: Lesson Content Master Detail Display

**Feature**: 008-lesson-content-detail | **Date**: 2026-06-26

This document resolves the unknowns in the Technical Context and records the key design decisions,
each grounded in the constitution, the resolved spec clarifications (Q1–Q5), and existing codebase
patterns. The five spec clarifications are already answered in `spec.md` → `## Clarifications`; this
file records how each is realized in code.

---

## D1. Detail page architecture (client island + useQuery + skeleton + Tabs)

- **Decision**: Replace the existing `/lessons/[id]/page.tsx` placeholder with a `'use client'` detail
  page modeled on `src/app/(private)/lockers/[id]/page.tsx`: read `id` via `useParams`, fetch with a
  React Query `useQuery` option-factory, render a `LessonDetailSkeleton` while `isLoading`, a
  `DataStateBoundary` for `isError`/not-found, then a `PageHeader` + shadcn `Tabs` body.
- **Rationale**: This is the established, constitution-compliant detail pattern (Principle IV/V) and
  keeps the hook signature identical to Phase 2. Reusing it guarantees header, skeleton, and
  error/not-found behavior are consistent with the rest of the CRM.
- **Alternatives considered**: A server component reading params and rendering server-side (rejected —
  the gallery, tabs, sheet, and dialogs are interactive and need client state); building a bespoke
  loading/error UI (rejected — Principle IV mandates `DataStateBoundary` + skeleton reuse).

## D2. Read-only cards & layout (FR-003-P1-01..08, P1-20)

- **Decision**: Compose the Basic Info tab from shadcn `Card` primitives in a two-column flex layout
  (left `flex-1`: gallery + description; right `360px`: status, basic-info, restriction, recent
  schedule, internal memo). Use the shared `common/status-card.tsx` `StatusCard` for the status block
  (it already supports a `tone`, large icon, label, meta, and a single AlertDialog-driven `action`).
  All content is render-only (no inputs) per FR-003-P1-20.
- **Rationale**: `StatusCard` was purpose-built for "詳細画面の右カラム最上部" status hubs with an
  AlertDialog action — exactly the deactivate/re-activate control needed here. Card primitives keep
  the layout token-compliant with no new primitives.
- **Alternatives considered**: A custom status panel (rejected — `StatusCard` already exists and is the
  documented pattern); a grid layout (rejected — flex two-column matches the prototype and other
  CRM detail screens).

## D3. Permission gating (FR-003-P1-17, P1-18, P1-21) — Q1 resolved

- **Decision**: Install a dedicated **D-02 Lesson Content Management** permission set (the existing
  `Lessons*` permissions are D-01 schedule/reservation and must not be reused) and gate the actions via
  `RoleGatedButton requiredPermission={…}` — matching how `Lockers*` / `Options*` features gate
  buttons. New `Permission` enum entries:
  - `LessonContentsView = 'lesson-contents.view'` — list + detail viewing (granted to **all** roles).
  - `LessonContentsCreate = 'lesson-contents.create'` — Duplicate (creation seed) + 新規作成.
  - `LessonContentsEdit = 'lesson-contents.edit'` — Edit action.
  - `LessonContentsDelete = 'lesson-contents.delete'` — Delete **and** Deactivate/re-activate lifecycle
    (unified soft-delete, Q4).
  - `LessonContentsHistoryView = 'lesson-contents.history-view'` — 変更履歴 tab.

  Header actions use `requiredPermission`: Delete → `LessonContentsDelete`, Duplicate →
  `LessonContentsCreate`, Edit → `LessonContentsEdit`. The status-card 無効化/有効化 control uses
  `LessonContentsDelete`. The 変更履歴 tab is rendered only when
  `hasPermission(LessonContentsHistoryView)` via `useAuthUser()`. Non-privileged roles see disabled
  buttons with the built-in `denyTooltip`.

- **Role grants** (in `ROLE_PERMISSIONS`, `permission.config.ts`): `System` holds all (auto via
  `Object.values(Permission)`); `Headquarter` is granted all five; `Manager`, `Staff`, `Trainer`,
  `Observer` are granted **`LessonContentsView` only** — yielding exactly the D-02 authority matrix
  (manage = HQ/System; everyone else view-only). Page access is registered in `PAGE_PERMISSIONS`:
  `/lessons` + `/lessons/:id` → `LessonContentsView`, `/lessons/create` → `LessonContentsCreate`.
- **Rationale**: Fine-grained `requiredPermission` gating is the idiomatic, constitution-aligned
  pattern in this codebase and is more precise than role literals (it survives role re-mapping and is
  centrally auditable in `permission.config.ts`). `RoleGatedButton` already renders the
  disabled-with-tooltip state Q1 requires. Granting `LessonContentsView` to every role preserves the
  already-shipped `007` list-page access while making `/lessons` access explicit.
- **Status**: **To be added during implementation** (not yet in code). Implement tasks must add the
  `Permission` enum entries to `src/types/permission.type.ts` and update `PAGE_PERMISSIONS` +
  `ROLE_PERMISSIONS` in `src/lib/permission.config.ts` before wiring the detail screen's gating.
- **Alternatives considered**: Role-only gating via `allowedRoles={[Headquarter, System]}` (rejected —
  the codebase standard is permission-based, and D-02 had no permission set, so the gap had to be
  filled); a plain `<Button disabled>` (rejected — Q1 requires the gated, tooltip-explained pattern the
  prototype's status-card deactivate button currently lacks).

## D4. Lifecycle: unified soft-delete (deactivate / delete / re-activate) — Q4 resolved

- **Decision**: Model Deactivate and Delete as a single soft-delete lifecycle. The detail response
  carries a `status` of `active | inactive` (inactive == soft-deleted/retained). When `active`, the
  status card shows the Active tone + 無効化する action and the header shows Delete; when `inactive`,
  the status card reflects the inactive/deleted state and shows 有効化する (re-activation) in place of
  deactivate. Both `LessonDeactivateDialog` and `LessonDeleteDialog` are `AlertDialog`s that, in
  Phase 1, only close on confirm (no backend write — see D9).
- **Rationale**: Directly implements the Q4 resolution + FR-003-P1-13/P1-21. Keeping one `status`
  field (no separate `is_deleted` exposure on the detail) matches the "unified soft-delete" model
  while the list screen still filters retained records via its existing `is_deleted`/`status` logic.
- **Alternatives considered**: Separate `deleted` vs `inactive` states on the detail (rejected — Q4
  unifies them); hard delete (rejected — records are retained/soft-deleted).

## D5. Delete guard by usage (FR-003-P1-15, P1-16)

- **Decision**: The detail response includes `usage_count` (number of schedules using the master).
  `LessonDeleteDialog` reads it: when `usage_count > 0` it renders a destructive alert
  ("このレッスンはスケジュールで使用中のため削除できません"), disables the confirm button, and shows a
  link "使用中のスケジュールを確認 ({n}件)" that closes the dialog and navigates to the lesson
  schedule screen; when `usage_count === 0` it shows a required delete-reason textarea and enables the
  confirm button.
- **Rationale**: Implements FR-003-P1-15/16 and SC-007 entirely from a single server-provided count;
  no client-side schedule aggregation needed.
- **Alternatives considered**: Deriving usage from the schedules endpoint (rejected — couples the
  delete dialog to a second fetch; `usage_count` on the detail is simpler and Phase-2-aligned).

## D6. Schedules: recent card + "show all" sheet, instructor links — Q3 resolved

- **Decision**: Add `GET /api/crm/lesson-contents/{id}/schedules` returning a `recurring_patterns[]`
  summary (days, period, studio, `instructors[]`) and a `sessions[]` per-session list (date, time,
  studio, booked, capacity) + `total`. The recent-schedule card shows the top 3 sessions + a total
  badge; the `Sheet` shows the recurring summary and full session list. Each instructor renders as a
  link to the D-04 instructor master, and `instructors[]` is an array to support multiple (n名). Fetch
  the schedules query lazily (enabled only when the sheet opens, or eagerly for the top-3 card — see
  note). Capacity counts are color-coded via tokens (full → destructive, ≥80% → warning, >0 → success,
  0 → muted).
- **Rationale**: Implements FR-003-P1-08/09/09a + Q3. A dedicated endpoint keeps the detail response
  lean and lets the sheet's larger payload load on demand (Principle VI). An `instructors[]` array is
  the minimal shape that satisfies multi-instructor display.
- **Note / open item**: There is **no `/instructors/[id]` page route** in `routes.config.ts` today
  (only the `crm/instructors` mock API). The instructor link target page is therefore **out of scope**
  for this feature (navigation entry point only, per the spec's Out-of-Scope rule); the link will point
  at the D-04 instructor master route once it exists. Recorded as an assumption.
- **Alternatives considered**: Embedding schedules in the detail response (rejected — bloats first
  paint; the full list belongs behind the sheet); plain-text instructor (rejected — Q3 requires links
  - multi-instructor).

## D7. Change history tab (FR-003-P1-18) — lazy + role-gated

- **Decision**: Add `GET /api/crm/lesson-contents/{id}/history` returning `entries[]` (timestamp,
  operator, action, change content) + `total`. Render the tab only when `canViewHistory`; fetch with a
  React Query `useQuery` that is `enabled` only when the tab is active (lazy). Use a shared
  `common/data-table` or shadcn `<Table>` for read-only tabular rendering with a total-count footer.
- **Rationale**: Implements FR-003-P1-18 + SC-005. Lazy + role-gated fetch avoids loading history for
  roles that can't see it and keeps the default (info) tab fast.
- **Alternatives considered**: Always fetching history (rejected — wasteful + leaks for non-privileged
  roles); `DataTable` with sorting/filters (rejected — Principle IV says use plain `<Table>` for simple
  read-only tabular data).

## D8. Navigation, back link, and `from` context (FR-003-P1-19, P1-11, P1-12, P1-10)

- **Decision**: Use the typed `navigate()` helper from `@/lib/routes/routes.util` for all navigation.
  Back link → `/lessons` by default, or the schedule context (`/lesson-schedules`) when the URL carries
  `from=schedule` (read via search params). Edit → `/lessons/[id]/edit` (variant by lesson type — target
  page out of scope, FR-004). Duplicate → `/lessons/create` pre-seeded as a copy (e.g.
  `?copyFrom={id}`; name suffix "（コピー）" handled by the create form, out of scope FR-006). Recent
  schedule row / sheet row → `/lesson-schedules/[id]/reservations`. "スケジュール(を)追加" →
  `/lesson-schedules/create`. Back link uses `common/back-link.tsx` (or `BreadcrumbNav`).
- **Rationale**: Constitution + workspace rule require `navigate()`; raw `router.push` with string
  literals is forbidden. All these route patterns already exist in `routes.config.ts` except the
  edit-form variants (out of scope).
- **Alternatives considered**: Hardcoded hrefs (rejected — type-unsafe, violates routing rule); a
  global "origin" store for the `from` context (rejected — Principle V forbids global stores; search
  param is the correct mechanism).

## D9. Phase 1 mutation behavior (deactivate / re-activate / delete)

- **Decision**: In Phase 1 the deactivate/re-activate/delete confirmation dialogs **do not persist**.
  On confirm they validate the required reason (deactivate / unused-delete), show a `sonner` toast, and
  close — no mock write endpoint is added (spec Out-of-Scope: "Actual persistence … no backend write
  contract is defined"). The reason field uses local component state + simple validation (no full
  react-hook-form needed for a single textarea), respecting the 1000-char textarea limit.
- **Rationale**: The spec explicitly defers persistence to a later phase; adding mock POST/DELETE
  endpoints now would invent a contract the spec doesn't define. Toast-on-confirm gives a working,
  reviewable UX for Phase 1.
- **Alternatives considered**: Adding mock mutation routes + optimistic status flip (rejected — out of
  spec scope; would create a throwaway contract); no feedback on confirm (rejected — poor UX).

## D10. Mock data model — enrich detail collections (Principle II)

- **Decision**: Reuse the existing `db.lessonContents` / `db.personalPlans` list collections and add a
  detail layer: a `getDetail(id)` that returns the full detail shape (images, description, internal
  memo, restriction set, time/pricing, `usage_count`, status, lesson-type), plus seed collections for
  per-master schedules and change history keyed by master id. The unified detail endpoint resolves an
  `id` against both `lessonContents` (LSN-) and `personalPlans` (PLN-). Seed ≥ 3 stores and include:
  a studio record, a personal record, an inactive/soft-deleted record, an in-use (`usage_count > 0`)
  record, and a no-restriction record — to exercise every UI state and edge case.
- **Rationale**: Principle II requires the mock layer to fully exercise the spec locally. A single
  unified detail endpoint matches the single detail screen (lesson-type discriminated row), while
  separate schedule/history endpoints keep payloads lean (D6/D7).
- **Alternatives considered**: Two detail endpoints (lesson-contents/{id} + personal-plans/{id})
  (rejected — one screen, one fetch is cleaner and the ID prefixes disambiguate); embedding everything
  in one mega-response (rejected — violates the lazy-loading budget in D6/D7).

---

## Open items / assumptions carried forward

- **Prototype not checked out**: `.specify/external/ui/src/pages/lesson-detail.tsx` and `D-02.md` are
  empty submodules; layout/field fidelity relies on the spec's traceability matrix and the resolved
  clarifications. Run `git submodule update --init` if exact prototype fidelity is needed during
  implementation.
- **D-04 instructor master page does not exist** (only `crm/instructors` mock API; no `/instructors/[id]`
  route). The instructor link is wired as a navigation entry point; its destination page is out of scope.
- **Edit-form variant routes** (`/lessons/[id]/edit`, edit-personal) and the **create copy seed**
  behavior are FR-004/FR-006 — navigation entry points are in scope; destination pages are not.
- **No persistence** for lifecycle actions in Phase 1 (D9); mock mutation contracts are defined later.

**Result**: All NEEDS CLARIFICATION resolved (Q1–Q5 already answered in spec). Ready for Phase 1 design.
