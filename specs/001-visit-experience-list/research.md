# Research: Visit/Experience Management — List Page

**Branch**: `001-visit-experience-list` | **Phase**: 0 — Outline & Research  
**Generated**: 2026-06-17

---

## Decision 1 — Routing: `/visit-experiences`

**Decision**: Use `/visit-experiences` (plural) as the route path.

**Rationale**: Consistent with existing plural-noun routes in this repo (`/members`, `/staffs`, `/stores`). The Next.js folder becomes `src/app/(private)/visit-experiences/`.

**Alternatives considered**:

- `/visit-experience` (singular) — rejected; inconsistent with project convention.
- `/visits` — rejected; too ambiguous (could be entry/exit visits, not just pre-membership experiences).

---

## Decision 2 — Pagination strategy: `useQuery` with cursor-based page params

**Decision**: Use `useQuery` (not `useInfiniteQuery`) for the list endpoint; user selects page and page size explicitly.

**Rationale**: The design mockup and spec both show traditional page-by-page navigation with a user-selectable page size (25/50/100/200). The constitution's `useInfiniteQuery` requirement targets _infinite-scroll_ list views only. A visit queue is not infinite-scroll — staff jump to arbitrary pages. `useQuery` + `nuqs` page/limit params is the correct fit.

**Alternatives considered**:

- `useInfiniteQuery` (infinite scroll) — rejected; design is explicit page navigation, not scroll-triggered loading.

---

## Decision 3 — URL state: nuqs for all filter + pagination params

**Decision**: All filter dimensions (status, brand_name, store_name, date_range, search) and pagination (page, limit) are synced to URL via `nuqs` `useQueryState` / `useQueryStates`.

**Rationale**: Constitution Principle V mandates `nuqs` for state that outlives a single component tree. URL params enable deep-linking and browser back/forward navigation for filter state.

**Param names and defaults**:

| Param        | Type     | Default    | Notes                                              |
| ------------ | -------- | ---------- | -------------------------------------------------- |
| `search`     | `string` | `""`       | Free-text; matches reservation ID or customer name |
| `status`     | `string` | `""` (all) | One of 7 status values or empty                    |
| `brand_name` | `string` | `""` (all) | `FIT365` or `JOYFIT` or empty                      |
| `store_name` | `string` | `""` (all) | Store name string or empty                         |
| `date_range` | `string` | `""` (all) | `today` \| `last_3_days` \| `last_7_days` or empty |
| `page`       | `number` | `1`        | 1-based                                            |
| `limit`      | `number` | `50`       | 25 \| 50 \| 100 \| 200                             |

**Alternatives considered**:

- React context for filter state — rejected; constitution forbids React context for non-ephemeral state.
- `useState` only — rejected; loses filter state on navigation.

---

## Decision 4 — Phase 1 React Query hooks: manual option-factories in `visit-experience.query.ts`

**Decision**: Create manual option-factory functions in `src/lib/api/@tanstack/visit-experience.query.ts` (separate file, not inside the auto-generated `react-query.gen.ts`). These call the local mock Route Handlers at `/api/crm/visit-experiences`. In Phase 2, this file is deleted and replaced by regenerating `react-query.gen.ts`.

**Rationale**: The auto-generated `react-query.gen.ts` must not be edited manually (constitution). The backend OpenAPI for visit-experiences doesn't exist yet. A dedicated Phase 1 file with the same public interface as what Phase 2 would generate allows components to be written once. The file is the only thing swapped in Phase 2.

**Function signatures (mirrors what Phase 2 would generate)**:

```typescript
getCrmVisitExperiencesOptions(options?: { query?: GetVisitExperiencesQuery })
getCrmVisitExperiencesSummaryOptions()
getCrmVisitExperiencesByIdOptions(options: { path: { id: string } })
```

**Alternatives considered**:

- Inline `queryOptions({...})` calls in components — rejected; duplicates query keys and makes Phase 2 migration harder.
- Editing `react-query.gen.ts` — rejected; auto-generated, will be overwritten on next regeneration.

---

## Decision 5 — Mock API data seeding

**Decision**: Add visit experience seed data to `src/app/api/_mock-db.ts`. Seed data must include ≥ 10 records covering: all 7 status values, ≥ 1 BL-match record, ≥ 2 brands (FIT365 + JOYFIT), ≥ 3 stores, and mixed date spread (today + past days).

**Rationale**: Constitution requires seed data covering ≥ 3 stores and ≥ 3 contract plans (generalised here to ≥ 3 stores and all 7 statuses) to exercise multi-path flows. BL-match records must be present to test the destructive row treatment.

**Alternatives considered**:

- Separate mock file per module — rejected; all mocks share `_mock-db.ts` to keep list and detail in sync.

---

## Decision 6 — Visit end column rendering (actual vs. scheduled)

**Decision**: The 見学終了 column renders `visit_end_actual_at` with suffix `（実績）` when non-null; falls back to `visit_end_scheduled_at` with suffix `（予定）`. Both values are pre-formatted datetime strings from the API.

**Rationale**: Directly derived from FR-018 and the design mockup. The label suffix makes the distinction explicit to staff without requiring them to remember field semantics.

**Alternatives considered**:

- Two separate columns for scheduled vs. actual — rejected; design uses a single combined column.

---

## Decision 7 — BL match treatment is independent of status

**Decision**: `bl_match: true` always activates row background (destructive/5 opacity) and `BL一致` badge, regardless of the `status` value.

**Rationale**: FR-009 states BL match must be applied "independently of the row's status". A row could be `申込受付` (normal) but still be BL-flagged. Treating them independently prevents missed detections.

**Alternatives considered**:

- Only show BL badge on specific statuses (e.g., `BL照合中`) — rejected; the status reflects workflow state, not risk level. A passed BL check could still have a BL record for audit purposes.

---

## Decision 8 — KPI summary endpoint is separate from the list endpoint

**Decision**: `GET /api/crm/visit-experiences/summary` is a dedicated endpoint returning the 4 KPI counts. It is NOT derived by summing items from the list endpoint client-side.

**Rationale**: KPI counts always reflect the **full same-day dataset** regardless of active filters on the list. Computing them from a filtered list response would give incorrect counts when filters are applied. A dedicated endpoint also allows independent caching of KPIs vs. the paginated list.

**Alternatives considered**:

- Compute KPIs from list results client-side — rejected; produces incorrect counts under active filters (FR-012 requires same-day totals, not filtered totals).
- Include KPI counts in the list response as a `summary` field — rejected; the list endpoint changes with pagination/filters; the summary must always represent the full day.

---

## Decision 9 — Filter panel open/close state: ephemeral React state (not URL)

**Decision**: `showFilters: boolean` (panel visibility) is local `useState` — NOT synced to URL.

**Rationale**: Panel open/close is ephemeral UI state (constitution allows React state here). It does not affect the data result and should not pollute the URL. Selected filter _values_ (status, brand, etc.) are still URL-synced per Decision 3.

**Alternatives considered**:

- nuqs for panel open state — rejected; constitution says nuqs for "state that outlives a single component tree"; panel visibility does not.

---

## Unresolved items

None. All clarifications from the spec were resolved through design review and constitution rules.
