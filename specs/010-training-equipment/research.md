# Research: E-03 Training Equipment Management (Phase 1)

## Decision 1: Status-change reason is mandatory

- **Decision**: Enforce required validation for status-change reason in status update flows.
- **Rationale**: Source requirement FR-007 explicitly requires reason input; latest clarification resolved ambiguity and confirmed validation is required.
- **Alternatives considered**:
  - Keep optional reason to match current prototype visuals.
  - Require reason only for selected statuses.
  - Rejected because both alternatives break the approved requirement intent.

## Decision 2: Default sorting belongs to API/mock response

- **Decision**: Initial ordering is defined and applied in mock API response; frontend does not force initial default sort state.
- **Rationale**: Clarification resolved mismatch and preserves consistent migration path to real backend ordering in Phase 2.
- **Alternatives considered**:
  - Frontend applies default sort on first render.
  - Hybrid API + frontend ordering.
  - Rejected to avoid dual-source ordering behavior and future integration drift.

## Decision 3: Y-08 navigation deferred

- **Decision**: Do not implement route navigation from linked exercise names in Phase 1.
- **Rationale**: Clarification explicitly defers this dependency until Y-08 completion.
- **Alternatives considered**:
  - Add temporary placeholder route.
  - Add dead-link or disabled click behavior.
  - Rejected to avoid non-final navigation contracts.

## Decision 4: History handling is seeded read-only only

- **Decision**: Provide history retrieval/display only; no create/update/delete operations for history in Phase 1.
- **Rationale**: Feature scope explicitly limits history to seed display.
- **Alternatives considered**:
  - Full history mutation endpoints.
  - Soft edit/delete for admin.
  - Rejected as out of Phase 1 scope.

## Decision 5: Role-guard logic remains explicit in UI and mirrored in API

- **Decision**: Keep role-gated controls in UI and return authorization failures from mutation endpoints for protected operations.
- **Rationale**: Prevents accidental bypass and keeps behavior consistent with requirement role matrix.
- **Alternatives considered**:
  - UI-only role gate.
  - API-only role gate.
  - Rejected because either side alone can create inconsistent UX or unsafe assumptions.
