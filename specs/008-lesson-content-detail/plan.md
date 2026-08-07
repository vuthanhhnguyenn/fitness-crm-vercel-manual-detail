# Implementation Plan: FR-003 Lesson Content Master Detail Display (D-02)

**Branch**: `008-lesson-content-detail` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-lesson-content-detail/spec.md`

## Summary

Build the Phase 1 Lesson Content Management **detail screen** at `/lessons/[id]` — a read-only
master-detail view that today is only a "準備中" placeholder. The screen renders a `PageHeader`
(back link, lesson name, Active/inactive status badge, lesson-type badge, and role-gated Delete /
Duplicate / Edit actions), then a `Tabs` body with a "基本情報" (Basic Info) tab and a role-gated
"変更履歴" (Change History) tab. The Basic Info tab is a two-column layout: an image gallery + a
description card on the left, and a `StatusCard` (with a role-gated 無効化/有効化 lifecycle action),
basic-info card, restriction & pricing card, recent-schedule card (+ a "show all" schedule `Sheet`
with recurring-pattern summary and per-session list), and an internal-memo card on the right.
Deactivate and Delete are unified as a single soft-delete lifecycle action and open confirmation
`AlertDialog`s (reason required; delete blocked while the master is in use). Loading uses a skeleton
and a not-found/error state mirrors the `007-lesson-content-list` decision.

Technical approach: a `'use client'` detail page under `src/app/(private)/lessons/[id]/` reusing the
canonical detail pattern from `lockers/[id]/page.tsx` (React Query `useQuery` → skeleton → header +
`Tabs`, with `_components/` colocation). Server state comes from new Phase 1 mock Route Handlers
(`GET /api/crm/lesson-contents/{id}`, `.../schedules`, `.../history`) backed by `_mock-db.ts`,
consumed through generated React Query option-factories — identical hook shapes to Phase 2. Action
gating uses a new **D-02 Lesson Content Management** permission set (`LessonContentsView/Create/Edit/
Delete/HistoryView`) via `RoleGatedButton requiredPermission={…}` + `useAuthUser()` — the existing
`Lessons*` permissions are D-01 and are not reused. URL state (active tab, `from` context) uses
`nuqs`/search params. No backend is required for Phase 1.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, `no-explicit-any`); Node.js ≥ 24.0.0
**Primary Dependencies**: Next.js 16 (App Router), React, TanStack React Query, nuqs,
shadcn/ui (Radix: Tabs, Card, Sheet, AlertDialog, Badge, Tooltip), lucide-react, Tailwind CSS v4,
`next/image`, date-fns v4
**Storage**: Phase 1 in-memory mock DB (`src/app/api/_mock-db.ts`); Phase 2 = REST API via generated client
**Testing**: Contract tests for each new mock route (happy path + ≥1 error/not-found path); `tsc --noEmit`; ESLint
**Target Platform**: CRM web app (desktop browsers), min viewport width 768 px
**Project Type**: Web application (Next.js frontend with colocated mock API route handlers)
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 250 kB gzip per route
**Constraints**: Phase 1 mock-only (Principle II); detail page is a client island; the schedule `Sheet`
and the change-history tab fetch lazily (only when opened / when role permits); `next/image` for all
gallery images; all confirmation dialogs close without a backend write in Phase 1 (no persistence)
**Scale/Scope**: 1 detail route, 2 tabs, ~8 cards/sections, 1 schedule sheet, 2 alert dialogs,
3 mock endpoints (detail / schedules / history), seed detail data for ≥ 3 stores incl. studio +
personal + an inactive/soft-deleted record and an in-use (usage_count > 0) record

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                     | Gate                                                                                                        | Status             | Notes                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| I. Spec-First                 | Spec traces to approved D-02 requirement + prototype                                                        | PASS               | Spec maps every FR-003-P1-\* to `D-02.md` / `lesson-detail.tsx` via the traceability matrix                              |
| II. Two-Phase (Mock now)      | Phase 1 uses mock Route Handlers + `_mock-db.ts`; seed ≥ 3 stores incl. active/inactive/in-use records      | PASS (with action) | Reuses `db.lessonContents` / `db.personalPlans` but enriches them with detail fields + adds detail collections           |
| III. Strict Type Safety       | No `any`; Zod schemas in `_schemas/`; types reusable; `tsc --noEmit` clean                                  | PASS               | New detail/schedule/history Zod schemas in `_schemas/`; client types from regenerated `types.gen.ts`                     |
| IV. Component Purity          | Only `ui/` + `common/` components; design tokens; lucide icons; `DataStateBoundary`; skeleton; `next/image` | PASS               | Reuses `PageHeader`, `BackLink`/`BreadcrumbNav`, `StatusCard`, `RoleGatedButton`, `Card`, `Tabs`, `Sheet`, `AlertDialog` |
| V. React Query / no raw fetch | Hooks use generated option-factories; query keys from factories; URL state via nuqs; no global store        | PASS               | `useQuery` for detail/schedules/history; tab + `from` via search params; no Redux/Zustand/Jotai                          |
| VI. Performance Budget        | RSC default, `'use client'` minimal, `next/image`, dynamic import > 30 kB                                   | PASS               | Detail page is one client island; schedule sheet + history tab fetch lazily; gallery uses `next/image`                   |

**Initial gate result**: PASS. No violations requiring Complexity Tracking. One required build
action carried into Phase 1 (enrich the mock lesson collections with detail fields + add detail
endpoints); not a constitution violation.

**Post-design re-check (after Phase 1)**: PASS — design keeps all data access behind React Query
hooks against mock routes, reuses shared/`common` components only, introduces no new primitives, no
`any`, and no global state store. Action gating reuses the existing `RoleGatedButton` + `useAuthUser`
against a newly installed D-02 permission set (Principle III/IV; see research D3). See `research.md`
decisions D1–D10.

## Project Structure

### Documentation (this feature)

```text
specs/008-lesson-content-detail/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (mock API contracts)
│   ├── get-lesson-content-detail.md
│   ├── get-lesson-content-schedules.md
│   └── get-lesson-content-history.md
├── checklists/
│   └── requirements.md  # Pre-existing spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/app/(private)/lessons/[id]/
├── page.tsx                              # REPLACE placeholder: 'use client' detail page (header + Tabs orchestration)
├── _components/
│   ├── lesson-detail-skeleton.tsx        # Loading skeleton (header + two-column cards)
│   ├── lesson-detail-header-actions.tsx  # RoleGatedButton Delete / Duplicate / Edit
│   ├── lesson-info-tab.tsx               # Basic Info tab — two-column layout orchestration
│   ├── lesson-image-gallery.tsx          # Main image + counter + prev/next + thumbnail grid (next/image)
│   ├── lesson-description-card.tsx        # Read-only description
│   ├── lesson-status-card.tsx            # StatusCard wrapper + role-gated 無効化/有効化 action
│   ├── lesson-basic-info-card.tsx        # ID / type / brand / time / pricing rows
│   ├── lesson-restriction-card.tsx       # Restricted contracts/options + per-use fee (or 制限なし)
│   ├── lesson-recent-schedule-card.tsx   # Top-3 schedules + total badge + "全{n}件を表示"
│   ├── lesson-schedule-sheet.tsx         # Sheet: recurring summary (instructor links) + per-session list
│   ├── lesson-internal-memo-card.tsx     # Internal memo (会員には非表示)
│   ├── lesson-history-tab.tsx            # Role-gated change-history Table + total footer
│   ├── lesson-deactivate-dialog.tsx      # AlertDialog: required reason (deactivate / re-activate)
│   └── lesson-delete-dialog.tsx          # AlertDialog: in-use block / unused reason
├── _hooks/
│   └── use-lesson-detail-nav.ts          # nuqs/search-param helpers (active tab, `from` context)
└── _constants/
    └── constants.ts                      # detail-only label maps (status tone, lesson-type badge, history action labels)

src/app/api/crm/lesson-contents/[id]/route.ts            # NEW mock GET (unified detail; looks up studio/bodycare + personal)
src/app/api/crm/lesson-contents/[id]/schedules/route.ts  # NEW mock GET (recurring summary + per-session list + total)
src/app/api/crm/lesson-contents/[id]/history/route.ts    # NEW mock GET (change-history entries + total)
src/app/api/_schemas/lesson-content-detail.schema.ts     # NEW Zod schemas (detail / schedules / history)
src/app/api/_mock-db.ts                                  # ENRICH: lessonContentDetails / schedules / history seed + getById/getDetail
src/app/api/_routes/index.ts                             # ENRICH: import the three new route files

src/types/permission.type.ts          # ADD D-02 Permission enum entries (LessonContents*) — implement step
src/lib/permission.config.ts          # ADD PAGE_PERMISSIONS (/lessons*) + ROLE_PERMISSIONS grants — implement step
src/lib/api/                          # REGENERATED via npm run generate-client (types.gen.ts, react-query.gen.ts)
src/lib/routes/routes.config.ts       # Already contains '/lessons/[id]' (no regeneration needed)
```

> **Permissions (to be added during implementation)**: implement tasks must add the D-02
> `LessonContents*` permission set and its role/page grants to `src/types/permission.type.ts` and
> `src/lib/permission.config.ts` (see research D3 / data-model) — this is the first build step and
> unblocks the `requiredPermission` gating the detail screen relies on. No source files are changed by
> the plan itself.

**Structure Decision**: Single Next.js App Router web app. The detail screen is a colocated route at
`src/app/(private)/lessons/[id]/` (route already registered in `routes.config.ts`), replacing the
existing placeholder `page.tsx`. It follows the canonical `lockers/[id]/page.tsx` detail pattern
(`useQuery` → skeleton → `DataStateBoundary` for error/not-found → `PageHeader` + `Tabs` with
`_components/` colocation). Phase 1 data is served by three new mock Route Handlers under
`src/app/api/crm/lesson-contents/[id]/` and enriched `_mock-db.ts` collections, consumed through
generated React Query option-factories — identical hook shape to Phase 2. Components consume the
generated types directly from `src/lib/api/types.gen.ts` after `generate-client`; no local `.type.ts`
view types are created. Detail-only label maps live in feature-local `_constants/`.

## Complexity Tracking

> No constitution violations require justification. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
