# Quickstart: Lesson Content Master Detail Display

**Feature**: 008-lesson-content-detail | **Phase 1 (mock, no backend)**

This guide shows how to build, run, and verify the detail screen locally. It assumes Node ≥ 24 and the
repo dependencies are installed (`npm install`). The list feature (`007-lesson-content-list`) is the
upstream entry point; this feature replaces the `/lessons/[id]` placeholder with the real detail view.

## Build order (recommended)

0. **Permissions (first implement step)** — add the D-02 `LessonContents*` permission set:
   `LessonContentsView/Create/Edit/Delete/HistoryView` in `src/types/permission.type.ts`, plus
   `PAGE_PERMISSIONS` (`/lessons`, `/lessons/:id`, `/lessons/create`) and `ROLE_PERMISSIONS` grants in
   `src/lib/permission.config.ts` (View → all roles; Create/Edit/Delete/HistoryView → System +
   Headquarter). Then gate the screen's actions with `RoleGatedButton requiredPermission={…}`.
1. **Mock data** — in `src/app/api/_mock-db.ts`, add a detail layer for lesson masters:
   - `db.lessonContents.getDetail(id)` / `db.personalPlans.getDetail(id)` returning the full
     `LessonContentDetail` shape (images, description, internal memo, restriction set, time/pricing,
     `usage_count`, `schedule_total`, status, `lesson_type`).
   - `db.lessonContentSchedules` (recurring patterns + sessions, keyed by master id).
   - `db.lessonContentHistory` (change-log entries, keyed by master id).
   - Seed ≥ 3 stores and include: a studio record, a personal (`PLN-*`) record, an inactive/soft-deleted
     record, an in-use (`usage_count > 0`) record, an unused (`usage_count === 0`) record, a pay-per-use
     (`pricing_type: 'paid'`) record, a no-restriction record, and a multi-instructor schedule.
2. **Zod schemas** — create `src/app/api/_schemas/lesson-content-detail.schema.ts` with
   `LessonContentDetailSchema`, `LessonImageSchema`, `RestrictionSetSchema`, `ScheduleSummarySchema`
   (+ `RecurringPatternSchema`, `ScheduleSessionSchema`, `InstructorRefSchema`), `ChangeHistorySchema`
   (+ `ChangeHistoryEntrySchema`), and the three `Get*ResponseSchema`s. Reuse the enums from
   `lesson-content.schema.ts` (`LessonBrandSchema`, `LessonContentStatusSchema`, `LessonPricingTypeSchema`).
3. **Mock routes** — create `src/app/api/crm/lesson-contents/[id]/route.ts`,
   `.../[id]/schedules/route.ts`, and `.../[id]/history/route.ts` (`registerRoute()` + `GET`, with a
   404 branch when the master is not found), then add all three imports to `src/app/api/_routes/index.ts`.
4. **Generate client** — `npm run generate-client` (or `npm run generate-api`) to regenerate
   `src/lib/api/types.gen.ts` and `react-query.gen.ts` (option-factories + query keys). Never edit
   `src/lib/api/` by hand. Components import the generated types from `types.gen.ts` directly — do not
   create local `.type.ts` view types.
5. **Detail-only constants** — create `src/app/(private)/lessons/[id]/_constants/constants.ts`
   (status tone map, lesson-type badge label/style, history action labels, capacity-tone helper).
6. **Nav hook** — create `src/app/(private)/lessons/[id]/_hooks/use-lesson-detail-nav.ts`
   (active `tab` + `from` context via search params; `tab=history` coerced to `info` when role-gated off).
7. **Components** — build the `_components/` listed in `plan.md` (skeleton, header actions, info tab,
   gallery, description, status card, basic-info card, restriction card, recent-schedule card,
   schedule sheet, internal-memo card, history tab, deactivate dialog, delete dialog).
8. **Page** — replace `src/app/(private)/lessons/[id]/page.tsx` with the `'use client'` detail page
   (`useQuery` → skeleton → `DataStateBoundary` for error/not-found → `PageHeader` + `Tabs`). The route
   is already registered in `src/lib/routes/routes.config.ts` (no regeneration needed).

## Run

```bash
npm run dev
# open http://localhost:3000/lessons → click a row → /lessons/[id]
# direct: http://localhost:3000/lessons/LSN-0001  (and a PLN-* id for the personal variant)
```

## Manual verification (maps to spec Success Criteria)

| Step                                                  | Expected                                                         | Spec           |
| ----------------------------------------------------- | ---------------------------------------------------------------- | -------------- |
| Open `/lessons/[id]` (studio)                         | Title, 有効 badge, Studio type badge, all read-only cards render | SC-001         |
| Open a `PLN-*` id                                     | Basic-info shows セッション時間 (vs 実施時間 for studio)         | SC-001         |
| Click thumbnails / prev-next arrows                   | Main image + counter update; arrows hidden when only 1 image     | SC-002         |
| View recent-schedule card                             | Top 3 sessions + total badge; rows navigate to reservations      | SC-003         |
| Click "全{n}件を表示"                                 | Sheet opens with recurring summary + full session list           | SC-003         |
| Click an instructor link (sheet)                      | Navigates to D-04 instructor master (target page out of scope)   | SC-003         |
| As Headquarter/System                                 | Edit / Duplicate / Delete active; 変更履歴 tab visible           | SC-004, SC-005 |
| As Manager/Staff/Trainer/Observer                     | Edit / Duplicate / Delete disabled with tooltip; no history tab  | SC-004, SC-005 |
| Click 無効化する (HQ/System, active master)           | Deactivate dialog; reason required before confirm                | SC-006         |
| Open an inactive/soft-deleted master                  | Inactive status badge/card + 有効化する control                  | SC-001         |
| Open delete dialog on in-use master (`usage_count>0`) | Blocking alert + disabled confirm + link to in-use schedules     | SC-007         |
| Open delete dialog on unused master                   | Required reason; confirm enabled                                 | SC-007         |
| Click back link (default vs `?from=schedule`)         | Returns to `/lessons` or schedule context                        | SC-008         |
| First load                                            | Skeleton loading state shows                                     | FR-003-P1-22   |
| Unknown id / forced API failure                       | Not-found / error state shows                                    | FR-003-P1-23   |

## Quality gates (Definition of Done)

```bash
npm run lint        # 0 errors
npx tsc --noEmit    # exits 0
# contract tests for the 3 new mock routes (happy path + 404/error path)
```

## Notes

- Use `navigate()` from `@/lib/routes/routes.util` for all links — no raw `router.push` strings.
- Loading via `LessonDetailSkeleton`; error/not-found via `DataStateBoundary`.
- Action gating via `RoleGatedButton requiredPermission={Permission.LessonContents*}` + `useAuthUser()` (D-02 set).
- Gallery images via `next/image` (Principle VI); status block via `common/status-card.tsx`.
- Lifecycle dialogs are UI-only in Phase 1 (validate reason → toast → close; no backend write).
- Gender/age/count restrictions are intentionally NOT rendered (Q2). History tab uses a plain `<Table>`.
- All user-visible labels in Japanese; identifiers/comments in English. No `any`; no global state store.
