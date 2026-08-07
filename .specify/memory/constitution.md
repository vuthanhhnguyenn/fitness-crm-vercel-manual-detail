# Fitness CRM — DEV-FE Constitution

> **Who this is for**: The Frontend Development team (DEV-FE) and all AI agents operating
> in this repository. This document defines how DEV-FE works, what it builds, what it
> consumes from other teams, and the non-negotiable rules that govern every line of code.
>
> This constitution supersedes all other conventions in this repo.

---

## Context: Where DEV-FE fits

The project has four teams. DEV-FE only builds; it does not own the spec, the backend, or
QA sign-off.

| Team    | What they give DEV-FE                        | Repo / Location               |
| ------- | -------------------------------------------- | ----------------------------- |
| PO / BA | Requirements spec + interactive UI prototype | `dx-fitness/fitness-crm-ui`   |
| DEV-BE  | REST API + published OpenAPI spec            | Backend server (Phase 2 only) |
| Test    | Bug reports referencing spec requirement IDs | Jira / test tracker           |

DEV-FE's output is this repository (`fitness-crm`): the CRM web application built with
Next.js 16, deployed to staff at JOYFIT and FIT365 gym locations.

---

## Core Principles

### I. Spec-First — Read Before You Build (NON-NEGOTIABLE)

DEV-FE never starts a feature from scratch or from memory. Every implementation begins with
loading the approved requirement spec and UI prototype from `fitness-crm-ui`.

**Mandatory pre-implementation flow**:

1. Run `speckit.load-external <module-id>` to pull the latest spec and prototype into cache.
2. Read the requirement doc (`public/requirements/<module-id>.md`) — this is the
   **authoritative source** of business rules, functional requirements, and edge cases.
3. Use the UI prototype pages as a **behavioral reference only**: identify which fields,
   states, actions, and navigation flows exist. Do not copy layout, component structure, or
   styling from the prototype.
4. Run `speckit.specify` to produce the feature spec for this repo.
5. Run `speckit.plan` before any code is written.

A feature is rejected at review if its spec cannot be traced back to an approved requirement
doc in `fitness-crm-ui`.

**Rationale**: PO/BA has already done the hard thinking about business rules, brand
differences (JOYFIT vs FIT365), and edge cases. Reading the spec first prevents rework caused
by misunderstood requirements.

---

### II. Two-Phase Development — Mock Now, Integrate Later (NON-NEGOTIABLE)

Every module is built in two phases. Phase 1 is always completed first; Phase 2 begins only
when DEV-BE publishes a stable OpenAPI spec for the module.

**Phase 1 — Full UI + Mock API (no backend required)**

- Implement the complete UI for every screen defined in the spec.
- Back all data interactions with Next.js Route Handler mocks in `src/app/api/crm/`.
- Mock data lives in `src/app/api/_mock-db.ts`. It MUST compile against `types.gen.ts` at
  all times; a TypeScript error in the mock database is a build-blocking failure.
- Phase 1 is done when every user interaction in the approved spec is reachable and
  exercisable locally — without any running backend service.
- Seed data MUST cover ≥ 3 stores and ≥ 3 contract plans to exercise multi-store paths.

**Phase 2 — Real API Integration**

- Triggered only after DEV-BE publishes a stable OpenAPI spec for the module.
- Run `npm run generate-api` (live server) or `npm run generate-client` (local
  `openapi.json`) to regenerate `src/lib/api/`.
- Replace all mock route handler logic with generated React Query hooks from
  `src/lib/api/@tanstack/react-query.gen`. No direct `fetch` calls survive Phase 2.
- The generated `src/lib/api/` subtree is NEVER edited manually. Any change there must come
  from regeneration.

**Rationale**: Phase 1 lets PO/BA validate UX on a fully working UI before the backend is
ready. Phase 2 integration risk is low because the OpenAPI contract has already been
mirrored in the mock layer.

---

### III. Strict Type Safety (NON-NEGOTIABLE)

Every boundary in the codebase — API responses, component props, form inputs, utility
functions — MUST be expressed through TypeScript types or Zod schemas.

- `any` is banned in all files under `src/` except the generated `src/lib/api/` subtree.
  ESLint rule `@typescript-eslint/no-explicit-any` MUST stay at `error`.
- Zod schemas are the runtime source of truth. Duplicate hand-written interfaces for the
  same shape are forbidden.
- Generated OpenAPI types (`types.gen.ts`) are authoritative for all backend contracts.
  Manual overrides require an inline comment explaining the deviation.
- Every Zod schema used in a mock API route MUST live in `src/app/api/_schemas/` and be
  exported so it can be reused in client-side form validation for the same shape.
- `tsc --noEmit` MUST exit 0 before any PR is opened.

---

### IV. Component Purity & UI Consistency (NON-NEGOTIABLE)

All user-facing UI is composed from the project's design system. Inventing new primitives
or bypassing design tokens is forbidden without an approved design exception.

- **Component sources** (in priority order):
  1. `src/components/ui/` — shadcn/ui primitives (Radix-based). Use first.
  2. `src/components/common/` — documented shared composites (DataTable, breadcrumb, etc.).
  3. Feature-local `_components/` — only for logic that is genuinely module-specific.
- **Color tokens**: all colour usage MUST reference CSS variables from
  `src/app/globals.css` or `src/styles/tailwind.theme.css`. Raw hex, rgba, oklch, or hsl
  values in component files are forbidden.
- **Icons**: `lucide-react` only. No other icon library may be introduced.
- **Tables**: use `src/components/common/data-table` when filtering, sorting, row selection,
  or query-state sync is needed. Use shadcn `<Table>` primitives only for simple read-only
  tabular rendering.
- **Data loading**: every page region that fetches data MUST be wrapped in `DataStateBoundary`
  (or an approved equivalent). Loading states MUST use matching skeleton placeholders —
  spinners alone are insufficient for primary content areas.
- **Dates**: all date inputs MUST use a `Datepicker` component. Plain `<input type="date">`
  is forbidden.
- **Responsiveness**: all components MUST support a minimum viewport width of 768 px.
- **Accessibility**: interactive elements MUST meet WCAG 2.1 AA contrast. Custom widgets
  (dialogs, comboboxes, data tables) MUST have keyboard navigation and ARIA roles.

---

### V. Server State via React Query — No Raw Fetch (NON-NEGOTIABLE)

All asynchronous server state is owned by TanStack React Query. Components and hooks do not
call `fetch` directly.

- **Phase 1 (mock)**: React Query hooks call the local mock Route Handlers
  (`/api/crm/...`). The hook signature is identical to what Phase 2 will use.
- **Phase 2 (real)**: React Query hooks use generated option-factories from
  `src/lib/api/@tanstack/react-query.gen`. Direct `fetch` or third-party HTTP clients are
  forbidden.
- Query keys MUST be derived from generated option-factory helpers (e.g.,
  `getCrmMembersInfiniteOptions`). Hand-crafted string query keys are forbidden.
- Infinite-scroll list views MUST use `useInfiniteQuery` with a server-side page size of
  ≤ 50 records per request.
- **Client-side state**: state that outlives a single component tree MUST use URL search
  params via `nuqs`. React context is permitted only for ephemeral UI state (e.g., panel
  open/close). Global stores (Redux, Zustand, Jotai) are forbidden and require a
  constitution amendment to introduce.

---

### VI. Performance Budget

Every page route MUST meet these budgets on production builds (simulated mid-tier device,
4G connection):

| Metric                          | Budget          |
| ------------------------------- | --------------- |
| LCP (Largest Contentful Paint)  | ≤ 2.5 s         |
| INP (Interaction to Next Paint) | ≤ 200 ms        |
| CLS (Cumulative Layout Shift)   | ≤ 0.1           |
| Initial JS bundle per route     | ≤ 250 kB (gzip) |

- React Server Components (RSC) are the default. `'use client'` appears only when the
  component genuinely needs browser APIs, DOM events, or client-only hooks.
- Dynamic imports via `next/dynamic` are required for any component subtree > 30 kB gzip
  that is not on the critical render path.
- `<img>` tags are forbidden in production source. All images MUST use `next/image` with
  explicit `width`/`height` or `fill` + `sizes`.

---

## Technology Stack

| Layer         | Technology                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| Runtime       | Node.js ≥ 24.0.0                                                                    |
| Framework     | Next.js 16 — App Router only (Page Router is forbidden)                             |
| Language      | TypeScript 5.x — strict mode, `no-explicit-any`                                     |
| Styling       | Tailwind CSS v4 + `cn()` from `src/lib/utils.ts`                                    |
| Server State  | TanStack React Query — generated option-factories                                   |
| URL State     | nuqs                                                                                |
| Forms         | react-hook-form + Zod (`@hookform/resolvers/zod`)                                   |
| API pipeline  | Zod → `registerRoute()` → OpenAPI → `@hey-api/openapi-ts` → TS client + React Query |
| UI components | shadcn/ui (Radix primitives) in `src/components/ui/`                                |
| Icons         | lucide-react (only)                                                                 |
| Dates         | date-fns v4 — moment / dayjs / luxon are explicitly banned                          |
| Toasts        | sonner                                                                              |

**Language policy**: Japanese (ja) for all user-visible labels and copy. English for all
code identifiers, comments, and documentation.

**Input constraints**: text inputs default to max 255 characters; textareas default to max
1 000 characters (see `src/constants/app.constants.ts`).

---

## Development Workflow

### Spec-kit pipeline (mandatory for every feature)

```
speckit.load-external <module-id>   ← pull spec + prototype from fitness-crm-ui
  → speckit.specify                 ← write feature spec for this repo
    → speckit.plan                  ← break into tasks + Constitution Check
      → speckit.tasks               ← generate task list
        → speckit.implement         ← write code, one task at a time
```

### Branch strategy

- Feature branches: `feat/<feature-name>` (managed by `.specify` with `branch_naming: prefix`)
- Bug fix branches: `fix/<bug-name>`
- Spec directories: `specs/<feature-name>/` (flat, no `feat/` prefix or numeric index)
- Legacy feature branches (`###-feature-name`) remain supported for existing specs
- Direct commits to `main` are forbidden — all changes require a PR

### File naming conventions

| Artifact          | Pattern              | Example                      |
| ----------------- | -------------------- | ---------------------------- |
| Type definitions  | `[name].type.ts`     | `member.type.ts`             |
| Custom hooks      | `[name].hook.ts`     | `use-member-filters.hook.ts` |
| Utility functions | `[name].util.ts`     | `date.util.ts`               |
| Zod schemas       | `[name].schema.ts`   | `staff.schema.ts`            |
| React contexts    | `[name]-context.tsx` | `member-filters-context.tsx` |

### Routing

All programmatic navigation uses the typed `navigate` helper from
`@/lib/routes/routes.util`. Raw `router.push()` with string literals is forbidden. When a
new page is created, its route MUST be declared in `src/lib/routes/routes.config.ts`.

### Import order (enforced by Prettier + ESLint)

`react` → `next` → third-party → `@/hooks` → `@/components` → `@/lib` → `@/types` →
relative

### Linting & formatting

- ESLint: `eslint-config-next/core-web-vitals` + `typescript` + `prettier`
- Prettier: 100-char print width, single quotes, trailing commas
- `lint-staged` + `husky` run on every commit. `--no-verify` is forbidden except in
  documented emergency hotfix branches.

---

## Definition of Done

A feature is Done when ALL of the following gates pass:

1. **Spec coverage**: every functional requirement in the approved spec is implemented or
   explicitly deferred with a linked issue.
2. **Type check**: `tsc --noEmit` exits 0.
3. **Lint**: `eslint` exits 0 — zero errors, zero promoted warnings.
4. **Contract tests**: every mock API route has a passing contract test (happy path +
   at least one error path).
5. **Constitution Check**: the PR description contains an explicit pass / N/A /
   justified-exception for each of Principles I–VI.
6. **Performance**: Lighthouse CI confirms Principle VI budgets for all new or changed
   routes.
7. **Design review**: no duplicate UI primitives introduced; all colour usage references
   design tokens.

---

## Governance

This constitution supersedes all other project conventions in this repository. Conflicts
with README guidance, PR comments, or verbal agreements are resolved in favour of the
constitution.

**Amendment procedure**:

1. Open a proposal issue with the rationale for the change.
2. Draft the amended constitution and increment the version (see policy below).
3. At least one other DEV-FE engineer MUST approve. If the change affects inter-team
   contracts (Principle II), DEV-BE must also approve.
4. Update `LAST_AMENDED_DATE` to the merge date (YYYY-MM-DD).
5. Update any affected templates under `.specify/templates/` in the same PR.

**Violations** that cannot be immediately fixed MUST be recorded as:
`TODO(CONSTITUTION-<PRINCIPLE_NUMBER>): <explanation>` with a linked issue.

**Versioning**: `MAJOR.MINOR.PATCH`

- MAJOR: principle removed or fundamentally redefined
- MINOR: new principle or section added
- PATCH: clarifications and wording fixes

---

**Version**: 1.0.0 | **Ratified**: 2026-06-17 | **Last Amended**: 2026-06-17
