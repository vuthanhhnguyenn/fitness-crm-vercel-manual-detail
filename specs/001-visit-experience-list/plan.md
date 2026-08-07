# Implementation Plan: Visit/Experience Management — List Page

**Branch**: `001-visit-experience-list` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-visit-experience-list/spec.md`

---

## Summary

Build the Phase 1 UI and mock API for the visit/experience reservation queue page (`/visit-experiences`). Staff can view, search, filter, and paginate a list of visit reservations with BL-match risk indicators and same-day KPI summary cards. All data is backed by a Next.js Route Handler mock; real backend integration is deferred to Phase 2.

---

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, `no-explicit-any`  
**Framework**: Next.js 16 — App Router only  
**Primary Dependencies**: TanStack React Query 5, shadcn/ui (Radix), nuqs, date-fns v4, Zod, react-hook-form  
**Storage**: Phase 1 — in-memory mock via `src/app/api/_mock-db.ts`; Phase 2 — REST API (not yet published)  
**Testing**: Contract tests for mock Route Handlers (happy path + at least one error path per endpoint)  
**Target Platform**: Web — staff-facing CRM; minimum viewport 768 px  
**Project Type**: Next.js web application (frontend-only repository)  
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, JS bundle ≤ 250 kB gzip per route  
**Constraints**: No direct `fetch` in components/hooks; no raw hex/rgba colours; Japanese UI copy; English code identifiers; `any` banned in `src/`  
**Scale/Scope**: 1 new list page route, 2 mock API endpoints, ≥ 10 seed records spanning ≥ 2 brands and ≥ 3 stores

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle               | Status  | Notes                                                                                                                              |
| ----------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| I — Spec-First          | ✅ PASS | `speckit.load-external` ran; spec traces to `fitness-crm-ui:src/pages/visit-experience-list.tsx` and FR-S001                       |
| II — Two-Phase          | ✅ PASS | Phase 1: mock Route Handlers in `src/app/api/crm/visit-experiences/`. Phase 2 deferred until DEV-BE publishes OpenAPI.             |
| III — Type Safety       | ✅ PASS | All types defined via Zod schemas; `types.gen.ts` not modified manually; feature types in `src/types/api/visit-experience.type.ts` |
| IV — Component Purity   | ✅ PASS | shadcn/ui primitives only; `lucide-react` icons; all colours via CSS variable tokens                                               |
| V — Server State via RQ | ✅ PASS | All data fetching through React Query option-factories; URL state via `nuqs`; no direct `fetch` in components                      |
| VI — Performance Budget | ✅ PASS | Page uses RSC by default; `'use client'` only in interactive regions; no heavy imports on critical path                            |

No violations requiring justification.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-visit-experience-list/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entity definitions + field-level spec
├── quickstart.md        ← developer setup
├── contracts/
│   ├── GET-visit-experiences.md
│   └── GET-visit-experiences-summary.md
└── tasks.md             ← /speckit.tasks output (not yet)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (private)/
│   │   └── visit-experiences/
│   │       ├── page.tsx                              # RSC: Suspense boundaries + layout
│   │       ├── [id]/
│   │       │   └── page.tsx                          # Detail stub (Phase 1 placeholder)
│   │       └── _components/
│   │           ├── visit-experience-header.tsx       # 'use client' — breadcrumb + icon
│   │           ├── visit-experience-kpi.tsx          # 'use client' — 4 KPI cards
│   │           └── visit-experience-list-section.tsx # 'use client' — filters + table + pagination
│   └── api/
│       └── crm/
│           └── visit-experiences/
│               ├── route.ts                          # GET list (mock)
│               ├── summary/
│               │   └── route.ts                      # GET KPI summary (mock)
│               └── [id]/
│                   └── route.ts                      # GET detail stub (mock)
├── lib/
│   └── routes/
│       └── routes.config.ts                          # Re-generated: adds /visit-experiences and /visit-experiences/[id]
└── types/
    └── api/
        └── visit-experience.type.ts                  # Phase 1 types (replaces in Phase 2 by types.gen.ts)
```

**Structure Decision**: Single Next.js App Router project (Option 1 pattern). Feature files are co-located under `(private)/visit-experiences/`. Mock API lives alongside other CRM mocks in `src/app/api/crm/`. Types declared manually for Phase 1 in `src/types/api/`.

---

## Complexity Tracking

No constitution violations.

---

_Artifacts below are generated by the Phase 0 and Phase 1 steps of this plan._

- **research.md** → [research.md](./research.md)
- **data-model.md** → [data-model.md](./data-model.md)
- **contracts/** → [contracts/](./contracts/)
- **quickstart.md** → [quickstart.md](./quickstart.md)
