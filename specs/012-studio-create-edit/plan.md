# Implementation Plan: Studio Registration & Space Layout Management

**Branch**: `012-studio-create-edit` | **Date**: 2026-07-03 | **Spec**: `specs/012-studio-create-edit/spec.md`
**Input**: Feature specification from D-03 (FR-002, FR-004, FR-006) — Studio create/edit form + space layout editor

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement studio registration (create) and editing (update) forms with an integrated space layout grid editor. The create form is exposed at `GET /studios/create` (currently a stub); the edit form at `GET /studios/[id]/edit` (new route). Both share a `StudioForm` component (modeled after `LessonForm` pattern) with react-hook-form + Zod, a right-panel `SpaceLayoutEditor` for grid-based floor plan configuration, and image upload via the existing `useImageUpload` hook. Phase 1 stores data in `src/app/api/_mock-db.ts` through `POST /api/crm/studios` and `PUT /api/crm/studios/[id]` API routes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, no-explicit-any)
**Primary Dependencies**: Next.js 16 (App Router), shadcn/ui, TanStack React Query 5, react-hook-form + Zod, lucide-react, Tailwind CSS v4, date-fns v4
**Storage**: Phase 1 — `src/app/api/_mock-db.ts`; Phase 2 — generated REST client via hey-api
**Target Platform**: Node.js ≥ 24.0.0, browser (web)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Form render + validation feedback <500ms; grid resize <100ms
**Constraints**: Follow existing `LessonForm` conventions exactly; no new npm packages; image upload via existing `useImageUpload` hook
**Scale/Scope**: <100 studios per tenant; grid max 10×5 = 50 cells

**Unknowns (NEEDS CLARIFICATION)**:

1. **Studio create/edit POST/PUT API contract** — The OpenAPI spec lacks create/update endpoints for studios. These need to be declared first.
2. **Mock DB storage shape for space layout** — The detail response includes `layout.cells` but there's no dedicated layout table/method for mutations.
3. **Image storage for studio images** — Spec says "follow same pattern as elsewhere" (lesson form images). Confirm `useImageUpload` hook with `category: 'other'` is appropriate for studio images or if a new category is needed.
4. **Edit form data fetching** — How does the edit form load existing values? Via the existing `GET /api/crm/studios/[id]` detail endpoint?
5. **Navigation after create/edit** — Spec says "navigate to studio detail page." Need to confirm the detail page route path (`/studios/[id]`).
6. **Store dropdown data source** — Depends on Y-02 (Store Management). Check if there's an existing API for fetching store list.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Principle              | Check                                                                                       | Notes                                                                                                                            |
| --- | ---------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| I   | TypeScript Strictness  | ☐ All new types use strict TS; no `any`; no unnarrowed `unknown`; named for intent          | Follow lesson form pattern — all types derived from Zod schemas                                                                  |
| II  | OpenAPI-First          | ☐ Phase 1 uses mock DB; Phase 2 uses generated client; no manual `src/lib/api/` edits       | OpenAPI spec must declare POST/PUT studio endpoints before frontend uses them                                                    |
| III | Spec-Driven            | ☐ `spec.md` approved; all `[NEEDS CLARIFICATION]` tokens resolved before any task begins    | Spec D-03 with FR-002/FR-004/FR-006 is the source; clarifications from 2026-07-03 session resolved                               |
| IV  | App Router & Simple UX | ☐ RSC by default; `"use client"` justified; shadcn/ui + Tailwind only; shortest UX path     | Studio form must be `"use client"` (forms/interactivity). Single-page form with right-panel layout editor — no multi-step wizard |
| V   | Simplicity & Min. Deps | ☐ No new npm packages without justification; no abstraction layers beyond existing patterns | `useImageUpload` already exists; react-hook-form + Zod already in stack                                                          |

> Any ☐ left unchecked MUST be addressed before implementation begins, or justified in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/012-studio-create-edit/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── studio-api.md    # POST/PUT endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── _mock-db/
│   │   │   ├── types/
│   │   │   │   └── studios.type.ts    # [EXTEND] Add StudioCreateInput, StudioUpdateInput
│   │   │   ├── lesson.seed.ts         # [EXTEND] Add create/update seed helpers
│   │   │   └── lesson.table.ts        # [EXTEND] Add create() and update() methods
│   │   ├── _schemas/
│   │   │   └── studio.schema.ts       # [EXTEND] Add CreateStudioSchema, UpdateStudioSchema
│   │   └── crm/studios/
│   │       ├── route.ts               # [EXTEND] Add POST handler
│   │       └── [id]/
│   │           ├── route.ts           # [EXTEND] Add PUT handler
│   │           └── layout.ts          # (if needed)
│   ├── (private)/
│   │   └── studios/
│   │       ├── create/
│   │       │   └── page.tsx           # [REPLACE stub] Render StudioForm with mode='create'
│   │       ├── [id]/
│   │       │   ├── edit/
│   │       │   │   └── page.tsx       # [NEW] Render StudioForm with mode='edit'
│   │       │   │   └── loading.tsx    # [NEW] Loading skeleton for edit
│   │       │   └── ... (existing detail page files)
│   │       └── _components/
│   │           ├── studio-form/
│   │           │   ├── studio-form.tsx             # [NEW] Main form (modeled after lesson-form.tsx)
│   │           │   ├── studio-form-basic-info.tsx   # [NEW] Store, name, type, hours, capacity, buffer
│   │           │   ├── studio-form-equipment.tsx    # [NEW] Equipment textarea
│   │           │   ├── studio-form-images.tsx       # [NEW] Image upload (patterned after lesson-form-images.tsx)
│   │           │   ├── studio-form-notes.tsx        # [NEW] Internal notes textarea
│   │           │   ├── studio-form-status.tsx       # [NEW] Active/inactive switch
│   │           │   ├── studio-form-confirm-dialog.tsx # [NEW] Confirmation dialog (patterned after lesson-form-confirm-dialog.tsx)
│   │           │   ├── studio-form-skeleton.tsx     # [NEW] Loading skeleton
│   │           │   └── space-layout-editor.tsx      # [NEW] Grid editor with placement mode, dims, summary, legend
│   │           └── studio-form.schema.ts            # [NEW] Zod schema for studio form values
```

**Structure Decision**: Single project (web application) — follows existing App Router structure. Studio form components co-located in `_components/studio-form/` matching the lesson-form convention.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations expected. All patterns follow existing conventions. No new dependencies.
