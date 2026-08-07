# Implementation Plan: E-03 Training Equipment Management (Phase 1)

**Branch**: `010-training-equipment-phase1` | **Date**: 2026-07-01 | **Spec**: `/specs/010-training-equipment/spec.md`  
**Input**: Feature specification from `/specs/010-training-equipment/spec.md`

## Summary

Implement Phase 1 for E-03 as a complete UI + mock API feature set for list/form/detail pages with role-gated actions, seeded read-only history, status-change reason validation, exercise-link management, and API-driven default ordering (frontend does not enforce initial default sort).

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React/Next.js App Router  
**Primary Dependencies**: Next.js, TanStack Query, shadcn/ui, lucide-react, react-hook-form, zod, sonner  
**Storage**: Mock API in Next.js Route Handlers with seeded data in `src/app/api/_mock-db.ts`  
**Testing**: ESLint, TypeScript (`tsc --noEmit`), route-level contract checks for mock handlers, manual UI scenario validation from spec  
**Target Platform**: Web CRM staff portal (desktop/tablet, min width 768px)  
**Project Type**: Web application (frontend + local mock API in one Next.js app)  
**Performance Goals**: Preserve constitution budgets (LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, initial route JS <= 250kB gzip)  
**Constraints**: Phase 1 only, no Y-08 navigation yet, no bulk status update execution, no CSV export execution, history seed display only  
**Scale/Scope**: One module (E-03), three primary screens, role-based actions, list/detail/form flows with seeded multi-store-compatible mock data

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **I. Spec-First**: PASS - Planning is based on `specs/010-training-equipment/spec.md`, which is grounded to E-03 requirement and referenced UI prototype files.
- **II. Two-Phase Development**: PASS - Plan targets Phase 1 only with mock Route Handlers and mock DB; no backend dependency.
- **III. Strict Type Safety**: PASS - Plan enforces Zod schemas for request/response validation and no `any` in feature code.
- **IV. Component Purity & UI Consistency**: PASS - Plan keeps shadcn/lucide components and existing design tokens, no raw color usage.
- **V. Server State via React Query**: PASS - Plan uses React Query hooks against `/api/crm/...` in Phase 1, preserving Phase 2 migration path.
- **VI. Performance Budget**: PASS - No heavy new client-only architecture; keep pagination/filtering server-compatible and avoid unnecessary bundle growth.

Post-design re-check: PASS (no justified violations required).

## Phase 0 - Research Output

Research findings are documented in `research.md` and all prior clarifications are resolved:

- Status-change reason is mandatory and validated.
- Default ordering is API/mock responsibility.
- Y-08 exercise-detail navigation is deferred.

## Phase 1 - Design & Contracts

### Design Outputs

- Data model and validation rules: `data-model.md`
- API contracts (mock-first): `contracts/training-equipment.openapi.yaml`
- Implementation quickstart: `quickstart.md`

### Design Decisions

1. Keep UI behavior aligned to current prototype while enforcing mandatory status-reason validation.
2. Move initial ordering responsibility to list endpoint response ordering in mock API.
3. Keep linked exercise name visually interactive if needed, but no route transition to Y-08 in Phase 1.
4. Seeded history is read-only; no mutation endpoints for history in Phase 1.
5. Preserve role gates for create/edit/delete/CSV access in UI and mirror guards in API responses where applicable.

## Project Structure

### Documentation (this feature)

```text
specs/010-training-equipment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── training-equipment.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── _mock-db.ts
│   │   ├── _schemas/
│   │   │   └── training-equipment.schema.ts
│   │   └── crm/
│   │       └── training-equipment/
│   │           ├── route.ts
│   │           ├── [equipmentId]/route.ts
│   │           ├── [equipmentId]/status/route.ts
│   │           ├── [equipmentId]/exercise-links/route.ts
│   │           └── [equipmentId]/history/route.ts
│   └── (private)/
│       └── training-equipment/
│           ├── page.tsx
│           ├── [id]/page.tsx
│           ├── form/page.tsx
│           ├── _components/
│           │   └── ... feature-local components ...
│           └── _hooks/
│               ├── use-training-equipment-filters.hook.ts
│               ├── use-training-equipment-table-state.hook.ts
│               ├── use-status-change-form.hook.ts
│               └── use-exercise-link-selection.hook.ts
├── components/
│   └── ... shared UI components ...
```

**Structure Decision**: Use existing Next.js single-project architecture with local route handlers under `src/app/api/crm/`; keep feature-specific hooks in feature-local `_hooks` under `src/app/(private)/training-equipment/` and split hooks by concern (filter/query-state, table-state, status-form, exercise-link actions) rather than one large hook per screen. Follow existing module convention: prefer feature `_schemas` + API/generated types, and avoid creating a dedicated `training-equipment.type.ts` file.

## Complexity Tracking

No constitution violations requiring justification.
