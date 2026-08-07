# Phase 1 Data Model: Lesson Content Master List & Search

**Feature**: 007-lesson-content-list | **Date**: 2026-06-25

Entities derive from the spec's Key Entities and FR-001-P1-02 column requirements. All shapes are
expressed as Zod schemas in `src/app/api/_schemas/lesson-content.schema.ts` (mock source of truth)
and surface to the client via generated `types.gen.ts`. Components consume those generated types
directly — **no local view/`.type.ts` files are created**. No `any`. Field names use snake_case to
match existing mock/query conventions (`crm/members`).

---

## Entity: LessonItem (Studio / Body care row)

Renders in `LessonTable` for the `studio` and `bodycare` tabs.

| Field                   | Type                              | Required | Notes                                            |
| ----------------------- | --------------------------------- | -------- | ------------------------------------------------ |
| `id`                    | string                            | yes      | Lesson master ID; searchable (partial), sortable |
| `name`                  | string                            | yes      | Lesson name (ja); searchable (partial), sortable |
| `brand`                 | enum `joyfit` \| `fit365`         | yes      | Studio/body care brand; filterable               |
| `duration`              | number (minutes)                  | yes      | Sortable                                         |
| `pricing_type`          | enum (e.g. `included` \| `paid`)  | yes      | Studio/body care pricing type; filterable        |
| `status`                | enum `active` \| `inactive`       | yes      | Filterable; drives include-deleted visibility    |
| `gender_restriction`    | enum `none` \| `male` \| `female` | yes      | Display + filterable                             |
| `lesson_category`       | string                            | yes      | Filterable (detailed filter axis)                |
| `category`              | string                            | yes      | Filterable (detailed filter axis)                |
| `store_id`              | string                            | yes      | Store scoping (FR-001-P1-07)                     |
| `is_deleted`            | boolean                           | yes      | Hidden unless "Include deleted" enabled          |
| `reservation_count`     | number                            | no       | Optional reservation metric (display only)       |
| `max_reservation_count` | number                            | no       | Optional reservation metric (display only)       |

**Validation rules**:

- `name` max 255 chars (app input constraint).
- `duration` > 0.
- Rows with `is_deleted === true` OR `status === 'inactive'` are excluded unless include-deleted is on.

## Entity: PersonalPlan (Personal training row)

Renders in `PersonalTrainingTable` for the `personal` tab.

| Field              | Type                        | Required | Notes                                          |
| ------------------ | --------------------------- | -------- | ---------------------------------------------- |
| `id`               | string                      | yes      | Plan ID; searchable (partial), sortable        |
| `name`             | string                      | yes      | Plan name (ja); searchable (partial), sortable |
| `description`      | string                      | no       | Display only                                   |
| `category`         | string                      | yes      | Plan category; filterable, sortable            |
| `duration`         | number (minutes)            | yes      | Sortable                                       |
| `price`            | number                      | yes      | Sortable                                       |
| `reservations`     | number                      | yes      | Current reservations                           |
| `max_reservations` | number                      | yes      | Capacity                                       |
| `brand`            | enum `joyfit` \| `fit365`   | yes      | Filterable                                     |
| `status`           | enum `active` \| `inactive` | yes      | Filterable                                     |
| `store_id`         | string                      | yes      | Store scoping                                  |
| `is_deleted`       | boolean                     | yes      | Hidden unless include-deleted on               |

**Validation rules**:

- `name` max 255 chars; `description` max 1000 chars.
- `price` ≥ 0; `reservations` ≤ `max_reservations`.

## Entity: ListFilterState (client-side, nuqs URL state)

Owned by `use-lessons-filters.ts`; serialized to URL search params.

| Param             | Parser                                                | Default  | Applies to                      |
| ----------------- | ----------------------------------------------------- | -------- | ------------------------------- |
| `tab`             | `parseAsStringEnum<'studio'\|'personal'\|'bodycare'>` | `studio` | active tab                      |
| `search`          | `parseAsString`                                       | `''`     | debounced text search (name/ID) |
| `lesson_category` | `parseAsArrayOf(parseAsString)`                       | `[]`     | studio/bodycare filter          |
| `category`        | `parseAsArrayOf(parseAsString)`                       | `[]`     | all tabs filter                 |
| `brand`           | `parseAsArrayOf(parseAsStringEnum)`                   | `[]`     | filter                          |
| `status`          | `parseAsArrayOf(parseAsStringEnum)`                   | `[]`     | filter                          |
| `include_deleted` | `parseAsBoolean`                                      | `false`  | include inactive/deleted        |
| `store_id`        | `parseAsString`                                       | `''`     | optional store scope            |
| `sort_by`         | `parseAsString`                                       | `id`     | active sort column              |
| `sort_order`      | `parseAsStringEnum<'asc'\|'desc'>`                    | `asc`    | sort direction                  |
| `page`            | `parseAsInteger`                                      | `1`      | pagination                      |

`clearFilters()` resets all of the above except `tab` to defaults (FR-001-P1-05 / SC-003).
`hasActiveFilters` is true when any filter/search deviates from default.

## Entity: UserScope (derived, read-only)

Derived from `useAuthUser()` — not persisted.

| Field          | Source                                  | Notes                                        |
| -------------- | --------------------------------------- | -------------------------------------------- |
| `role`         | `user.role`                             | Headquarter/System/Manager → all-store scope |
| `is_all_store` | derived boolean                         | true for the above roles                     |
| `store_id`     | `ListFilterState.store_id` (page-local) | optional explicit store filter               |

No global selected-store state exists; scope is computed per request and passed to the mock query.

---

## Relationships & flow

```
UserScope ─┐
           ├─▶ (query params) ─▶ GET /api/crm/lesson-contents ─▶ LessonItem[]  ─▶ LessonTable (studio, bodycare)
ListFilter ┘                  └─▶ GET /api/crm/personal-plans  ─▶ PersonalPlan[] ─▶ PersonalTrainingTable (personal)
```

- `tab` selects which table/endpoint is active (only the active tab's query runs).
- `search`, filters, `include_deleted`, `store_id`, `sort_*`, `page` are sent as query params; the
  mock handler filters → sorts → paginates and returns `{ data, pagination }`.

## State transitions

- **Status / deletion visibility**: `inactive` or `is_deleted` rows are hidden by default; enabling
  `include_deleted` reveals them (FR-001-P1-04). No mutation of status in Phase 1 (list scope only).
