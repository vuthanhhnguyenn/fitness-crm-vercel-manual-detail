# Data Model: D-03 Studio Management — FR-003 Studio Detail Display

**Scope**: Entities and validation rules required for the studio detail page in Phase 1.

---

## Entity: StudioDetail

**Purpose**: Canonical detail entity for a selected studio.

| Field                    | Type           | Required | Validation                                | Notes                        |
| ------------------------ | -------------- | -------- | ----------------------------------------- | ---------------------------- |
| `id`                     | string         | yes      | non-empty                                 | Studio identifier            |
| `name`                   | string         | yes      | 1..100 chars                              | Display in header            |
| `studio_type`            | enum           | yes      | one of `studio_lesson`, `pt`, `body_care` | Display badge                |
| `status`                 | enum           | yes      | `active` or `inactive`                    | Display badge + status card  |
| `capacity`               | integer        | yes      | min 1                                     | Physical capacity (物理定員) |
| `buffer_value`           | integer        | yes      | min 0, default 0                          | Buffer value (バッファ値)    |
| `usage_hours`            | string         | yes      | non-empty                                 | Human-readable usage hours   |
| `store_id`               | string         | yes      | non-empty                                 | Parent store reference       |
| `store_name`             | string         | yes      | non-empty                                 | Display field                |
| `equipment_notes`        | string \| null | no       | max 1000 chars                            | Optional block               |
| `internal_notes`         | string \| null | no       | max 1000 chars                            | Optional block               |
| `created_at`             | string         | yes      | ISO-8601 datetime                         | Read-only metadata           |
| `updated_at`             | string         | yes      | ISO-8601 datetime                         | Read-only metadata           |
| `assigned_lesson_count`  | integer        | yes      | min 0                                     | Delete guard signal          |
| `change_history_enabled` | boolean        | yes      | reflects whether history entries exist    | UI signal for tab content    |

---

## Entity: LinkedLessonSummary

**Purpose**: Linked lessons card rows in studio detail.

| Field              | Type    | Required | Validation                    | Notes                      |
| ------------------ | ------- | -------- | ----------------------------- | -------------------------- |
| `lesson_id`        | string  | yes      | non-empty                     | Navigation target          |
| `lesson_name`      | string  | yes      | 1..120 chars                  | Row title                  |
| `category`         | string  | yes      | non-empty                     | Badge/text                 |
| `schedule_text`    | string  | yes      | non-empty                     | Human-readable schedule    |
| `reservation_rate` | integer | yes      | 0..100                        | Percentage                 |
| `reservation_tier` | enum    | yes      | `success`/`warning`/`default` | Derived by threshold rules |

**Threshold rules**:

- `reservation_rate >= 80` => `success`
- `reservation_rate >= 60 && < 80` => `warning`
- `< 60` => `default`

---

## Entity: StudioImage

**Purpose**: Image asset metadata for the studio images card.

| Field        | Type    | Required | Validation         | Notes              |
| ------------ | ------- | -------- | ------------------ | ------------------ |
| `image_id`   | string  | yes      | non-empty          | Stable key         |
| `url`        | string  | yes      | non-empty URL/path | Render thumbnail   |
| `alt`        | string  | yes      | 1..255 chars       | Accessibility text |
| `sort_order` | integer | yes      | min 0              | Display order      |

---

## Entity: LayoutPreview

**Purpose**: Conditional studio layout display state.

| Field            | Type            | Required | Validation                       | Notes                       |
| ---------------- | --------------- | -------- | -------------------------------- | --------------------------- |
| `state`          | enum            | yes      | `configured` or `not_configured` | Controls rendering branch   |
| `rows`           | integer \| null | no       | min 1 when configured            | Grid size                   |
| `columns`        | integer \| null | no       | min 1 when configured            | Grid size                   |
| `cells`          | array \| null   | no       | non-empty when configured        | Read-only layout cells      |
| `configure_path` | string          | yes      | non-empty                        | Navigation target for setup |

### Entity: LayoutCell

| Field  | Type    | Required | Validation                                    | Notes          |
| ------ | ------- | -------- | --------------------------------------------- | -------------- |
| `x`    | integer | yes      | min 0                                         | Column index   |
| `y`    | integer | yes      | min 0                                         | Row index      |
| `kind` | enum    | yes      | `normal_seat`/`equipment_seat`/`fixed_object` | Legend mapping |

---

## Entity: UtilizationSummary

**Purpose**: Read-only KPI snapshot in detail page.

| Field        | Type         | Required | Validation         | Notes                |
| ------------ | ------------ | -------- | ------------------ | -------------------- |
| `day_rate`   | number       | yes      | 0..100             | Percentage           |
| `week_rate`  | number       | yes      | 0..100             | Percentage           |
| `month_rate` | number       | yes      | 0..100             | Percentage           |
| `trend`      | enum \| null | no       | `up`/`down`/`flat` | Optional display cue |

---

## Entity: StudioActionPermissions

**Purpose**: Effective permission map for header actions.

| Role        | View | Edit | Delete |
| ----------- | ---- | ---- | ------ |
| System      | yes  | yes  | yes    |
| Headquarter | yes  | yes  | yes    |
| Manager     | yes  | yes  | yes    |
| Staff       | yes  | yes  | no     |
| Trainer     | yes  | no   | no     |
| Observer    | yes  | no   | no     |

---

## Entity: StudioChangeHistoryEntry

**Purpose**: Change-log row for the studio history tab.

| Field       | Type   | Required | Validation         | Notes                         |
| ----------- | ------ | -------- | ------------------ | ----------------------------- |
| `timestamp` | string | yes      | ISO-8601 datetime  | Display as `yyyy/MM/dd HH:mm` |
| `user`      | string | yes      | non-empty          | Operator name                 |
| `action`    | string | yes      | non-empty          | e.g. 作成 / 更新              |
| `diffs`     | array  | no       | field/before/after | Omitted for create actions    |
| `note`      | string | no       | optional           | Shown on create rows          |

---

## Response Model: GetStudioHistoryResponse

```typescript
interface GetStudioHistoryResponse {
  data: {
    entries: StudioChangeHistoryEntry[];
    total: number;
  };
}
```

---

## Response Model: GetStudioDetailResponse

```typescript
interface GetStudioDetailResponse {
  data: StudioDetail;
  linked_lessons: LinkedLessonSummary[];
  images: StudioImage[];
  layout: LayoutPreview;
  utilization: UtilizationSummary;
}
```

---

## State Transitions (Phase 1 scope)

- `studio.status`: displayed as-is; no status mutation is part of FR-003 Phase 1.
- `layout.state`: controls branch rendering only.
- `delete dialog`: confirm action disabled when `assigned_lesson_count > 0`.

---

## Validation Rules

- Capacity and buffer values must be non-negative integers, with capacity >= 1.
- Reservation rate must stay in range 0..100.
- All timestamps must be parseable ISO-8601 values.
- When `layout.state = configured`, `rows`, `columns`, and `cells` are required.
- When `layout.state = not_configured`, `rows`, `columns`, and `cells` must be null/empty.

---

## Phase 1 Seed Requirements

- At least one studio with configured layout and linked lessons.
- At least one studio with `layout.state = not_configured`.
- At least one studio with zero linked lessons.
- At least one studio with `assigned_lesson_count > 0` to test delete blocking.
- At least one inactive studio to verify status rendering.
