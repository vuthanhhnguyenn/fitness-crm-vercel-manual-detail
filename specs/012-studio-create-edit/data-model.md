# Data Model: Studio Registration & Space Layout

## Entity: Studio

Represents a physical room/space within a store where lessons are conducted.

| Field             | Type     | Required | Default                         | Max | Notes                                 |
| ----------------- | -------- | -------- | ------------------------------- | --- | ------------------------------------- |
| `id`              | `string` | auto     | auto-generated (e.g. `STU-{N}`) | —   | Primary key                           |
| `name`            | `string` | Yes      | —                               | —   | Studio name                           |
| `store_id`        | `string` | Yes      | —                               | —   | FK to Store                           |
| `studio_type`     | `enum`   | Yes      | —                               | —   | `normal` / `hot_yoga` / `virtual`     |
| `capacity`        | `number` | Yes      | —                               | 500 | Physical capacity (定員)              |
| `buffer_value`    | `number` | Yes      | 0                               | 500 | Buffer/overflow capacity (バッファ値) |
| `operating_hours` | `string` | Yes      | —                               | —   | Format: `"HH:mm~HH:mm"`               |
| `equipment_notes` | `string` | No       | null                            | —   | Equipment/facilities notes            |
| `internal_notes`  | `string` | No       | null                            | —   | Internal admin notes                  |
| `status`          | `enum`   | Yes      | `active`                        | —   | `active` / `inactive`                 |
| `created_at`      | `string` | auto     | ISO 8601                        | —   | Timestamp                             |
| `updated_at`      | `string` | auto     | ISO 8601                        | —   | Timestamp                             |

### State Transitions

```
[create] → active
active ↔ inactive  (via toggle)
[delete] → (soft-delete / hard-delete TBD — out of scope for Phase 1)
```

## Entity: StudioImage

| Field        | Type     | Required | Notes                   |
| ------------ | -------- | -------- | ----------------------- |
| `image_id`   | `string` | auto     | UUID                    |
| `studio_id`  | `string` | Yes      | FK to Studio            |
| `url`        | `string` | Yes      | Uploaded image URL      |
| `alt`        | `string` | No       | Alt text                |
| `sort_order` | `number` | Yes      | Display order (1-based) |

## Entity: SpaceLayout

Embedded within Studio (not a separate table in Phase 1).

| Field     | Type           | Required | Default     | Notes                 |
| --------- | -------------- | -------- | ----------- | --------------------- |
| `rows`    | `number`       | Yes      | 2           | 2–5                   |
| `columns` | `number`       | Yes      | 8           | 6, 8, or 10           |
| `cells`   | `LayoutCell[]` | Yes      | empty array | Grid cell definitions |

### LayoutCell

| Field  | Type     | Allowed Values                                              |
| ------ | -------- | ----------------------------------------------------------- |
| `x`    | `number` | 0..columns-1                                                |
| `y`    | `number` | 0..rows-1                                                   |
| `kind` | `enum`   | `normal_seat` / `equipment_seat` / `fixed_object` / `empty` |

### Cell Type Semantics

| Kind             | Bookable | Color     | UI Label |
| ---------------- | -------- | --------- | -------- |
| `normal_seat`    | Yes      | Green     | 通常席   |
| `equipment_seat` | No       | Orange    | 器材席   |
| `fixed_object`   | No       | Grey      | 固定物   |
| `empty`          | No       | — (blank) | 未使用   |

### Validation Rules

1. `capacity` + `buffer_value` each ≤ 500.
2. `rows` ∈ {2, 3, 4, 5}, `columns` ∈ {6, 8, 10}.
3. All `cells` must have `x` in [0, columns-1] and `y` in [0, rows-1].
4. No duplicate (x, y) coordinates.
5. Studio name is required and non-empty.
6. `store_id` must reference an existing store.
7. `operating_hours` must match `HH:mm~HH:mm` format.

## Relationships

```
Store 1──N Studio
Studio 1──N StudioImage
Studio 1──1 SpaceLayout (embedded)
Studio 1──N Lesson (scheduled lessons — exists already, referenced by FK)
```
