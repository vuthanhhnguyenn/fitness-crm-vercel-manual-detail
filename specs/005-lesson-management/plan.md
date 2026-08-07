# Implementation Plan: D-01 Lesson Schedule Management

**Branch**: `005-lesson-management` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-lesson-management/spec.md`

## Summary

Implement the Phase 1 "Reservation Management" schedule/list screen for D-01. The plan covers the list/monitoring screen only: store and my-schedule axes, all-store summary mode, KPI cards, date navigation, store/studio/instructor filters, day/weekly/list schedule views, functional sorting, timeline empty state, skeleton loading, and the schedule-change modal flow without validation. Schedule creation and reservation detail screens remain route-entry points only and are deferred to follow-up specs.

Technical approach: add a private App Router page backed by Phase 1 mock CRM route handlers, typed Zod schemas, OpenAPI registration, generated React Query option factories, URL-backed filter/sort state via `nuqs`, shared `DataStateBoundary` skeleton handling, shadcn/ui primitives, `DataTable` for sortable tabular views, and feature-local components/hooks for schedule-specific layouts.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2, Next.js 16.1 App Router, Node.js >=24.0.0  
**Primary Dependencies**: TanStack React Query, TanStack Table, nuqs, Zod, shadcn/ui, lucide-react, date-fns v4, sonner  
**Storage**: Phase 1 in-memory mock data in `src/app/api/_mock-db.ts`; Phase 2 generated API types/client are outside this plan  
**Testing**: `npm run type-check`, `npm run lint`, route-handler contract tests to be added with the repo's API contract-test pattern, and local quickstart verification  
**Target Platform**: CRM web app for desktop/tablet staff browsers, minimum viewport width 768 px  
**Project Type**: Next.js frontend with local mock API route handlers  
**Performance Goals**: Meet constitution budgets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, initial route JS <= 250 kB gzip  
**Constraints**: Phase 1 only; no backend dependency; no raw `fetch`; no `any`; no raw colors; use route-safe `navigate`; use `DataStateBoundary`/skeletons for loading; use `DataTable` where filtering/sorting/table behavior is needed  
**Scale/Scope**: One private list/monitoring screen, three mock API groups, seed data for at least 3 stores, studio and personal lesson examples, alerts, internal/public slots, empty timeline case, and Trainer my-schedule scope

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Gate                                                                                                                                              | Status |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Spec-First                         | Spec and prototype were loaded from `.cache/fitness-crm-ui`; this plan traces to D-01 spec and `lesson-schedule.tsx`.                             | PASS   |
| II. Two-Phase Development             | Plan uses Phase 1 mock route handlers and shared mock DB only; no real backend dependency.                                                        | PASS   |
| III. Strict Type Safety               | Plan requires Zod schemas for API boundaries and generated types; no `any`.                                                                       | PASS   |
| IV. Component Purity & UI Consistency | Plan uses shadcn/ui, shared common components, design tokens, lucide-react icons, DataTable, DataStateBoundary, and Datepicker/Calendar patterns. | PASS   |
| V. Server State via React Query       | Plan uses generated React Query option factories after OpenAPI generation; no raw `fetch` in components/hooks.                                    | PASS   |
| VI. Performance Budget                | Plan keeps feature scoped to one route, uses skeletons, avoids heavy new dependencies, and preserves route budget gates.                          | PASS   |

## Project Structure

### Documentation (this feature)

```text
specs/005-lesson-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── lesson-schedules.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (private)/
│   │   └── lesson-schedules/
│   │       ├── page.tsx
│   │       ├── _components/
│   │       │   ├── area-kpi-summary.tsx
│   │       │   ├── area-summary-table.tsx
│   │       │   ├── kpi-summary.tsx
│   │       │   ├── lesson-schedule-toolbar.tsx
│   │       │   ├── schedule-change-modal.tsx
│   │       │   ├── schedule-list-columns.tsx
│   │       │   ├── schedule-list-view.tsx
│   │       │   ├── timeline-view.tsx
│   │       │   └── weekly-calendar-view.tsx
│   │       ├── _contexts/
│   │       │   └── lesson-schedule-filters-context.tsx
│   │       └── _hooks/
│   │           └── use-lesson-schedule-filters.hook.ts
│   └── api/
│       ├── _mock-db.ts
│       ├── _routes/index.ts
│       ├── _schemas/
│       │   └── lesson-schedule.schema.ts
│       └── crm/
│           └── lesson-schedules/
│               ├── route.ts
│               ├── summary/route.ts
│               ├── stores/summary/route.ts
│               └── [id]/change/route.ts
├── components/
│   ├── common/
│   │   ├── data-state-boundary/
│   │   └── data-table/
│   └── ui/
└── lib/
    ├── api/
    │   ├── @tanstack/react-query.gen.ts
    │   └── types.gen.ts
    └── routes/
        ├── routes.config.ts
        └── routes.util.ts
```

**Structure Decision**: Single Next.js application structure. The feature owns only route-local UI components, context, and hooks under `src/app/(private)/lesson-schedules/`; reusable infrastructure remains in `src/components/common`, `src/components/ui`, `src/app/api`, and generated route/API files.

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
- [contracts/lesson-schedules.openapi.yaml](./contracts/lesson-schedules.openapi.yaml)
- [quickstart.md](./quickstart.md)

## Post-Design Constitution Check

| Principle                             | Status | Notes                                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| I. Spec-First                         | PASS   | Plan artifacts trace to D-01 spec, clarified requirements, and source prototype behavior.        |
| II. Two-Phase Development             | PASS   | Contracts define Phase 1 mock route handlers; real API integration deferred.                     |
| III. Strict Type Safety               | PASS   | Data model requires Zod schemas and generated API types.                                         |
| IV. Component Purity & UI Consistency | PASS   | Plan uses existing UI primitives, DataTable, DataStateBoundary, lucide-react, and design tokens. |
| V. Server State via React Query       | PASS   | Client data comes from generated React Query option factories after OpenAPI generation.          |
| VI. Performance Budget                | PASS   | No new dependency or route split violation; skeleton states and route budget checks included.    |
