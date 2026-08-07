# Research: E-02 Connected Equipment Form (Create / Edit)

**Feature**: `007-equipment-form`  
**Date**: 2026-06-25

All clarifications (Q1–Q7) were resolved in the spec (Session 2026-06-25). This document records the technical unknowns surfaced during planning and their resolutions.

---

## R1 — Controller picker source (Q7) — IMPLEMENTED

**Decision**: Add a minimal read-only `GET /crm/controllers` route (its **own resource**, not nested under equipment) backed by a new `db.controllers` array entity. The former `CONTROLLER_SUMMARY_SEED` `Record<number, ...>` was refactored into an array seed `SEED_CONTROLLERS` (each entry now carries `controller_number`), consistent with the other mock objects. `buildEquipmentDetail` resolves the controller summary from this array by `controller_number`. The form's `ControllerPicker` consumes `getCrmControllersOptions`; the selected controller's `controller_id` (and derived `controller_number`) is stored on the equipment record.

**Rationale**: Q7 mandates a picker bound to FR-007 controller records, but FR-007 (接点制御装置 management) is out of Phase 1 scope and exposes **no** controller list API. A thin read-only endpoint at `/crm/controllers` exposes the seed without building the full FR-007 module, and the array refactor matches repository mock conventions.

**Alternatives considered**:

- _Free-text input (prototype)_ — rejected; spec requires a picker tied to real controllers.
- _Full FR-007 controller CRUD_ — rejected; out of Phase 1 scope and unnecessary for the form.

**Scope note**: store-scoping the controller list is best-effort (seed has no explicit `store_id`; can be inferred from name/usage). Confirm filtering rule during tasks; default to returning all controllers if store mapping is unavailable.

---

## R2 — Persisting create/edit-only fields

**Decision**: Store the form-only fields `controller_id`, `remarks`, and a structured `usage_control_rule` in a parallel `_metaById` store. `controller_number` (the single field behind 接続先ポート番号 / 接点制御先番号) is written directly on the equipment row. `buildEquipmentDetail` prefers the stored structured rule and falls back to the existing `linked_contract_labels` parsing for legacy seed rows.

**Rationale**: The base `ConnectedEquipmentListItem` has `controller_number` but no `remarks` or structured rule; the detail derives the rule by parsing labels (006). That derivation is lossy and cannot round-trip user input from the form. Persisting the structured rule guarantees edit prefill matches what was saved (spec SC-004).

**Alternatives considered**:

- _Keep label-parsing only_ — rejected; cannot faithfully reproduce 主契約タイプ/オプション種別/都次オプション種別 selections on edit.

---

## R3 — Unsaved-changes / discard confirmation (FR-NAV-001)

**Decision**: There is **no** `use-unsaved-changes` hook in this repo (it exists only in the prototype). Implement the guard with react-hook-form `isDirty` plus a small shadcn `AlertDialog` triggered by キャンセル / back navigation, mirroring the prototype copy (`変更を破棄しますか？` / `編集を続ける` / `破棄する`). The existing locker form uses `isDirty` to gate submit but has no discard dialog; this feature adds the dialog to satisfy FR-NAV-001.

**Rationale**: Spec requires an explicit discard confirmation on navigation away with pending changes. Reusing `isDirty` keeps it within the approved stack (react-hook-form) without introducing a new dependency.

**Alternatives considered**:

- _Port the prototype `use-unsaved-changes` hook verbatim_ — acceptable, but a local dialog keyed off `isDirty` is simpler and consistent with the repo's form patterns. Final choice deferred to implementation; both satisfy FR-NAV-001.

---

## R4 — Single shared form vs two forms

**Decision**: One `EquipmentForm` component with a `mode: 'create' | 'edit'` prop and one `equipmentFormSchema`, consumed by both `create/page.tsx` and `[id]/edit/page.tsx`.

**Rationale**: FR-005 explicitly reuses FR-003's input checks. The locker module already proves this pattern (shared `LockerForm`, shared `lockerFormSchema`, mode-specific pages). Avoids duplicate schemas (constitution III bans duplicate shapes).

---

## R5 — Conditional required validation (Q4)

**Decision**: Use Zod `superRefine` on `equipmentFormSchema`: when a judgment checkbox boolean is `true`, its corresponding type field must be non-null/non-empty; otherwise it is optional. The form→body util strips values of unchecked judgments before submit.

> **Update 2026-06-30**: `authentication_method` and `controller_id` are now submit-blocking required. They use **field-level** `.nullable().refine(...)` (not `superRefine`) so the requirement attaches directly to each field — keeping the input type nullable (so `null` defaults still type-check) while blocking submit on 保存. `superRefine` is reserved for the genuinely cross-field conditional judgment-Select rules.

**Rationale**: Q4 requires Selects to be required only while their checkbox is checked, and hidden values discarded on save. `superRefine` expresses cross-field conditional requirements while keeping a single schema for both client and mock-route validation (constitution III).

**Alternatives considered**:

- _Discriminated unions per judgment_ — overcomplex for three independent optional booleans.

---

## R6 — Create/edit status history

**Decision**: Do **not** append status-history rows on create or edit in Phase 1.

**Rationale**: Consistent with 006 (`SEED_EQUIPMENT_HISTORY` is read-only; status changes don't write history). FR-012 history is out of this feature's scope. Revisit when history-write is implemented.

---

## Summary of Decisions

| ID  | Topic                    | Decision                                                                                                    |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| R1  | Controller picker source | New read-only `GET /crm/controllers` from `db.controllers` (array `SEED_CONTROLLERS`) — DONE                |
| R2  | Persisting new fields    | `controller_number` on the row; `controller_id`/`remarks`/structured rule in `_metaById`; detail prefers it |
| R3  | Unsaved-changes guard    | `isDirty` + shadcn `AlertDialog` (no repo hook exists)                                                      |
| R4  | Shared form              | One `EquipmentForm` + one schema for create & edit                                                          |
| R5  | Conditional required     | Zod `superRefine`; strip unchecked judgment values before submit                                            |
| R6  | History on create/edit   | Not written in Phase 1                                                                                      |
