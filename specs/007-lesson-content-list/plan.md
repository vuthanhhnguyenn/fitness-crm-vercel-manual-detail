# Implementation Plan: FR-001 Lesson Content Master List & Search (D-02)

**Branch**: `007-lesson-content-list` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-lesson-content-list/spec.md`

## Summary

Build the Phase 1 Lesson Content Management list/search page (`/lessons`) with three line-style
tabs — Studio, Personal training, and Body care — each rendering its own list table. The toolbar
provides active text search (by name or ID, partial match), expandable detailed filters
(lesson category / category / brand / status), an "Include deleted" toggle, and "Clear all".
Column-header controls perform real ascending/descending sorting, rows navigate to a lesson
detail route, and a header action navigates to lesson creation. Loading uses a skeleton, and
failures show an error state.

Technical approach: a Next.js 16 App Router page under `src/app/(private)/lessons/`, with URL
state via `nuqs`, server state via TanStack React Query option-factories, the shared
`DataTable` + `TablePagination` + `DataStateBoundary` components, and Phase 1 mock Route
Handlers under `src/app/api/crm/` backed by an enriched `_mock-db.ts` collection. No backend is
required for Phase 1; the React Query hook signatures match what Phase 2 will consume.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, `no-explicit-any`); Node.js ≥ 24.0.0
**Primary Dependencies**: Next.js 16 (App Router), React, TanStack React Query, nuqs,
react-hook-form + Zod, shadcn/ui (Radix), lucide-react, Tailwind CSS v4, date-fns v4
**Storage**: Phase 1 in-memory mock DB (`src/app/api/_mock-db.ts`); Phase 2 = REST API via generated client
**Testing**: Contract tests for each mock route (happy path + ≥1 error path); `tsc --noEmit`; ESLint
**Target Platform**: CRM web app (desktop browsers), min viewport width 768 px
**Project Type**: Web application (Next.js frontend with colocated mock API route handlers)
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 250 kB gzip per route
**Constraints**: Phase 1 mock-only (Principle II); RSC default, `'use client'` only where needed;
client-side dataset is small (lesson masters) so list may filter/sort client-side or via mock query params
**Scale/Scope**: 1 list page, 3 tabs, 2 table shapes (lesson / personal plan), 2–3 mock endpoints,
seed data covering ≥ 3 stores and ≥ 3 plans (Principle II seeding rule)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                     | Gate                                                                                                   | Status             | Notes                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------------------------- |
| I. Spec-First                 | Spec traces to approved D-02 requirement + prototype                                                   | PASS               | Spec maps every FR to `D-02.md` / `lesson.tsx` via traceability matrix                        |
| II. Two-Phase (Mock now)      | Phase 1 uses mock Route Handlers + `_mock-db.ts`; ≥3 stores & ≥3 plans seeded                          | PASS (with action) | Existing `db.lessons` is too thin; plan enriches the mock collection + schema + route         |
| III. Strict Type Safety       | No `any`; Zod schemas in `_schemas/`; types reusable; `tsc --noEmit` clean                             | PASS               | Mock query/response Zod schemas in `src/app/api/_schemas/`; client types from `types.gen.ts`  |
| IV. Component Purity          | Only `ui/` + `common/` components; design tokens; lucide icons; DataTable; DataStateBoundary; skeleton | PASS               | Uses `DataTable`, `TablePagination`, `DataStateBoundary`, shadcn `Tabs/Select/Input/Checkbox` |
| V. React Query / no raw fetch | Hooks use generated option-factories; query keys from factories; URL state via nuqs; no global store   | PASS               | nuqs for tab/search/sort/filter/page; React Query for data; no Redux/Zustand/Jotai            |
| VI. Performance Budget        | RSC default, `'use client'` minimal, `next/image`, dynamic import >30 kB                               | PASS               | Interactive page is a client island under a server route; no large subtrees                   |

**Initial gate result**: PASS. No violations requiring Complexity Tracking. One required build
action carried into Phase 1 (enrich mock lesson data); not a constitution violation.

**Post-design re-check (after Phase 1)**: PASS — design keeps all data access behind React Query
hooks against mock routes, reuses shared components only, and introduces no new primitives, no
`any`, and no global state store. See `research.md` decisions D1–D8.

## Project Structure

### Documentation (this feature)

```text
specs/007-lesson-content-list/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (mock API contracts)
│   ├── get-lesson-contents.md
│   └── get-personal-plans.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/app/(private)/lessons/
├── page.tsx                          # Server route + <Suspense> wrapper around client content
├── _components/
│   ├── lessons-page-content.tsx      # 'use client' — tabs + toolbar orchestration
│   ├── lesson-table.tsx              # Studio/Body care list table (DataTable)
│   ├── personal-training-table.tsx   # Personal plan list table (DataTable)
│   ├── lesson-table-columns.tsx      # ColumnDef[] for studio/bodycare (sortable headers)
│   ├── personal-table-columns.tsx    # ColumnDef[] for personal plans
│   ├── lessons-toolbar.tsx           # Search input + detailed-filter toggle
│   └── lessons-filters.tsx           # Expandable selects + include-deleted + clear all
├── _hooks/
│   └── use-lessons-filters.ts        # nuqs state (tab/search/sort/filters/include_deleted/page)
└── _constants/
    └── constants.ts                  # tab keys, status/brand/category label maps, page size

src/app/api/crm/lesson-contents/route.ts      # NEW mock GET (studio + bodycare list)
src/app/api/crm/personal-plans/route.ts       # NEW mock GET (personal plans list)
src/app/api/_schemas/lesson-content.schema.ts # NEW Zod schemas (query + response)
src/app/api/_mock-db.ts                        # ENRICH: lessonContents + personalPlans collections
src/app/api/_routes/index.ts                   # ENRICH: import the two new route files

src/lib/api/                          # REGENERATED via npm run generate-client (types.gen.ts, react-query.gen.ts)
src/lib/routes/routes.config.ts       # AUTO-generated when /lessons page is added
```

**Structure Decision**: Single Next.js App Router web app. The feature page is a colocated
route under `src/app/(private)/lessons/` following the canonical `members/` list-page pattern
(Suspense + nuqs filter hook + DataTable + TablePagination, with `_components/`, `_hooks/`,
`_constants/` colocation). Phase 1 data is served by new mock Route Handlers under
`src/app/api/crm/` and an enriched `_mock-db.ts`, consumed through generated React Query
option-factories — identical hook shape to Phase 2. No local view types are created; components
consume the generated types directly from `src/lib/api/types.gen.ts` after `generate-client`.

## Complexity Tracking

> No constitution violations require justification. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
