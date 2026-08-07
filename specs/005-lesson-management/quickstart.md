# Quickstart: D-01 Lesson Schedule Management

## Prerequisites

- Use Node.js `>=24.0.0` as required by `package.json`.
- Install dependencies with the repository package manager.
- Stay on branch `005-lesson-management`.

## Generate Routes and API Client

After adding the route and mock API schemas:

```bash
npm run generate-routes
npm run generate-openapi
npm run generate-client
```

Expected results:

- `/lesson-schedules` appears in generated route config.
- Lesson schedule mock endpoints are included in the generated OpenAPI document.
- Generated React Query option factories exist for the lesson schedule endpoints.

## Run Locally

```bash
npm run dev
```

Open the private CRM route for the Phase 1 screen:

```text
/lesson-schedules
```

## Manual Verification

1. Open `/lesson-schedules` as a non-Trainer user.
2. Confirm the page title is "予約管理" / "Reservation Management".
3. Confirm KPI cards render for today's lessons, booking occupancy, today's changes, and today's assigned staff.
4. Confirm the default view is day timeline.
5. Switch between day, weekly, and list views.
6. Use Today, previous, next, and calendar picker controls.
7. Change store, studio, and instructor filters and confirm displayed schedule data narrows.
8. In all-store context with store filter set to all stores, confirm area KPI cards and store summary table render.
9. Click a store summary row and confirm the focused-store label updates.
10. Confirm list and area summary table headers sort in Phase 1.
11. Confirm a day with no lessons shows the day timeline empty state.
12. Confirm page-level and component-level skeleton states render during loading.
13. Open the schedule-change modal from a timeline or weekly lesson edit icon.
14. Confirm the modal can be closed with cancel or close.
15. Confirm the modal confirm action completes the flow and returns to the schedule screen without additional validation.
16. Confirm schedule creation and reservation detail routes are not implemented as part of this feature beyond navigation entry points.

## Role Verification

1. Open the screen as a Trainer user.
2. Confirm the screen starts in my-schedule mode.
3. Confirm the store axis tab is disabled.
4. Confirm my-schedule items display start/end time, lesson name, store, instructor, reservation status, and booked names when available.

## Quality Gates

Run before handing off to `/speckit.tasks` or implementation review:

```bash
npm run type-check
npm run lint
```

Expected results:

- TypeScript exits successfully.
- ESLint exits successfully.
- No raw colors, raw route strings in navigation, raw component fetches, or `any` types are introduced.
