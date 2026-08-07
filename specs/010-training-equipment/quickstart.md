# Quickstart: E-03 Training Equipment Management (Phase 1)

## Prerequisites

- Node environment matching project constraints.
- Dependencies installed (`npm install`).
- Feature branch checked out: `010-training-equipment-phase1`.

## 1) Implement mock schemas and data

1. Add/update Zod schemas in `src/app/api/_schemas/training-equipment.schema.ts`.
2. Extend `src/app/api/_mock-db.ts` with:
   - equipment records,
   - exercise link records,
   - seeded read-only history records.
3. Ensure seeded data covers multi-store scenarios required by constitution.

## 2) Implement mock route handlers

Create/update handlers under `src/app/api/crm/training-equipment/`:

- `route.ts`:
  - `GET` list with keyword/filter/pagination,
  - API-owned default ordering,
  - discarded excluded by default.
  - `POST` create with input validation.
- `[equipmentId]/route.ts`:
  - `GET` detail,
  - `PATCH` edit,
  - `DELETE` soft delete blocked when links exist.
- `[equipmentId]/status/route.ts`:
  - `PATCH` status change with mandatory `reason`.
- `[equipmentId]/exercise-links/route.ts`:
  - `POST` add links,
  - `DELETE` unlink by `exerciseId`.
- `[equipmentId]/history/route.ts`:
  - `GET` seeded read-only history.

Tool types master: `GET /api/crm/tool-types` (`src/app/api/crm/tool-types/route.ts`).

## 3) Connect frontend data flow

1. Feature pages live under `src/app/(private)/training-equipment/` (standalone route group, not under equipment-management).
2. Feature hooks in `src/app/(private)/training-equipment/_hooks/` use generated React Query hooks from `@/lib/api/@tanstack/react-query.gen`.
3. Ensure list page does not force default sort at initial render.
4. Add mandatory validation feedback for status-change reason in dialogs/forms.
5. Keep Y-08 navigation deferred (no route transition from linked exercise names).

## 4) Validate role gates and edge cases

- Verify create/edit/delete/CSV controls by role.
- Verify delete-block behavior when links exist.
- Verify empty/filtered states and pagination boundary behavior.
- Verify history tab remains read-only.

## 5) Verification commands

- `npm run lint`
- `npm run type-check`
- `npm run build`

## 6) Manual scenario checks

- Register equipment -> open detail.
- Edit equipment -> tool type impact confirmation.
- Change status with empty reason -> blocked.
- Change status with reason -> success.
- Add/unlink exercises -> linked count updates.
- Delete with linked exercises -> blocked.
- History tab displays seeded records only.
