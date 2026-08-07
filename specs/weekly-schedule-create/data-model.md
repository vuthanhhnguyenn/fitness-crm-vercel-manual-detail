# Data Model: Weekly Schedule Registration

> Phase 1 output — defines entities for create/update flows.

## 1. LessonSchedule (Create Request)

Represents the payload for creating a new lesson schedule.

| Field            | Type                                      | Required    | Validation                 | Notes                                        |
| ---------------- | ----------------------------------------- | ----------- | -------------------------- | -------------------------------------------- |
| `lesson_type`    | `'studio' \| 'personal'`                  | ✅          | —                          | Determines which fields are visible/required |
| `store_id`       | `string`                                  | ✅          | Must be valid store        | From store master combobox                   |
| `studio_id`      | `string`                                  | Conditional | Must be valid studio       | Required when `lesson_type = 'studio'`       |
| `course_type`    | `'30min' \| '60min' \| 'trial'`           | Conditional | —                          | Required when `lesson_type = 'personal'`     |
| `schedule_mode`  | `'single' \| 'recurring'`                 | ✅          | —                          | 単発 / 繰り返し                              |
| `date`           | `string` (YYYY-MM-DD)                     | ✅          | Not in past (create only)  | Single mode: specific date                   |
| `start_date`     | `string` (YYYY-MM-DD)                     | ✅          | —                          | Recurring mode: start date                   |
| `start_time`     | `string` (HH:mm)                          | ✅          | —                          | Time in 24h format                           |
| `repeat_type`    | `'weekly' \| 'biweekly' \| 'monthly'`     | Conditional | —                          | Required when `schedule_mode = 'recurring'`  |
| `days_of_week`   | `string[]` (0-6)                          | Conditional | 1-7 items                  | Required for weekly/biweekly. 0=Sun, 6=Sat   |
| `end_condition`  | `'by_date' \| 'by_count' \| 'indefinite'` | Conditional | —                          | Required when recurring                      |
| `end_date`       | `string` (YYYY-MM-DD)                     | Conditional | Must be after start_date   | Required when `end_condition = 'by_date'`    |
| `end_count`      | `number`                                  | Conditional | 1-100                      | Required when `end_condition = 'by_count'`   |
| `skip_holidays`  | `boolean`                                 | ✅          | —                          | Default: false                               |
| `lesson_id`      | `string`                                  | ✅          | Must be valid lesson       | Lesson content selection                     |
| `instructor_ids` | `string[]`                                | ✅          | Min 1, must be valid       | Multi-select from role-filtered list         |
| `capacity`       | `number`                                  | Conditional | ≤ studio physical capacity | Required when `lesson_type = 'studio'`       |
| `is_published`   | `boolean`                                 | ✅          | —                          | Publication toggle (Mode A/B)                |
| `trial_enabled`  | `boolean`                                 | ✅          | —                          | Default: false (studio only)                 |
| `trial_mode`     | `'inclusive' \| 'additional'`             | Conditional | —                          | Required when `trial_enabled = true`         |
| `trial_capacity` | `number`                                  | Conditional | 1-5                        | Required when `trial_enabled = true`         |

### State Transitions

```
Draft (form) → Active (submitted, `scheduled`) → Cancelled (if deleted)
                                                  → Completed (past date)
                                                  → In Progress (current time window)
```

## 2. RepeatTemplate (FR-013)

Represents a saved recurring pattern.

| Field           | Type                                      | Required         | Notes                     |
| --------------- | ----------------------------------------- | ---------------- | ------------------------- |
| `id`            | `string`                                  | System-generated | Auto-increment            |
| `name`          | `string`                                  | ✅               | User-chosen template name |
| `repeat_type`   | `'weekly' \| 'biweekly' \| 'monthly'`     | ✅               | —                         |
| `days_of_week`  | `number[]`                                | Conditional      | Not for monthly           |
| `end_condition` | `'by_date' \| 'by_count' \| 'indefinite'` | ✅               | —                         |
| `end_value`     | `string \| number \| null`                | Conditional      | Date string or count      |
| `skip_holidays` | `boolean`                                 | ✅               | —                         |
| `start_time`    | `string` (HH:mm)                          | ✅               | —                         |
| `store_id`      | `string`                                  | ✅               | —                         |
| `lesson_class`  | `'studio' \| 'personal'`                  | ✅               | —                         |
| `studio_id`     | `string`                                  | Conditional      | —                         |
| `lesson_id`     | `string`                                  | ✅               | —                         |

## 3. Instructor Assignment

Represents the link between a schedule and an instructor.

| Field           | Type     | Required | Notes                |
| --------------- | -------- | -------- | -------------------- |
| `schedule_id`   | `string` | ✅       | FK to LessonSchedule |
| `instructor_id` | `string` | ✅       | FK to User/Staff     |

No main/sub distinction — all instructors equal.

## 4. Trial Slot Configuration

Represents trial booking settings for studio lessons.

| Field         | Type                          | Required | Notes                |
| ------------- | ----------------------------- | -------- | -------------------- |
| `schedule_id` | `string`                      | ✅       | FK to LessonSchedule |
| `mode`        | `'inclusive' \| 'additional'` | ✅       | 内数 / 外数          |
| `capacity`    | `number`                      | ✅       | 1-5                  |

## Relationships

```text
LessonSchedule 1──* InstructorAssignment
LessonSchedule 0..1──1 TrialSlotConfig (studio only)
RepeatTemplate — independent entity (no FK to schedule)
```

## Validation Rules (Cross-Field)

| Rule                                                | Description                       |
| --------------------------------------------------- | --------------------------------- |
| Studio required when lesson_type=studio             | `superRefine` on form schema      |
| Course type required when lesson_type=personal      | `superRefine` on form schema      |
| Capacity ≤ studio physical capacity                 | Validated against selected studio |
| Repeat fields required when schedule_mode=recurring | Conditional validation block      |
| End_date > start_date                               | Date comparison in `superRefine`  |
| At least 1 instructor selected                      | Array min length check            |
| Trial fields required when trial_enabled=true       | Conditional validation block      |
| Holiday warning (not a validation error)            | Display-only warning banner       |
| Instructor conflict (not a validation error)        | Display-only conflict warning     |
