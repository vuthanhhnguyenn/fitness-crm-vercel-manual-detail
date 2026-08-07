# Research: Visit/Experience Management — Detail Page

**Branch**: `003-visit-experience-detail` | **Phase**: 0 — Outline & Research  
**Generated**: 2026-06-18

---

## Decision 1 — Detail type: `VisitExperienceDetail` extends `VisitExperience`

**Decision**: Define a new `VisitExperienceDetail` interface that extends the existing `VisitExperience` list type with detail-specific fields. The `GET /api/crm/visit-experiences/[id]` endpoint returns `VisitExperienceDetail`, not `VisitExperience`.

**Rationale**: The list page and detail page share a common core (id, status, bl_match, brand, store, reserved_at, visit times). Extending rather than replacing avoids duplication and keeps Phase 2 migration clear: only one type becomes generated. The extension pattern mirrors how the rest of the codebase handles list vs. detail (e.g., member list vs. member detail).

**New fields added in `VisitExperienceDetail`**:

| Field                  | Type                   | Nullable | Source                       |
| ---------------------- | ---------------------- | -------- | ---------------------------- |
| `customer_name_kana`   | `string`               | No       | Applicant furigana           |
| `birth_date`           | `string`               | No       | `YYYY/MM/DD` formatted       |
| `phone`                | `string \| null`       | Yes      | Null when info_missing       |
| `email`                | `string \| null`       | Yes      | Null when info_missing       |
| `address`              | `string \| null`       | Yes      | Null when info_missing       |
| `id_document_type`     | `string \| null`       | Yes      | Null when not yet submitted  |
| `id_document_verified` | `boolean`              | No       | eKYC-equivalent verification |
| `bl_match_reason`      | `string \| null`       | Yes      | Non-null only when bl_match  |
| `permit_issued_at`     | `string \| null`       | Yes      | Non-null after permit issued |
| `b01_auth_method`      | `string \| null`       | Yes      | Non-null when visiting/done  |
| `b01_gate`             | `string \| null`       | Yes      | Non-null when visiting/done  |
| `b01_entry_at`         | `string \| null`       | Yes      | Non-null when entry recorded |
| `b01_exit_at`          | `string \| null`       | Yes      | Non-null when exit recorded  |
| `timeline`             | `VisitTimelineEntry[]` | No       | Always present (≥ 1 entry)   |

**Alternatives considered**:

- Separate `VisitExperienceDetail` flat type (no extension) — rejected; would duplicate the 10 list fields and require two separate mock DB collections.
- Embedding detail fields into `VisitExperience` — rejected; would bloat the list response with large payload (timeline array) on every list row.

---

## Decision 2 — Permit action: `POST` mutation with `invalidateQueries`

**Decision**: Issue the visit permit via a `useMutation` hook calling `POST /api/crm/visit-experiences/[id]/permit`. On success, call `queryClient.invalidateQueries` for the detail query key, triggering a re-fetch that returns the updated record (status → `visiting`, `permit_issued_at` set, timeline entry appended).

**Rationale**: Constitution Principle V mandates `useMutation` for all data modification operations. Invalidation-based refetch is simpler and more correct than optimistic updates for this case: the permit transitions multiple fields simultaneously (status, permit_issued_at, b01_gate, timeline) and the server (mock) is the authoritative source of truth after the transition.

**Why not optimistic update**: The permit action changes the component's entire display mode (操作 panel swaps from permit buttons to in-progress state). An optimistic partial update would require maintaining a local copy of the full state transition — more complex than a refetch, with higher risk of UI desync.

**Alternatives considered**:

- Optimistic update with `onMutate` / `onError` rollback — rejected; too many simultaneous field changes to track reliably.
- Direct `useState` local update of the record — rejected; violates Principle V (no client-side state for server data).

---

## Decision 3 — Remaining time countdown: client-side `useEffect` timer

**Decision**: The 残り時間 countdown (visible only in `visiting` state) is computed client-side from `visit_start_at + 30 minutes - now`, updated every second via `setInterval` inside a `useEffect`. It is ephemeral UI state (`useState`) — not synced to URL or React Query.

**Rationale**: Constitution Principle V permits React state for "ephemeral UI state". A countdown timer is purely presentational and does not affect data fetching. Syncing to URL would serve no purpose. The 30-minute limit is a fixed business rule (FR-S001 spec), not a server-provided value, so the client can compute it entirely from `permit_issued_at`.

**Countdown formula**: `remaining = (permit_issued_at_ms + 30 * 60 * 1000) - Date.now()`. When `remaining ≤ 0`, display `"00:00"`.

**Alternatives considered**:

- Server-sent remaining time field — rejected; Phase 1 has no real-time server push. The field would stale immediately.
- Polling via `useQuery` with `refetchInterval` — rejected; overkill for a simple countdown; would send API requests every second.

---

## Decision 4 — Permit confirmation: shadcn `AlertDialog`

**Decision**: The visit permit confirmation uses the existing shadcn/ui `AlertDialog` component. No custom dialog component is introduced.

**Rationale**: The design shows a standard confirm/cancel pattern with a title, description, and two action buttons — a textbook `AlertDialog` use case. The component already exists in `src/components/ui/alert-dialog.tsx`.

**Alternatives considered**:

- Custom modal — rejected; no custom modal needed, shadcn `AlertDialog` matches the design exactly.
- Inline confirmation (two-click button without modal) — rejected; the design shows a modal dialog.

---

## Decision 5 — Two-column layout: CSS `flex` with sticky right column

**Decision**: The 60%/40% two-column layout is implemented with a `flex` container where the right column has `sticky top-6` positioning. This is CSS-native sticky positioning — no JavaScript scroll handler required.

**Rationale**: The design prototype uses `sticky top-6` on the right column wrapper. CSS `position: sticky` within an overflow-y scrolling parent (`main`) achieves the intended behaviour without JS. The parent `main` element must have `overflow-y: auto` and a bounded height (already the case in the shared layout).

**Alternatives considered**:

- JavaScript scroll-based sticky — rejected; CSS `position: sticky` is simpler and more performant.
- Fixed positioning — rejected; would require manual offset calculation and break at narrow viewports.

---

## Decision 6 — Timeline state: server-owned via `invalidateQueries`

**Decision**: The timeline array is owned by the server (mock DB). After permit issuance, the updated record (with the new timeline entry appended) is returned from the mock and the component re-renders via `invalidateQueries`. No local timeline state is maintained in the component.

**Rationale**: Keeping the timeline server-authoritative avoids the need for a separate client-side timeline `useState`. The mock `POST /permit` route appends the new entry before returning the updated `VisitExperienceDetail`. This matches how Phase 2 would work — the real backend owns the audit trail.

**Alternatives considered**:

- Local `useState` timeline append (as seen in the design prototype) — rejected; violates Principle V. The prototype used local state only because it was a static prototype with no API layer.

---

## Decision 7 — Phase 1 detail query: extend `visit-experience.query.ts`

**Decision**: Add `getCrmVisitExperienceDetailOptions(id: string)` and `usePermitMutation(id: string)` to the existing `src/lib/api/@tanstack/visit-experience.query.ts` file. Do not create a new query file.

**Rationale**: All visit-experience React Query functions live in one file. Splitting by list/detail would create cross-file query key dependencies and complicate Phase 2 migration (one file to delete vs. two).

**Alternatives considered**:

- Separate `visit-experience-detail.query.ts` — rejected; increases cognitive overhead without benefit; Phase 2 migration deletes the whole file anyway.

---

## Decision 8 — Seed data: extend existing `SEED_VISIT_EXPERIENCES` with detail fields

**Decision**: Update `src/app/api/_mock-db.ts` to change the seed array type from `VisitExperience[]` to `VisitExperienceDetail[]` and add detail fields to each existing record. The mock DB `visitExperiences` collection stores `VisitExperienceDetail` objects. The list endpoint strips detail fields when serializing the list response.

**Rationale**: A single source of truth for visit experience records avoids seed duplication. The list endpoint already projects only `VisitExperience` fields. Having the DB store the richer type means the detail endpoint can return a full record with no joins or secondary lookups.

**Minimum seed coverage for detail**:

- ≥ 1 record per state variant: `application_received` (default), `info_missing`, `bl_checking` (with `bl_match: true`), `visiting`, `visit_completed`, `membership_applied`, `cancelled`
- All `visiting` records have `permit_issued_at`, `b01_gate`, `b01_auth_method`, `b01_entry_at` populated
- All `visit_completed` records have `b01_exit_at` populated
- ≥ 1 `info_missing` record with `phone = null`, `address = null`, `id_document_verified = false`
- ≥ 1 `bl_checking` record with `bl_match: true` and `bl_match_reason` populated
- Every record has ≥ 2 timeline entries

**Alternatives considered**:

- Separate detail seed array — rejected; would go out of sync with the list seed and require the mock DB to maintain two collections for the same domain entity.

---

## Unresolved Items

None. All clarifications from the spec were resolved through design review, existing codebase patterns, and constitution rules.
