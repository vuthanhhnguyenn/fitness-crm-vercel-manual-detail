# Phase 1 Data Model: Lesson Content Master Detail Display

**Feature**: 008-lesson-content-detail | **Date**: 2026-06-26

Entities derive from the spec's Key Entities, the Component Hierarchy, and FR-003-P1-01..23. All
shapes are expressed as Zod schemas in `src/app/api/_schemas/lesson-content-detail.schema.ts` (mock
source of truth) and surface to the client via generated `types.gen.ts`. Components consume those
generated types directly — **no local view/`.type.ts` files are created**. No `any`. Field names use
snake_case to match existing mock/query conventions (`crm/members`, `crm/lesson-contents`). Reused
enums (`LessonBrandSchema`, `LessonContentStatusSchema`, `LessonPricingTypeSchema`) are imported from
the existing `lesson-content.schema.ts`.

---

## Entity: LessonContentDetail (unified master detail)

Returned by `GET /api/crm/lesson-contents/{id}`. One shape covers studio, body care, and personal
records, discriminated by `lesson_type`. The `duration` row is labeled 実施時間 for studio/bodycare
and セッション時間 for personal (label chosen client-side from `lesson_type`).

| Field            | Type                                      | Required | Notes                                                                              |
| ---------------- | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `id`             | string                                    | yes      | Master ID (`LSN-*` studio/bodycare, `PLN-*` personal)                              |
| `name`           | string                                    | yes      | Lesson name (ja); screen title (max 255)                                           |
| `lesson_type`    | enum `studio` \| `personal` \| `bodycare` | yes      | Drives type badge + time-row label                                                 |
| `brand`          | enum `joyfit` \| `fit365`                 | yes      | Basic-info card                                                                    |
| `status`         | enum `active` \| `inactive`               | yes      | `inactive` == soft-deleted/retained (Q4); drives badge + status card               |
| `duration`       | number (minutes)                          | yes      | 実施時間 / セッション時間                                                          |
| `pricing_type`   | enum `included` \| `paid`                 | yes      | Basic-info card; gates per-use fee row                                             |
| `per_use_fee`    | number (yen)                              | no       | Restriction/pricing card; shown only when `pricing_type === 'paid'` (有料（都次）) |
| `images`         | `LessonImage[]`                           | yes      | Gallery; may be length 1 (arrows hidden) or empty                                  |
| `description`    | string                                    | no       | Read-only description card (max 1000)                                              |
| `internal_memo`  | string                                    | no       | Internal memo card (会員には非表示)                                                |
| `restriction`    | `RestrictionSet`                          | yes      | Restriction & pricing card                                                         |
| `usage_count`    | number                                    | yes      | Schedules using this master; gates delete (FR-003-P1-15)                           |
| `schedule_total` | number                                    | yes      | Total schedule count for the recent-schedule badge                                 |
| `store_id`       | string                                    | yes      | Store scope                                                                        |
| `created_at`     | string (ISO)                              | no       | Status-card meta                                                                   |
| `updated_at`     | string (ISO)                              | no       | Status-card meta                                                                   |

**Validation rules**:

- `name` max 255 chars; `description` / `internal_memo` max 1000 chars.
- `duration` > 0; `per_use_fee` ≥ 0 and present only when `pricing_type === 'paid'`.
- `usage_count` ≥ 0; deletion is blocked (UI) when `usage_count > 0`.

### Sub-entity: LessonImage

| Field     | Type    | Required | Notes                                     |
| --------- | ------- | -------- | ----------------------------------------- |
| `url`     | string  | yes      | Image source (rendered via `next/image`)  |
| `caption` | string  | no       | Optional caption under the main image     |
| `is_main` | boolean | yes      | First/main image gets the "メイン" marker |

### Sub-entity: RestrictionSet

| Field                         | Type     | Required | Notes                                                       |
| ----------------------------- | -------- | -------- | ----------------------------------------------------------- |
| `restricted_main_contracts`   | string[] | yes      | Restricted main contract names; empty → "制限なし"          |
| `restricted_option_contracts` | string[] | yes      | Restricted option contract names; empty → "制限なし"        |
| `per_use_fee`                 | number   | no       | Mirror of detail `per_use_fee` (shown only for pay-per-use) |

> Per Q2 (resolved): `gender_limit`, `age_limit`, and `count_limit` are intentionally **omitted** from
> the detail render in Phase 1. They are NOT included in this Phase 1 schema (may be added later
> pending client confirmation).

---

## Entity: ScheduleSummary (recurring patterns + sessions)

Returned by `GET /api/crm/lesson-contents/{id}/schedules`. Powers the recent-schedule card (top 3
`sessions`) and the "show all" `Sheet` (all `recurring_patterns` + all `sessions`).

| Field                | Type                 | Required | Notes                                                |
| -------------------- | -------------------- | -------- | ---------------------------------------------------- |
| `recurring_patterns` | `RecurringPattern[]` | yes      | Sheet summary section                                |
| `sessions`           | `ScheduleSession[]`  | yes      | Per-session list (card shows top 3; sheet shows all) |
| `total`              | number               | yes      | Total session count (recent-card badge)              |

### Sub-entity: RecurringPattern

| Field         | Type              | Required | Notes                                           |
| ------------- | ----------------- | -------- | ----------------------------------------------- |
| `id`          | string            | yes      | Pattern ID                                      |
| `days`        | string[]          | yes      | Weekday labels (e.g. ["月","水"])               |
| `time`        | string            | yes      | Time range (e.g. "10:00–11:00")                 |
| `studio`      | string            | yes      | Studio/room name                                |
| `period`      | string            | no       | Active period (e.g. "2026/04–2026/09")          |
| `instructors` | `InstructorRef[]` | yes      | Multi-instructor (n名), each links to D-04 (Q3) |

### Sub-entity: ScheduleSession

| Field      | Type   | Required | Notes                                                            |
| ---------- | ------ | -------- | ---------------------------------------------------------------- |
| `id`       | string | yes      | Session/schedule ID; row → `/lesson-schedules/[id]/reservations` |
| `date`     | string | yes      | Date (ja-formatted via date-fns)                                 |
| `time`     | string | yes      | Time range                                                       |
| `studio`   | string | yes      | Studio/room name                                                 |
| `booked`   | number | yes      | Booked count; color-coded vs capacity                            |
| `capacity` | number | yes      | Capacity; full→destructive, ≥80%→warning, >0→success, 0→muted    |

### Sub-entity: InstructorRef

| Field           | Type   | Required | Notes                                        |
| --------------- | ------ | -------- | -------------------------------------------- |
| `instructor_id` | string | yes      | Link target (D-04 master; page out of scope) |
| `name`          | string | yes      | Display label                                |

---

## Entity: ChangeHistory (change-log)

Returned by `GET /api/crm/lesson-contents/{id}/history`. Rendered only for Headquarter/System in the
変更履歴 tab (FR-003-P1-18).

| Field     | Type                   | Required | Notes              |
| --------- | ---------------------- | -------- | ------------------ |
| `entries` | `ChangeHistoryEntry[]` | yes      | Table rows         |
| `total`   | number                 | yes      | Footer total count |

### Sub-entity: ChangeHistoryEntry

| Field       | Type   | Required | Notes                                     |
| ----------- | ------ | -------- | ----------------------------------------- |
| `id`        | string | yes      | Entry ID                                  |
| `timestamp` | string | yes      | 日時 (ISO; formatted via date-fns)        |
| `operator`  | string | yes      | 操作者                                    |
| `action`    | string | yes      | 操作 (e.g. 作成 / 編集 / 無効化)          |
| `detail`    | string | no       | 変更内容 (before → after summary or note) |

---

## Entity: DetailNavState (client-side, search-param state)

Owned by `use-lesson-detail-nav.ts`; serialized to URL search params (nuqs / `useSearchParams`).

| Param  | Parser                                     | Default | Applies to                                              |
| ------ | ------------------------------------------ | ------- | ------------------------------------------------------- |
| `tab`  | `parseAsStringEnum<'info' \| 'history'>`   | `info`  | active tab (history forced to `info` if role-gated off) |
| `from` | `parseAsStringEnum<'schedule'>` (optional) | —       | back-link + sidebar context (FR-003-P1-19)              |

`tab=history` is coerced back to `info` when `!canViewHistory` (mirrors `lockers/[id]` slots-tab guard).

## Entity: UserContext / Permissions (derived, read-only)

Derived from `useAuthUser()` — not persisted. Gating uses the **D-02 Lesson Content Management**
permission set (see research D3), not role literals.

| Field            | Source                                     | Gates                                                          |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `canEdit`        | `hasPermission(LessonContentsEdit)`        | Header Edit action (FR-003-P1-11/17)                           |
| `canDuplicate`   | `hasPermission(LessonContentsCreate)`      | Header Duplicate action (FR-003-P1-12/17)                      |
| `canDelete`      | `hasPermission(LessonContentsDelete)`      | Header Delete + status-card 無効化/有効化 (FR-003-P1-13/17/21) |
| `canViewHistory` | `hasPermission(LessonContentsHistoryView)` | 変更履歴 tab render + lazy fetch (FR-003-P1-18)                |

### Permission set (to be added during implementation)

`src/types/permission.type.ts` — new `Permission` enum entries (D-02):

| Permission                  | Value                          | Granted to                  |
| --------------------------- | ------------------------------ | --------------------------- |
| `LessonContentsView`        | `lesson-contents.view`         | All roles (System…Observer) |
| `LessonContentsCreate`      | `lesson-contents.create`       | System, Headquarter         |
| `LessonContentsEdit`        | `lesson-contents.edit`         | System, Headquarter         |
| `LessonContentsDelete`      | `lesson-contents.delete`       | System, Headquarter         |
| `LessonContentsHistoryView` | `lesson-contents.history-view` | System, Headquarter         |

`src/lib/permission.config.ts` — `PAGE_PERMISSIONS`: `/lessons` + `/lessons/:id` →
`LessonContentsView`, `/lessons/create` → `LessonContentsCreate`. `ROLE_PERMISSIONS` updated per the
grant table above.

---

## Relationships & flow

```
useAuthUser() ─▶ canManage / canViewHistory ─▶ gate header actions, status action, history tab

GET /api/crm/lesson-contents/{id}            ─▶ LessonContentDetail ─▶ header + Basic Info cards
GET /api/crm/lesson-contents/{id}/schedules  ─▶ ScheduleSummary     ─▶ recent-schedule card + Sheet
GET /api/crm/lesson-contents/{id}/history    ─▶ ChangeHistory       ─▶ history tab (lazy, role-gated)
```

- The detail query runs on load; schedules can be fetched eagerly for the top-3 card and reused by the
  sheet, or fetched on sheet-open (implementation choice — both are React Query against the same key).
- The history query is `enabled` only when `canViewHistory && tab === 'history'`.

## State transitions (UI-only in Phase 1; no persistence — research D9)

- **active → (deactivate)**: status card shows 無効化する → confirm dialog (reason required) → toast +
  close (no write). On a real backend the status would flip to `inactive` (soft-deleted).
- **inactive → (re-activate)**: status card shows 有効化する → confirm dialog → toast + close.
- **delete**: header Delete → dialog. `usage_count > 0` ⇒ blocked (disabled confirm + link to
  schedules); `usage_count === 0` ⇒ reason required ⇒ confirm enabled → toast + close.
- No status field is mutated client-side in Phase 1; the rendered status comes solely from the detail
  response.
