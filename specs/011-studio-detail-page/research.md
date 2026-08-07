# Phase 0 Research: D-03 Studio Management — FR-003 Studio Detail Display

**Goal**: Resolve open questions from the feature spec and establish implementation-ready design decisions for Phase 1.

---

## Decision D1: Detail Data Aggregation Shape

**Decision**: Use a single detail response contract for the studio page that includes basic information, layout block state, images, linked lessons summary, and utilization summary.

**Rationale**: The detail page presents these blocks together and must render a complete read-only view immediately after navigation from the list. A unified payload reduces round trips and keeps Phase 1 mock implementation straightforward.

**Alternatives considered**:

- Separate endpoints per card (linked lessons, utilization, images) — rejected for Phase 1 due to unnecessary complexity and additional loading coordination.
- Client-side stitching from list payload + derived data — rejected because list payload does not include all required fields.

---

## Decision D2: Zero Linked Lessons UI State (resolves [NEED CLARIFICATION])

**Decision**: Keep the linked lessons card visible and show an explicit empty-state message when there are zero linked lessons.

**Rationale**: Preserves page structure consistency while clearly communicating that linkage is currently empty rather than failed or hidden.

**Alternatives considered**:

- Hide the card entirely — rejected because users lose visibility of whether linked lessons are intentionally empty.
- Show empty table rows — rejected as ambiguous and less informative.

---

## Decision D3: Loading/Not-Found/Error States (resolves [NEED CLARIFICATION])

**Decision**: Implement canonical detail-page states: skeleton during loading, dedicated not-found state when studio ID is invalid, and non-blocking error state with retry action for API failures.

**Rationale**: Aligns with existing detail-page patterns in the repository and prevents blank or unstable detail rendering.

**Alternatives considered**:

- Global spinner only — rejected because constitution requires richer loading placeholders for primary content areas.
- Redirect to list on errors — rejected because users lose diagnostic context.

---

## Decision D4: Role-Gated Header Actions

**Decision**: Enforce header action visibility from the D-03 authority matrix in UI rendering and in route-level action checks for future delete/edit actions.

**Rationale**: Defense in depth; prevents accidental exposure of destructive actions to unauthorized roles.

**Alternatives considered**:

- UI-only gating — rejected because backend boundary checks are still required in Phase 2 and should be mirrored in Phase 1 contracts.

---

## Decision D5: Delete Guard Handling for In-Use Studios

**Decision**: Use `assigned_lesson_count` from detail response to disable confirm deletion in the dialog and present a blocking warning message.

**Rationale**: Requirement explicitly blocks destructive deletion when a studio is in use. This can be validated in Phase 1 without implementing full FR-005 backend deletion.

**Alternatives considered**:

- Call separate guard-check endpoint when dialog opens — deferred as unnecessary for Phase 1.

---

## Decision D6: Layout Preview / Not Configured Rendering

**Decision**: Model layout as a discriminated state (`configured` or `not_configured`) in the detail response. Render preview grid + legend only for configured state; render not-configured message + configure action otherwise.

**Rationale**: Makes conditional rendering explicit and keeps validation deterministic.

**Alternatives considered**:

- Infer state from nullable cells array only — rejected due to implicit behavior and edge-case ambiguity.

---

## Decision D7: Utilization Summary as Read-Only Snapshot

**Decision**: Include day/week/month utilization summary in the detail response as read-only values with optional trend metadata.

**Rationale**: FR-003 requires visibility, not editing. Read-only snapshot supports this scope cleanly.

**Alternatives considered**:

- Omit utilization until FR-007 implementation — rejected because current FR-003 scope explicitly keeps utilization visible.

---

## Decision D8: Change History Placeholder

**Decision**: Keep Change History tab title visible with intentionally empty content in Phase 1 and no active data fetch.

**Rationale**: Matches clarified scope and avoids partial pseudo-history implementation.

**Alternatives considered**:

- Hide tab until implemented — rejected due to explicit requirement to keep tab title visible.

---

## Decision D9: Schema and Contract Location

**Decision**: Define Studio detail schemas under `src/app/api/_schemas/` and expose a dedicated contract doc in `specs/011-studio-detail-page/contracts/`.

**Rationale**: Aligns with constitutional type-safety rules and existing module conventions.

**Alternatives considered**:

- Feature-local schema only in page components — rejected due to duplication and weaker API boundary guarantees.

---

## Decision D10: Phase 1 + Phase 2 Compatibility

**Decision**: Keep React Query consumption and response shape compatible with generated client usage in Phase 2.

**Rationale**: Reduces migration risk and supports the constitution's two-phase delivery model.

**Alternatives considered**:

- Temporary ad-hoc detail hook for Phase 1 only — rejected because it increases rework during integration.

---

## Unknowns Resolved

| Unknown from spec                         | Resolution                                             |
| ----------------------------------------- | ------------------------------------------------------ |
| Zero linked lessons presentation          | Keep card visible with explicit empty-state message    |
| Page-level loading/not-found/error states | Use skeleton + not-found + retryable error state       |
| Layout state fallback when not configured | Dedicated `not_configured` state with configure action |
| Delete guard source                       | `assigned_lesson_count` in detail payload              |

All current `NEED CLARIFICATION` items from the feature spec are resolved for planning.
