# Quick Start: Staff List Feature — Y-01

**Feature**: `001-staff-list`  
**Date**: 2026-04-08

---

## 1. Get the dev server running

```bash
cd /home/du/WorkSpace/dx-fitness/fitness-crm
npm install         # if not already done
npm run dev         # starts Next.js + mock API on http://localhost:3000
```

---

## 2. Navigate to the feature

Once the server is running, open:

```
http://localhost:3000/settings/staff
```

_(Currently returns 404 — the page file does not exist yet; it will be created in the implementation phase.)_

---

## 3. Key files to create (implementation order)

Follow this order to avoid broken imports at each step:

| Step | File                                                                   | Why this order                                         |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 1    | `src/types/staff.type.ts`                                              | Enums and interfaces — everything depends on these     |
| 2    | `src/app/api/_schemas/staff.schema.ts`                                 | Zod schemas — needed by API routes                     |
| 3    | `src/app/api/_mock-db.ts`                                              | Extend with Branch / Staff / Position seed data        |
| 4    | `src/app/api/crm/staff/route.ts`                                       | `GET /crm/staff`                                       |
| 5    | `src/app/api/crm/staff/positions/route.ts`                             | `GET /crm/staff/positions`                             |
| 6    | `src/app/api/crm/staff/[id]/route.ts`                                  | `DELETE /crm/staff/[id]`                               |
| 7    | `src/app/api/crm/staff/invitations/route.ts`                           | `POST /crm/staff/invitations`                          |
| 8    | Regenerate OpenAPI + client                                            | `npm run generate-openapi` then `npm run generate-api` |
| 9    | `src/app/(private)/settings/layout.tsx`                                | Route layout wrapper                                   |
| 10   | `src/app/(private)/settings/staff/_contexts/staff-filters-context.tsx` | Context provider                                       |
| 11   | `src/app/(private)/settings/staff/_hooks/use-staff-filters.ts`         | nuqs filter hook                                       |
| 12   | `src/app/(private)/settings/staff/_components/staff-table-columns.tsx` | Column definitions                                     |
| 13   | `src/app/(private)/settings/staff/_components/staff-filters.tsx`       | Filter bar component                                   |
| 14   | `src/app/(private)/settings/staff/_components/staff-delete-dialog.tsx` | Delete AlertDialog                                     |
| 15   | `src/app/(private)/settings/staff/_components/staff-invite-dialog.tsx` | Invite Dialog                                          |
| 16   | `src/app/(private)/settings/staff/page.tsx`                            | Main page — assembles everything                       |

---

## 4. Regenerate OpenAPI client after adding routes

After creating the API route files (steps 4–7), regenerate the OpenAPI spec then the TypeScript client:

```bash
npm run generate-openapi   # regenerates src/lib/openapi.json from route registrations
npm run generate-api       # generates src/lib/api/ from openapi.json
```

This reads route registrations via `registerRoute` and outputs:

- `src/lib/api/types.gen.ts` — TypeScript interfaces
- `src/lib/api/@tanstack/react-query.gen.ts` — React Query option factories

---

## 5. Reference patterns

| What you need       | Where to look                                                     |
| ------------------- | ----------------------------------------------------------------- |
| List page pattern   | `src/app/(private)/members/page.tsx`                              |
| Column definitions  | `src/app/(private)/members/_components/members-table-columns.tsx` |
| Filter panel        | `src/app/(private)/members/_components/members-filters.tsx`       |
| nuqs filter hook    | `src/app/(private)/members/_hooks/use-members-filters.ts`         |
| Filter context      | `src/app/(private)/members/_contexts/members-filters-context.tsx` |
| API route           | `src/app/api/crm/members/route.ts`                                |
| Zod schema          | `src/app/api/_schemas/member.schema.ts`                           |
| DataTable component | `src/components/common/data-table/index.tsx`                      |
| Badge variants      | `src/components/ui/badge.tsx`                                     |
| AlertDialog         | `src/components/ui/alert-dialog.tsx`                              |
| Dialog              | `src/components/ui/dialog.tsx`                                    |

---

## 6. Running contract tests

```bash
npm run test                       # runs all tests
npm run test staff                 # runs staff-related tests only
```

Contract tests must cover (see `research.md` §11):

- `GET /crm/staff` — happy path, zero results, invalid sort_by
- `GET /crm/staff/positions` — happy path
- `DELETE /crm/staff/[id]` — success, not found
- `POST /crm/staff/invitations` — valid payload, empty array

---

## 7. Verify Constitution gates before PR

```bash
npm run build            # LCP / bundle size — check Next.js bundle analyser
npm run lint             # ESLint (no-any, core-web-vitals, prettier)
npm run type-check       # tsc --noEmit
```

Checklist:

- [ ] No `any` types in new files
- [ ] All UI from `src/components/ui/` or `src/components/common/`
- [ ] All data fetches via generated React Query option-factories
- [ ] `nuqs` used for all URL state
- [ ] Contract tests passing
- [ ] Route chunk gzip ≤ 250 kB
