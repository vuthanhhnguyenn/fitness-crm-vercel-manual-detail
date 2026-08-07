# Data Model: D-01 FR-007 Lesson Reservation Detail

## Entity: Reservation

Represents a single booking made by a member for a specific session slot.

### Fields

- `id`: Unique reservation identifier (e.g., `R001`).
- `schedule_id`: Parent lesson schedule identifier.
- `member_id`: Member identifier.
- `member_name`: Member display name.
- `plan_type`: Contract plan type label (e.g., "月額8回", "月額4回").
- `space_number`: Assigned studio space number (nullable, auto-assigned).
- `reservation_date`: Date the reservation was made.
- `reservation_time`: Time the reservation was made.
- `status`: Reservation status: `confirmed` (予約済), `tentative` (仮予約), `attended` (出席確認済), `no_show` (無断キャンセル), `cancelled` (キャンセル済).
- `attendance_status`: Manual override attendance: `unconfirmed` (未確認), `confirmed` (出席確認済), `no_show` (無断キャンセル).
- `cancel_type`: When cancelled, the initiator type: `member`, `staff`, `instructor` (nullable).
- `penalty_active`: Whether the member has an active penalty.
- `penalty_end_date`: Penalty end date if active (nullable).
- `remaining_sessions`: Member's remaining session count at time of reservation.
- `sent_notification`: Whether a confirmation notification was sent.

### Validation Rules

- `status` must be one of the 5 defined states.
- `attendance_status` must be one of 3 defined options; only editable for non-cancelled reservations.
- `remaining_sessions` must be >= 0.
- A member with `remaining_sessions` = 0 cannot be added to a new reservation.
- A member with `penalty_active` = true cannot be added to a new reservation.
- `cancel_type` is present only when `status` is `cancelled`.

### State Transitions

```
confirmed ──→ attended     (via attendance dropdown: 出席確認済)
confirmed ──→ no_show      (via attendance dropdown: 無断キャンセル)
confirmed ──→ cancelled    (via cancel dialog: any cancel type)
tentative ──→ confirmed    (auto-conversion or manual)
tentative ──→ cancelled    (via cancel dialog)
tentative ──→ attended     (via attendance dropdown)
tentative ──→ no_show      (via attendance dropdown)
attended ─── (terminal)
no_show ──── (terminal)
cancelled ── (terminal; no further transitions)
```

---

## Entity: StudioSpace

Represents a single cell in the studio space reservation grid.

### Fields

- `id`: Space identifier (e.g., `S01`).
- `studio_id`: Studio identifier.
- `row`: Grid row position (0-indexed).
- `col`: Grid column position (0-indexed).
- `space_number`: Display label for the space.
- `type`: Space type: `available`, `reserved`, `equipment`, `fixed_structure`.
- `reservation_id`: Linked reservation ID when type is `reserved` (nullable).
- `member_name`: Member name when type is `reserved` (nullable).

### Validation Rules

- `row` and `col` positions must be non-negative.
- `type` must be one of the 4 defined types.
- Grid dimensions vary by studio configuration (e.g., 16 spaces in 8x2 layout).

---

## Entity: ReservationStats

Represents aggregated reservation statistics for a session.

### Fields

- `schedule_id`: Parent lesson schedule identifier.
- `total_capacity`: Total studio capacity.
- `total_reserved`: Number of booked reservations.
- `remaining_seats`: `total_capacity - total_reserved`.
- `status_breakdown`: Array of `{ status: ReservationStatus, count: number, percentage: number }`.

### Validation Rules

- `total_capacity` must be > 0.
- `total_reserved` must be between 0 and `total_capacity`.
- `percentage` values in `status_breakdown` must sum to 100 (with rounding tolerance).

---

## Entity: SessionMemo

Represents a textual note recorded by a trainer for a session.

### Fields

- `id`: Unique memo identifier.
- `schedule_id`: Parent lesson schedule identifier.
- `content`: Memo text content.
- `author_id`: Staff/trainer identifier.
- `author_name`: Staff/trainer display name.
- `created_at`: ISO8601 timestamp of creation.
- `updated_at`: ISO8601 timestamp of last update.

### Validation Rules

- `content` must be non-empty, max 1000 characters (per constitution textarea constraint).
- `author_id` must reference an existing staff/trainer.
- `created_at` must be a valid ISO8601 datetime.

---

## Entity: MemberLimitedProfile

Represents the limited member information displayed in the profile popover.

### Fields

- `member_id`: Member identifier.
- `name`: Member display name.
- `age`: Member age.
- `gender`: Member gender.
- `visit_frequency`: Visit frequency description (e.g., "週3回").
- `last_visit_date`: Last visit date (ISO8601).
- `lesson_history`: Array of `{ date: string, lesson_name: string, attendance_status: string }`.
- `body_data`: Object with `height`, `weight`, `body_fat_percentage` (nullable fields).
- `plan_type`: Contract plan type label.
- `remaining_sessions`: Remaining session count.
- `penalty_active`: Whether member has active penalty.
- `penalty_end_date`: Penalty end date if active (nullable).

### Privacy Rules

- MUST NOT include: address, phone number, email, contract/payment info (FR-015-02).
- `age` and `gender` are permitted per the spec's explicit inclusion.

---

## Entity: AddReservationDraft

Represents the in-progress state of the add-reservation dialog.

### Fields

- `schedule_id`: Target schedule identifier.
- `search_query`: Current member search text.
- `search_results`: Array of matched `MemberSearchResult` (id, name, remaining_sessions, penalty_status).
- `selected_members`: Array of member IDs pending addition.
- `send_notification`: Whether to send confirmation notification.
- `remaining_seats`: Updated remaining seats count.

### Validation Rules

- Members with `remaining_sessions` = 0 show a warning and cannot be added.
- Members with `penalty_active` = true show a warning and cannot be added.
- Selected members must not exceed `remaining_seats` count.

---

## Entity: CancelReservationDraft

Represents the state of the cancel-reservation dialog.

### Fields

- `reservation_id`: Target reservation identifier.
- `member_info`: Object with `member_name`, `plan_type`, `space_number`.
- `cancel_type`: Selected cancel type: `member`, `staff`, `instructor`.
- `send_notification`: Whether to send cancellation notification.
- `consequence_description`: Display text explaining the consequence of the selected cancel type.

### Validation Rules

- `cancel_type` is required before confirmation.
- Confirming the draft cancels the reservation and updates the list.

---

## Entity: ChangeInstructorDraft

Represents the state of the change-instructor dialog.

### Fields

- `schedule_id`: Target schedule identifier.
- `current_instructors`: Array of current instructor names/photos.
- `selected_instructor_ids`: Array of replacement instructor IDs (multi-select).
- `search_query`: Instructor search text.
- `search_results`: Array of matched instructors with name, photo_url, specialty.
- `reason`: Required change reason text.
- `send_notification`: Whether to notify affected members.
- `impact_summary`: Object with `affected_reservation_count`, `notification_content`, `refund_required`.

### Validation Rules

- At least one replacement instructor must be selected.
- `reason` is required (non-empty).
- Phase 1: Confirm completes the flow; full persistence deferred.

---

## Entity: ChangeTimeDraft

Represents the state of the change-time dialog.

### Fields

- `schedule_id`: Target schedule identifier.
- `current_start_time`: Current session start time.
- `current_end_time`: Current session end time.
- `new_start_time`: Proposed start time.
- `new_end_time`: Proposed end time.
- `studio_conflict_warning`: Warning text if the new time conflicts with another booking.
- `reason`: Required change reason text.
- `send_notification`: Whether to notify affected members.
- `impact_summary`: Object with `affected_reservation_count`, `notification_content`.

### Validation Rules

- `new_end_time` must be later than `new_start_time`.
- Phase 1: Confirm completes the flow; backend validation of studio conflicts deferred.

---

## Entity: ChangeStudioDraft

Represents the state of the change-studio dialog.

### Fields

- `schedule_id`: Target schedule identifier.
- `current_studio_name`: Current studio display name.
- `selected_studio_id`: Proposed studio identifier.
- `selected_studio_name`: Proposed studio display name.
- `search_query`: Studio search text.
- `search_results`: Array of matched studios with name, capacity, layout_description.
- `layout_change_warning`: Warning about space layout differences.
- `reason`: Required change reason text.
- `send_notification`: Whether to notify affected members.
- `impact_summary`: Object with `affected_reservation_count`, `notification_content`.

### Validation Rules

- A studio other than the current studio must be selected.
- `reason` is required.
- Phase 1: Confirm completes the flow; full relocation of reservations deferred.

---

## Entity: CancelLessonDraft

Represents the 3-step lesson cancellation wizard state.

### Fields

- `schedule_id`: Target schedule identifier.
- `current_step`: Wizard step: 1 (impact), 2 (reason), 3 (confirm).
- `scope`: Cancellation scope: `this_only` or `all_after`.
- `impact_summary`: Object with `affected_reservation_count`, `notification_count`, `refund_amount`.
- `cancel_reason`: Predefined reason selection.
- `cancel_reason_detail`: Free-text detail for the reason.
- `send_notification`: Whether to send cancellation notification.
- `process_refund`: Whether to process refunds.
- `notify_instructor`: Whether to notify the instructor.

### Validation Rules

- `scope` must be selected in Step 1.
- At minimum, a predefined `cancel_reason` must be selected in Step 2.
- Step 3 displays a read-only summary of all choices.
- Confirming Step 3 marks the lesson as cancelled.
- The wizard resets to Step 1 on next opening if closed midway.

---

## Relationships

- `Reservation.schedule_id` → Lesson Schedule (defined in 005 data model).
- `Reservation.member_id` → Member (defined in member schema).
- `StudioSpace.studio_id` → Studio (defined in store/studio schema).
- `StudioSpace.reservation_id` → `Reservation.id`.
- `SessionMemo.schedule_id` → Lesson Schedule.
- `MemberLimitedProfile.member_id` → Member.
- `ReservationStats` is an aggregation over `Reservation` records for a given `schedule_id`.
- `AddReservationDraft.selected_members` → `Reservation.member_id` on confirm.
