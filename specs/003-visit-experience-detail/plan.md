# Implementation Plan: Visit/Experience Management — Detail Page

**Branch**: `003-visit-experience-detail` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/003-visit-experience-detail/spec.md`

---

## Summary

Build the Phase 1 UI and mock API for the visit/experience reservation **detail page** (`/visit-experiences/[id]`). Front-desk staff can review an applicant's personal information, identity document, BL screening result, and timeline — then issue a 30-minute timed entry permit or guide a completed visitor into the membership application flow. All data is backed by Next.js Route Handler mocks; real backend and B-01 integration are deferred to Phase 2.

The list page (`001-visit-experience-list`) is already implemented. This plan extends the existing `VisitExperience` type and mocks to add detail-level fields, upgrades the existing detail Route Handler stub, and builds the full detail page replacing the "coming soon" stub.

---

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode, `no-explicit-any`  
**Framework**: Next.js 16 — App Router only  
**Primary Dependencies**: TanStack React Query 5, shadcn/ui (Radix), lucide-react, date-fns v4, Zod, react-hook-form  
**Storage**: Phase 1 — in-memory mock via `src/app/api/_mock-db.ts`; Phase 2 — REST API (not yet published)  
**Testing**: Contract tests for mock Route Handlers (happy path + at least one error path per endpoint)  
**Target Platform**: Web — staff-facing CRM; minimum viewport 768 px  
**Project Type**: Next.js web application (frontend-only repository)  
**Performance Goals**: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, JS bundle ≤ 250 kB gzip per route  
**Constraints**: No direct `fetch` in components/hooks; no raw hex/rgba colours; Japanese UI copy; English code identifiers; `any` banned in `src/`  
**Scale/Scope**: 1 detail page route (already registered), 2 mock API endpoints (1 upgrade + 1 new), seed data extended with detail fields  
**v3 Design Changes**: (1) 本人確認書類 card removed — face photo status inside 個人情報 card; (2) 残り時間 countdown removed; (3) ステータス and 操作 merged into one card

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle               | Status  | Notes                                                                                                                                                                                                                                                                          |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I — Spec-First          | ✅ PASS | Spec traces to `fitness-crm-ui:src/pages/visit-experience-detail.tsx` and FR-S001 in `C-01.md`. Loaded from local mirrors at `fitness-crm-ui` and `fitness-spec`.                                                                                                              |
| II — Two-Phase          | ✅ PASS | Phase 1: full UI + mock Route Handlers. B-01 integration (real gate/face-auth hardware) deferred to Phase 2. Permit mock records in-memory and transitions status in `_mock-db.ts`.                                                                                            |
| III — Type Safety       | ✅ PASS | `VisitExperienceDetail` defined via Zod; extends existing `VisitExperience` list type. `types.gen.ts` not touched. Permit mutation typed via Zod schema.                                                                                                                       |
| IV — Component Purity   | ✅ PASS | shadcn/ui primitives only (`Card`, `Badge`, `Alert`, `AlertDialog`, `Button`, `Label`, `Separator`); `lucide-react` icons; all colours via CSS variable tokens. Inline toned icon circle per prototype — no `StatusCard` shared component. No separate eKYC card (v3 removed). |
| V — Server State via RQ | ✅ PASS | Detail fetch via `useQuery`; permit action via `useMutation` with `invalidateQueries` on success. URL state not needed for detail page (no filter/pagination). No direct `fetch` in components.                                                                                |
| VI — Performance Budget | ✅ PASS | Page shell is RSC; `'use client'` only in interactive regions (ステータス+操作 card, timeline mutation). No countdown `setInterval` — remaining time display removed in v3.                                                                                                    |

No violations requiring justification.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-visit-experience-detail/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entity definitions + field-level spec
├── quickstart.md        ← developer setup
├── contracts/
│   ├── GET-visit-experience-detail.md
│   └── POST-visit-experience-permit.md
└── tasks.md             ← /speckit.tasks output (not yet)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (private)/
│   │   └── visit-experiences/
│   │       └── [id]/
│   │           ├── page.tsx                                  # RSC shell (replace stub) — Suspense + layout
│   │           └── _components/
│   │               ├── personal-info-card.tsx                # 'use client' — 個人情報 card (includes face photo registration status)
│   │               ├── blacklist-result-card.tsx             # 'use client' — BL照合結果 card
│   │               ├── timeline-card.tsx                     # 'use client' — タイムライン card
│   │               ├── status-panel.tsx                      # 'use client' — ステータス card (status icon/badge + Separator + action section)
│   │               ├── permit-actions.tsx                    # 'use client' — action section inside ステータス card + AlertDialog
│   │               ├── reservation-info-card.tsx             # 来店詳細情報 card
│   │               ├── b01-info-card.tsx                     # 'use client' — B-01連携情報 card (visiting/completed only)
│   │               └── detail-skeleton.tsx                   # skeleton matching 2-column layout
│   │           # Note: visit-experience-id-document.tsx removed — face photo status moved into personal-info-card (v3 design)
│   └── api/
│       └── crm/
│           └── visit-experiences/
│               └── [id]/
│                   ├── route.ts                              # GET detail (upgrade stub → full VisitExperienceDetail)
│                   └── permit/
│                       └── route.ts                          # POST permit (new)
├── app/api/
│   └── _schemas/
│       └── visit-experience.schema.ts                        # extend with VisitExperienceDetail + Permit schemas
├── types/
│   └── api/
│       └── visit-experience.type.ts                          # extend with VisitExperienceDetail + PermitResponse
└── lib/
    └── api/
        └── @tanstack/
            └── visit-experience.query.ts                     # add getCrmVisitExperienceDetailOptions + usePermitMutation
```

**Structure Decision**: All detail components are co-located under `(private)/visit-experiences/[id]/_components/`. The mock API permit endpoint is a sub-resource at `[id]/permit/route.ts`. Type and schema files extend the existing `visit-experience.type.ts` and `visit-experience.schema.ts` — no new type files needed.

---

## Complexity Tracking

No constitution violations.

---

_Artifacts below are generated by the Phase 0 and Phase 1 steps of this plan._

- **research.md** → [research.md](./research.md)
- **data-model.md** → [data-model.md](./data-model.md)
- **contracts/** → [contracts/](./contracts/)
- **quickstart.md** → [quickstart.md](./quickstart.md)
