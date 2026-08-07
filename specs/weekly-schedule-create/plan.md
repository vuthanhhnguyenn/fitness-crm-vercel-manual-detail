# Implementation Plan: Weekly Schedule Registration & Publication Settings

**Branch**: `feat/lesson-schedule-screen` | **Date**: 2026-06-24 | **Spec**: `specs/weekly-schedule-create/spec.md`

## Summary

Implement the weekly schedule **create** form (FR-003) including single/recurring lesson creation, personal training sessions, publication toggling, trial slot configuration, template save/load, instructor conflict detection, and unsaved-changes protection. Phase 1 delivers the full UI backed by Next.js Route Handler mocks; Phase 2 will swap mocks for the real DEV-BE API.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `no-explicit-any` error)  
**Framework**: Next.js 16 — App Router only  
**Primary Dependencies**: react-hook-form 7 + `@hookform/resolvers` (Zod), TanStack React Query, shadcn/ui (Radix), date-fns v4, sonner (toasts), nuqs (URL state), lucide-react (icons), Tailwind CSS v4  
**Storage**: In-memory mock DB (`src/app/api/_mock-db.ts`) — Phase 1; REST API via OpenAPI — Phase 2  
**Testing**: None configured; gates are `tsc --noEmit` (type-check) and `eslint` (lint), both enforced by husky pre-commit  
**Target Platform**: Web (staff CRM for JOYFIT/FIT365, min viewport 768px)  
**Project Type**: Web application (Next.js CRM)  
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS bundle ≤ 250 kB gzip  
**Constraints**: WCAG 2.1 AA, Japanese locale for all user-facing text, `'use client'` only where necessary  
**Scale/Scope**: 7+ stores seeded, ~50 screens, multi-store CRM

## Constitution Check

_GATE: Must pass before Phase 0. Re-checked after Phase 1 design._

| Principle                         | Status    | Notes                                                                                                           |
| --------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| **I. Spec-First**                 | ✅ PASS   | Spec derived from approved D-01.md + prototype; all requirements traceable                                      |
| **II. Two-Phase Dev**             | ✅ PASS   | Phase 1 only (mock API + full UI); Phase 2 gated on DEV-BE OpenAPI spec                                         |
| **III. Strict Type Safety**       | ⚠️ VERIFY | Must ensure Zod schemas for create/update; no `any`; schemas in `_schemas/`                                     |
| **IV. Component Purity**          | ⚠️ VERIFY | Must use shadcn/ui primitives; no raw colours; lucide-react only; Datepicker component                          |
| **V. React Query / Server State** | ⚠️ VERIFY | Mock routes via React Query; no raw fetch; nuqs for filter state; query keys from generated factories (Phase 2) |
| **VI. Performance Budget**        | ⚠️ VERIFY | RSC default; `'use client'` only for form interactivity; dynamic imports for non-critical subtrees              |

**Justification for VERIFY items**: These are standard Phase-1 checks enforced during implementation — no violation expected.

## Project Structure

### Documentation (this feature)

```text
specs/weekly-schedule-create/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
src/app/(private)/lesson-schedules/
├── page.tsx                               # Existing — list/timeline/calendar views
├── create/
│   └── page.tsx                           # NEW — create form page
│   └── _components/                       # NEW — create-specific sub-components
├── [id]/
│   └── reservations/
│       └── page.tsx                       # Existing — reservation detail
├── _components/
│   ├── lesson-schedule-create-form.tsx    # NEW — main create form component
│   ├── lesson-schedule-form-date-studio.tsx  # NEW — date/time & studio step
│   ├── lesson-schedule-form-lesson.tsx    # NEW — lesson content step
│   ├── lesson-schedule-form-instructors.tsx  # NEW — instructor selection step
│   ├── lesson-schedule-form-publication.tsx  # NEW — publication & trial settings
│   ├── lesson-schedule-form-capacity.tsx  # NEW — capacity setting
│   ├── lesson-schedule-form-recurring.tsx # NEW — recurring pattern configuration
│   ├── recurring-preview.tsx             # NEW — generated dates preview
│   ├── template-popover.tsx              # NEW — template save/load popover
│   ├── instructor-conflict-warning.tsx    # NEW — conflict detection warning
│   └── holiday-warning-banner.tsx        # NEW — store holiday warning
├── _schemas/
│   ├── lesson-schedule-form.schema.ts    # NEW — form validation Zod schema
│   └── lesson-schedule-form.mapper.ts    # NEW — form data ↔ API mappers
├── _hooks/
│   ├── use-create-lesson-schedule.hook.ts    # NEW — create mutation hook
│   ├── use-lesson-schedule-form.hook.ts      # NEW — form state & validation
│   └── use-unsaved-changes.hook.ts           # NEW — unsaved changes guard
└── _constants/
    └── constants.ts                      # NEW — form constants (options, limits)

src/app/api/crm/lesson-schedules/
├── route.ts                              # Existing — GET list
├── create/route.ts                       # NEW — POST create schedule
├── [id]/
│   ├── …                                 # Existing — change, cancel, reservations, etc.
│   └── …

src/app/api/_schemas/
├── lesson-schedule.schema.ts             # Existing — extend with create schema
└── …

src/app/api/_mock-db.ts                   # Existing — extend with create mock handler
```

**Structure Decision**: Feature-co-located layout matching existing `campaigns/` pattern (page → `_components/`, `_hooks/`, `_schemas/`, `_constants/`). Reuses the existing `lesson-schedules/` module.

## Complexity Tracking

No constitution violations requiring justification.

## Phases

### Phase 0: Outline & Research

**Research tasks** (documented in `research.md`):

| #   | Unknown                                            | Research Approach                                                                                            |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| R1  | Existing lesson-schedule schemas for create/update | Read `lesson-schedule.schema.ts` and extend with `CreateLessonScheduleRequest`/`UpdateLessonScheduleRequest` |
| R2  | Mock DB patterns for POST/PUT                      | Review existing campaign create pattern in `_mock-db.ts` (e.g., `createMember()`)                            |
| R3  | Instructor/store/studio mock data availability     | Verify `SEED_USERS`, store master, studio data in `_mock-db.ts`                                              |
| R4  | Existing form validation patterns                  | Review `campaign-form.schema.ts` for Zod + react-hook-form patterns                                          |
| R5  | DataStateBoundary usage pattern                    | Check how existing pages wrap data-fetching regions                                                          |
| R6  | Route handler registration                         | Confirm `generate-routes` auto-discovers new `create/` page                                                  |

### Phase 1: Design & Contracts

1. **Data model** (`data-model.md`): Define entities — LessonSchedule (create/update shape), RepeatTemplate, InstructorAssignment, TrialSlotConfig
2. **API contracts** (`contracts/`): Document POST /api/crm/lesson-schedules/create request/response shape
3. **Quickstart** (`quickstart.md`): Dev setup steps for testing the form locally
4. **Agent context update**: Run `.specify/scripts/bash/update-agent-context.sh copilot`

### Phase 2: Tasks → Implementation

Delegated to `/speckit.tasks` agent.
