# Implementation Plan: FR-007 予約一覧・詳細表示 (Lesson Reservation)

**Branch**: `006-lesson-reservation-spec` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-lesson-reservation-spec/spec.md`

## Summary

Implement the Phase 1 "Lesson Reservation Detail" screen for FR-007. The plan covers the full reservation detail page navigated from the lesson schedule list (005): session metadata header, color-coded space reservation grid, reservation list table with pagination, reservation statistics sidebar panel, manual reservation dialog (FR-006), reservation cancellation dialog (FR-008), session change dialogs (instructor/time/studio), 3-step lesson cancellation wizard, member limited profile popover (FR-015), and session memo card (FR-011).

Technical approach: add a private App Router page at `/lesson-schedules/[scheduleId]/reservations` backed by Phase 1 mock CRM route handlers, new Zod schemas for reservation entities, OpenAPI registration, generated React Query option factories, URL-backed pagination/filter state via `nuqs`, shared `DataStateBoundary` + skeleton handling, shadcn/ui primitives, `DataTable` for sortable reservation list, and feature-local components/hooks for the space grid, dialogs, and panel layout.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2, Next.js 16.1 App Router, Node.js >=24.0.0
**Primary Dependencies**: TanStack React Query, TanStack Table, nuqs, Zod, shadcn/ui, lucide-react, date-fns v4, sonner
**Storage**: Phase 1 in-memory mock data in `src/app/api/_mock-db.ts`; Phase 2 generated API types/client are outside this plan
**Testing**: `npm run type-check`, `npm run lint`, route-handler contract tests to be added with the repo's API contract-test pattern, and local quickstart verification
**Target Platform**: CRM web app for desktop/tablet staff browsers, minimum viewport width 768 px
**Project Type**: Next.js frontend with local mock API route handlers
**Performance Goals**: Meet constitution budgets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, initial route JS <= 250 kB gzip
**Constraints**: Phase 1 only; no backend dependency; no raw `fetch`; no `any`; no raw colors; use route-safe `navigate`; use `DataStateBoundary`/skeletons for loading; use `DataTable` where filtering/sorting/table behavior is needed; all reservation data changes are in-memory only (no persistence beyond mock DB mutation)
**Scale/Scope**: One private reservation detail page, 6+ mock API groups, seed data for at least 3 stores with multi-studio layouts and instructors, reservation examples covering all 5 statuses, penalty and remaining-count edge cases, and 3 cancel type scenarios

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Gate                                                                                                                                      | Status |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Spec-First                         | Spec and prototype were loaded from `.cache/fitness-crm-ui`; this plan traces to D-01 FR-007 spec and `lesson-reservation.tsx` prototype. | PASS   |
| II. Two-Phase Development             | Plan uses Phase 1 mock route handlers and shared mock DB only; no real backend dependency.                                                | PASS   |
| III. Strict Type Safety               | Plan requires Zod schemas for API boundaries and generated types; no `any`.                                                               | PASS   |
| IV. Component Purity & UI Consistency | Plan uses shadcn/ui, shared common components, design tokens, lucide-react icons, DataTable, DataStateBoundary, and Datepicker patterns.  | PASS   |
| V. Server State via React Query       | Plan uses generated React Query option factories after OpenAPI generation; no raw `fetch` in components/hooks.                            | PASS   |
| VI. Performance Budget                | Plan keeps feature scoped to one route, uses skeletons, avoids heavy new dependencies, and preserves route budget gates.                  | PASS   |

## Project Structure

### Documentation (this feature)

```text
specs/006-lesson-reservation-spec/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── lesson-reservations.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (private)/
│   │   └── lesson-schedules/
│   │       └── [scheduleId]/
│   │           └── reservations/
│   │               ├── page.tsx
│   │               └── _components/
│   │                   ├── reservation-page-layout.tsx
│   │                   ├── lesson-header.tsx
│   │                   ├── space-reservation-grid.tsx
│   │                   ├── grid-legend.tsx
│   │                   ├── reservation-list-table.tsx
│   │                   ├── reservation-list-columns.tsx
│   │                   ├── reservation-stats-panel.tsx
│   │                   ├── add-reservation-dialog.tsx
│   │                   ├── add-reservation-member-search.tsx
│   │                   ├── cancel-reservation-dialog.tsx
│   │                   ├── change-instructor-dialog.tsx
│   │                   ├── change-time-dialog.tsx
│   │                   ├── change-studio-dialog.tsx
│   │                   ├── cancel-lesson-wizard.tsx
│   │                   ├── member-limited-profile-popover.tsx
│   │                   ├── session-memo-card.tsx
│   │                   └── space-cell-popover.tsx
│   └── api/
│       ├── _mock-db.ts
│       ├── _routes/index.ts
│       ├── _schemas/
│       │   └── lesson-reservation.schema.ts
│       └── crm/
│           └── lesson-schedules/
│               └── [scheduleId]/
│                   ├── reservations/
│                   │   ├── route.ts
│                   │   ├── stats/route.ts
│                   │   └── [reservationId]/
│                   │       └── cancel/route.ts
│                   ├── spaces/route.ts
│                   ├── members/
│                   │   └── search/route.ts
│                   ├── instructor/
│                   │   └── change/route.ts
│                   ├── time/
│                   │   └── change/route.ts
│                   ├── studio/
│                   │   └── change/route.ts
│                   ├── cancel/route.ts
│                   └── memos/
│                       ├── route.ts
│                       └── [memoId]/route.ts
├── components/
│   ├── common/
│   │   ├── data-state-boundary/
│   │   ├── data-table/
│   │   ├── searchable-select/
│   │   └── status-card/
│   └── ui/
│       ├── badge
│       ├── dialog
│       ├── popover
│       ├── hover-card
│       ├── pagination
│       ├── tabs
│       ├── progress
│       ├── avatar
│       ├── textarea
│       └── ...
└── lib/
    ├── api/
    │   ├── @tanstack/react-query.gen.ts
    │   └── types.gen.ts
    └── routes/
        ├── routes.config.ts
        └── routes.util.ts
```

**Structure Decision**: Single Next.js application structure. The feature owns only route-local UI components under `src/app/(private)/lesson-schedules/[scheduleId]/reservations/`; mock API routes live under `src/app/api/crm/lesson-schedules/[scheduleId]/`; reusable infrastructure remains in `src/components/common`, `src/components/ui`, and generated route/API files. Reservation entities get their own schema file at `src/app/api/_schemas/lesson-reservation.schema.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Phase 0: Research

Research decisions are recorded in [research.md](./research.md). No unresolved technical clarifications remain.

## Phase 1: Design & Contracts

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/lesson-reservations.openapi.yaml](./contracts/lesson-reservations.openapi.yaml)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

| Principle                             | Status | Notes                                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| I. Spec-First                         | PASS   | Plan artifacts trace to D-01 FR-007 spec, clarified requirements, and source prototype behavior. |
| II. Two-Phase Development             | PASS   | Contracts define Phase 1 mock route handlers; real API integration deferred.                     |
| III. Strict Type Safety               | PASS   | Data model requires Zod schemas and generated API types.                                         |
| IV. Component Purity & UI Consistency | PASS   | Plan uses existing UI primitives, DataTable, DataStateBoundary, lucide-react, and design tokens. |
| V. Server State via React Query       | PASS   | Client data comes from generated React Query option factories after OpenAPI generation.          |
| VI. Performance Budget                | PASS   | No new dependency or route split violation; skeleton states and route budget checks included.    |
