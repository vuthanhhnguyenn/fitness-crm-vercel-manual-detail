# Implementation Plan: D-03 Studio Management — FR-003 Studio Detail Display

**Branch**: `011-studio-detail-page` | **Date**: 2026-07-02 | **Spec**: [specs/011-studio-detail-page/spec.md](specs/011-studio-detail-page/spec.md)
**Input**: Feature specification from `/specs/011-studio-detail-page/spec.md`

## Summary

Implement the Studio Detail page for D-03 FR-003 as a Phase 1, mock-backed, read-only detail flow that users reach from the studio list. The page must render full studio context (header badges, basic info, linked lessons, images, layout preview/not-configured state, utilization summary), enforce authority-based action visibility for Edit/Delete, and block destructive delete confirmation when the studio is already linked to lessons. The design keeps Change History tab title visible with empty content in Phase 1 and excludes FR-004/FR-005/FR-006 operational flows beyond required entry points.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `no-explicit-any`)  
**Primary Dependencies**: Next.js 16 (App Router), React 19, TanStack React Query 5, shadcn/ui (Radix), lucide-react, Tailwind CSS v4, date-fns v4, react-hook-form + Zod (for shared schema patterns)  
**Storage**: Phase 1 in-memory mock DB (`src/app/api/_mock-db.ts`); Phase 2 generated REST API client in `src/lib/api/`  
**Testing**: ESLint + TypeScript (`tsc --noEmit`), contract tests for new detail route (happy + error paths), scenario checks for role/action matrix  
**Target Platform**: Web CRM (desktop-focused, minimum supported viewport width 768px)
**Project Type**: Frontend web application with co-located mock API routes  
**Performance Goals**: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, detail load state visible immediately (skeleton first paint)  
**Constraints**: Phase 1 mock-first delivery, no direct raw fetch in components, role-based visibility must match D-03 matrix, Change History content intentionally empty in Phase 1  
**Scale/Scope**: One detail route + one detail API contract; ~6 major page blocks (basic info, linked lessons, images, layout, utilization, actions/dialog)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Gate                                                                                            | Status | Notes                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| I. Spec-First                         | Feature is traceable to approved D-03 FR-003 spec and prototype-derived structure               | PASS   | `spec.md` is complete with clarified Phase 1 scope and role constraints |
| II. Two-Phase Development             | Phase 1 uses mock DB + route handlers; Phase 2 remains generated client integration             | PASS   | No direct backend dependency for initial delivery                       |
| III. Strict Type Safety               | Zod-first schema boundary, no `any`, strict TypeScript preserved                                | PASS   | Data model defines typed contract for route and UI consumption          |
| IV. Component Purity & UI Consistency | Reuse existing `ui/` and `common/` primitives, token-based styling, no new primitives required  | PASS   | Detail composition aligns with existing app patterns                    |
| V. React Query / No Raw Fetch         | Detail page consumes data through React Query patterns; no direct `fetch` in feature components | PASS   | Contract and quickstart enforce route+hook integration path             |
| VI. Performance Budget                | Skeleton loading, conditional blocks, and read-only rendering fit budget constraints            | PASS   | No heavy new runtime dependencies or large client-only subsystems       |

**Initial gate result**: PASS — no constitutional violations.

**Post-design re-check**: PASS — research + data model + contract design remain aligned with all six principles.

## Project Structure

### Documentation (this feature)

```text
specs/011-studio-detail-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── get-studio-detail.md
├── checklists/
│   └── requirements.md
└── tasks.md                    # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── crm/
│   │   │   └── studios/
│   │   │       └── [id]/
│   │   │           └── route.ts                   # NEW: studio detail route (Phase 1 mock)
│   │   ├── _schemas/
│   │   │   └── studio-detail.schema.ts            # NEW: shared request/response schemas
│   │   └── _mock-db.ts                            # UPDATE: detail records, linked lessons, layout state
│   └── (private)/
│       └── studios/
│           └── [id]/
│               ├── page.tsx                       # NEW/UPDATE: detail screen orchestrator
│               └── _components/                   # NEW: cards/dialog/skeleton/action components
├── components/
│   └── ...                                        # Existing shared primitives reused
├── lib/
│   └── api/                                       # Phase 2 generated client target (no manual edits)
│                                                   # Generate only after Phase 1 mock API route is completed:
│                                                   # 1) generate openapi.json  2) run generate-api
└── ...
```

**Structure Decision**: Use the existing single Next.js App Router project structure with feature-local detail components and a single mock detail endpoint for Phase 1. Keep schema and mock route boundaries in `src/app/api/` to ensure easy migration to generated client hooks in Phase 2.

**Implementation Order Note**: After finishing the Phase 1 mock API (`src/app/api/crm/studios/[id]/route.ts` and related schema/mock-db updates), immediately run OpenAPI generation to produce `openapi.json`, then run `generate-api` so `src/lib/api/` is refreshed from the latest contract.

## Phase 0: Research & Unknown Resolution

Research completed in [specs/011-studio-detail-page/research.md](specs/011-studio-detail-page/research.md).

Resolved items:

- Zero linked lessons behavior: keep card visible with explicit empty-state message.
- Loading/not-found/error states: skeleton + not-found + retryable error pattern.
- Layout fallback state: explicit `not_configured` branch with configure navigation.
- Delete guard source: `assigned_lesson_count` in detail payload.

## Phase 1: Design & Contracts Output

Artifacts generated:

- [specs/011-studio-detail-page/data-model.md](specs/011-studio-detail-page/data-model.md)
- [specs/011-studio-detail-page/contracts/get-studio-detail.md](specs/011-studio-detail-page/contracts/get-studio-detail.md)
- [specs/011-studio-detail-page/quickstart.md](specs/011-studio-detail-page/quickstart.md)

Design highlights:

- Canonical `StudioDetail` aggregate response with linked lessons, images, layout, and utilization.
- Role matrix retained as authoritative rule for header actions.
- Delete confirmation guard supported without implementing full FR-005 destructive workflow.
- Change History tab explicitly kept title-only (empty content) in Phase 1.

## Complexity Tracking

No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (none)    | N/A        | N/A                                  |
