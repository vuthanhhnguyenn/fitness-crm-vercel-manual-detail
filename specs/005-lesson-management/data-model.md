# Data Model: D-01 Lesson Schedule Management

## Entity: LessonSchedule

Represents a scheduled studio lesson or personal training session displayed in day, weekly, and list views.

### Fields

- `id`: Stable schedule identifier.
- `store_id`: Store identifier.
- `store_name`: Store display name.
- `date`: Lesson date in calendar-day form.
- `start_time`: Start time.
- `end_time`: End time.
- `name`: Lesson or session display name.
- `location`: Studio, booth, room, or training area.
- `instructor_id`: Instructor/trainer identifier.
- `instructor_name`: Instructor/trainer display name.
- `booked_count`: Number of booked reservations.
- `capacity`: Maximum available capacity for this schedule slot.
- `type`: `studio` or `personal`.
- `status`: `upcoming`, `in_progress`, or `completed`.
- `alert_label`: Optional label for required-action items.
- `is_public`: Whether the slot is visible for member booking.
- `payment_type`: Optional personal-session payment label: monthly plan, one-time 30-minute, or one-time 60-minute.
- `booked_member_names`: Optional limited list of booked member names for my-schedule display.

### Validation Rules

- `booked_count` must be greater than or equal to 0.
- `capacity` must be greater than 0.
- `booked_count` must not exceed `capacity`.
- `end_time` must be later than `start_time`.
- `payment_type` is present only for personal sessions.
- Internal/non-public schedules must remain visible in CRM list views.

### State Rules

- `completed` schedules are visually de-emphasized.
- `in_progress` schedules are highlighted in the day timeline.
- `upcoming` schedules appear after the current-time indicator when applicable.
- Schedules with `alert_label` are counted in required-action totals and visually marked.

## Entity: StoreScheduleSummary

Represents the all-store summary row used in headquarters or all-store context.

### Fields

- `store_id`: Store identifier.
- `store_name`: Store display name.
- `lesson_count_today`: Number of lessons/sessions today.
- `average_booking_rate`: Average booking rate percentage for the store.
- `assigned_staff_count`: Number of staff assigned today.
- `alert_count`: Required-action alert count.
- `in_progress_label`: Optional text for the lesson currently in progress.

### Validation Rules

- `lesson_count_today`, `assigned_staff_count`, and `alert_count` must be greater than or equal to 0.
- `average_booking_rate` must be between 0 and 100 inclusive.

## Entity: LessonScheduleKpiSummary

Represents KPI cards shown above the schedule.

### Fields

- `lesson_count_today`: Total number of lessons/sessions today.
- `studio_lesson_count_today`: Studio lesson count.
- `personal_session_count_today`: Personal session count.
- `booking_occupancy_rate`: Booking occupancy percentage.
- `booking_occupancy_delta`: Week-over-week percentage change.
- `change_count_today`: Total same-day change count.
- `cancellation_count_today`: Same-day cancellation count.
- `time_change_count_today`: Same-day time-change count.
- `instructor_change_count_today`: Same-day instructor-change count.
- `assigned_staff_count_today`: Total assigned staff count.
- `assigned_instructor_count_today`: Assigned instructor count.
- `assigned_trainer_count_today`: Assigned trainer count.

### Validation Rules

- All count fields must be greater than or equal to 0.
- `booking_occupancy_rate` must be between 0 and 100 inclusive.

## Entity: AreaScheduleKpiSummary

Represents KPI cards shown in all-store summary mode.

### Fields

- `managed_store_count`: Number of managed stores.
- `required_action_alert_count`: Total alert count across displayed stores.
- `abnormal_store_count`: Number of stores with one or more alerts.

### Validation Rules

- All fields must be greater than or equal to 0.

## Entity: LessonScheduleQuery

Represents user-selected filters and sorting criteria for schedule data.

### Fields

- `axis`: `store` or `my_schedule`.
- `view_mode`: `day`, `week`, or `list`.
- `date`: Selected date for day view.
- `week_start`: Monday date for weekly/list contexts.
- `store_id`: Store identifier or `all`.
- `studio`: Studio/location filter value or `all`.
- `instructor_id`: Instructor/trainer filter value or `all`.
- `focused_store_id`: Focused store identifier in all-store summary mode.
- `sort_by`: Optional sort key for sortable tables.
- `sort_order`: Optional `asc` or `desc`.

### Validation Rules

- `axis=store` is not allowed for Trainer users.
- `store_id=all` is available only when current store context is all stores.
- `sort_order` is required when `sort_by` is present.
- `date` is required for day view.
- `week_start` is required for weekly and list view.

## Entity: ScheduleChangeDraft

Represents the schedule-change modal state.

### Fields

- `schedule_id`: Target schedule identifier.
- `change_scope`: `this_only` or `all_after`.
- `start_time`: Proposed start time.
- `end_time`: Proposed end time.
- `instructor_id`: Proposed instructor/trainer identifier.
- `studio_id`: Proposed studio/location identifier.
- `reason`: Free-text reason shown in the modal.
- `send_notification`: Whether to send reservation-change notification.
- `affected_reservation_count`: Displayed number of affected reservations.
- `notification_summary`: Displayed notification content summary.
- `refund_required`: Whether refund processing is required.

### Validation Rules

- Phase 1 does not enforce additional validation on confirm.
- Confirming the draft completes the modal flow and returns the user to the schedule screen.
- Full reservation-impact persistence and refund behavior are out of scope for this list-screen feature.

## Relationships

- `LessonSchedule.store_id` relates to `StoreScheduleSummary.store_id`.
- `LessonSchedule` records are aggregated into `LessonScheduleKpiSummary`.
- `StoreScheduleSummary` rows are aggregated into `AreaScheduleKpiSummary`.
- `LessonScheduleQuery` filters `LessonSchedule` and `StoreScheduleSummary` responses.
- `ScheduleChangeDraft.schedule_id` targets one `LessonSchedule`.
