# Implementation Plan: FR-002 / FR-004 / FR-006 Lesson Content Master Create · Edit · Duplicate Form (D-02)

**Branch**: `009-lesson-content-form` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-lesson-content-form/spec.md`

## Summary

Build the Phase 1 Lesson Content Master **form screen** — a single shared `LessonForm` component consumed by three page routes (`/lessons/create`, `/lessons/[id]/edit`, `/lessons/[id]/duplicate`). The form is a `'use client'` component using `react-hook-form` + `zod`, composed of 6 `Card` sections: Basic Info (2-column grid with conditional per-use fee and dynamic duration options), Reservation Restrictions (searchable multi-select popovers), Lesson Images (sortable grid + drag-and-drop upload zone — visual only in Phase 1), Description (QuillJS rich-text editor), Notes, and Status (switch + badge). Submit triggers a confirmation `AlertDialog` summarizing type/name/pricing/status, then fires a success toast and navigates to the lesson list. Create is always empty; Edit and Duplicate pre-fill from the source master via `useQuery` (with skeleton loading) and differ only in mode labels, warning banner visibility, and submit API method (POST vs PATCH).

Technical approach: shared `LessonForm` component at `src/app/(private)/lessons/_components/lesson-form/` with `mode: 'create' | 'edit' | 'duplicate'`. Three thin page files pass mode + default values. Two new mock API routes (POST create, PATCH update) are added to the existing `lesson-contents` handler files, backed by enriched `_mock-db.ts` create/update methods. Zod schemas in `_schemas/lesson-content-form.schema.ts` and `_schemas/lesson-form.schema.ts`. Generated React Query option factories consumed via `useMutation`. Entry-point gating via `PAGE_PERMISSIONS` (Create → `LessonContentsCreate`, Edit → `LessonContentsEdit`, Duplicate → `LessonContentsCreate`). No backend required for Phase 1.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, `no-explicit-any`); Node.js ≥ 24.0.0
**Primary Dependencies**: Next.js 16 (App Router), React, TanStack React Query, react-hook-form + `@hookform/resolvers/zod`, shadcn/ui (Radix: Form, Input, Select, Card, Popover, Command, Badge, Switch, AlertDialog, Button, Sonner), lucide-react, Tailwind CSS v4, `next/image`, date-fns v4, QuillJS (`react-quill-new`)
**Storage**: Phase 1 in-memory mock DB (`src/app/api/_mock-db.ts`) enriched with `create()` / `update()` methods; Phase 2 = REST API via generated client
**Testing**: Contract tests for the two new mock routes (POST create: success + validation error; PATCH update: success + 404 + validation error); `tsc --noEmit`; ESLint
**Target Platform**: CRM web app (desktop browsers), min viewport width 768 px
**Project Type**: Web application (Next.js frontend with colocated mock API route handlers)
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 250 kB gzip per route
**Constraints**: Phase 1 mock-only (Principle II); form page is a client island; image upload is visual affordance only (no backend binding in Phase 1); submit is toast + navigate only (no submit-error UI in Phase 1); no database persistence in Phase 1
**Scale/Scope**: 1 shared form component, 3 page routes, 6 form sections, 2 new mock API endpoints (POST + PATCH), 2 Zod schemas, seed data enrichment for create/update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                     | Gate                                                                                                        | Status | Notes                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Spec-First                 | Spec traces to approved D-02 requirement + prototype                                                        | PASS   | Spec maps every FR-002/004/006-P1-\* to `D-02.md` / `lesson-form.tsx` via the traceability matrix                                                                       |
| II. Two-Phase (Mock now)      | Phase 1 uses mock Route Handlers + `_mock-db.ts`; seed ≥ 3 stores                                           | PASS   | Reuses existing `db.lessonContents` / `db.personalPlans` collections; adds `create()`/`update()` methods; POST/PATCH routes are mock                                    |
| III. Strict Type Safety       | No `any`; Zod schemas in `_schemas/`; types reusable; `tsc --noEmit` clean                                  | PASS   | New Zod schemas for form validation and API payloads in `_schemas/`; generated types from regenerated `types.gen.ts`                                                    |
| IV. Component Purity          | Only `ui/` + `common/` components; design tokens; lucide icons; `DataStateBoundary`; skeleton; `next/image` | PASS   | Reuses shadcn `Form`, `Select`, `Input`, `Card`, `Popover`, `Command`, `Badge`, `Switch`, `AlertDialog`, `Button`, `Skeleton`; `RoleGatedButton` for entry-point gating |
| V. React Query / no raw fetch | Hooks use generated option-factories; query keys from factories; URL state via nuqs; no global store        | PASS   | `useQuery` for edit/duplicate pre-fill; `useMutation` for create/update submit; generated option factories; no Redux/Zustand/Jotai                                      |
| VI. Performance Budget        | RSC default, `'use client'` minimal, `next/image`, dynamic import > 30 kB                                   | PASS   | Form page is a single client island; skeleton shown during pre-fill fetch; no heavy dynamic imports in Phase 1                                                          |

**Initial gate result**: PASS. No violations requiring Complexity Tracking.

**Post-design re-check (after Phase 1)**: PASS — design keeps all data access behind React Query hooks against mock routes, reuses shared/ui components only, introduces no new primitives, no `any`, and no global state store. See `research.md` decisions D1–D14.

## Project Structure

### Documentation (this feature)

```text
specs/009-lesson-content-form/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (mock API contracts)
│   ├── post-lesson-content.md     # POST /api/crm/lesson-contents
│   └── patch-lesson-content.md    # PATCH /api/crm/lesson-contents/{id}
├── checklists/
│   └── requirements.md  # Pre-existing spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/app/(private)/lessons/create/
└── page.tsx                              # REPLACE: render <LessonForm mode="create" />

src/app/(private)/lessons/[id]/edit/
└── page.tsx                              # NEW: fetch detail → render <LessonForm mode="edit" />

src/app/(private)/lessons/[id]/duplicate/
└── page.tsx                              # NEW: fetch detail → render <LessonForm mode="duplicate" />

src/app/(private)/lessons/_components/lesson-form/
├── lesson-form.tsx                       # NEW: shared form component (mode prop, sections orchestration)
├── lesson-form-basic-info.tsx            # NEW: Section 1 — name, type, brand, duration, pricing, per-use fee
├── lesson-form-restrictions.tsx          # NEW: Section 2 — searchable multi-select popovers + badges
├── lesson-form-images.tsx               # NEW: Section 3 — sortable image grid + upload zone (visual only)
├── lesson-form-description.tsx           # NEW: Section 4 — QuillJS rich-text editor (react-quill-new)
├── lesson-form-notes.tsx                 # NEW: Section 5 — notes textarea
├── lesson-form-status.tsx                # NEW: Section 6 — status switch + badge
├── lesson-form-skeleton.tsx             # NEW: loading skeleton for edit/duplicate pre-fill
└── lesson-form-confirm-dialog.tsx       # NEW: confirmation AlertDialog (varies by mode)

src/app/(private)/lessons/_schemas/
└── lesson-form.schema.ts                # NEW: Zod schema + FormValues type (form validation)

src/app/api/_schemas/
└── lesson-content-form.schema.ts        # NEW: Zod schemas for POST/PATCH API payloads + responses

src/app/api/crm/lesson-contents/
├── route.ts                             # ENRICH: add POST handler (create)
└── [id]/route.ts                        # ENRICH: add PATCH handler (update)

src/app/api/_mock-db.ts                  # ENRICH: add lessonContents.create() + update() methods
src/app/api/_routes/index.ts             # ENRICH: ensure new route handlers are auto-loaded

src/lib/routes/routes.config.ts          # ENRICH: add /lessons/[id]/edit, /lessons/[id]/duplicate
src/lib/permission.config.ts             # ENRICH: add PAGE_PERMISSIONS for new routes

src/app/(private)/lessons/[id]/_components/
└── lesson-detail-header-actions.tsx     # UPDATE: navigate Duplicate → /lessons/[id]/duplicate
```

### Source files NOT changed

```text
src/app/api/_schemas/lesson-content.schema.ts        # Existing enums reused (no change)
src/app/api/_schemas/lesson-content-detail.schema.ts  # Existing detail schema reused (no change)
src/types/permission.type.ts                          # D-02 permissions already exist (no change)
```

**Structure Decision**: Single Next.js App Router web app. The form is a shared client component under `lessons/_components/lesson-form/` — a new subdirectory following the colocation pattern of `lessons/[id]/_components/`. The three page files are thin (each ~15–30 lines) and delegate to `LessonForm` with the appropriate `mode`. Phase 1 data is served by two new mock handlers (POST/PATCH), consumed through `useMutation` with generated option factories. No new permission entries needed (D-02 set already exists from `008`).

## Complexity Tracking

> No constitution violations require justification. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
