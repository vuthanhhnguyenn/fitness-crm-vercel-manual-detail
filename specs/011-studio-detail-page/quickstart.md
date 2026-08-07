# Quickstart: D-03 Studio Management — FR-003 Studio Detail Display

**Goal**: Build and validate the Phase 1 studio detail page end-to-end with mock-backed data.

---

## Implementation Checklist

- [ ] Add detail schemas under `src/app/api/_schemas/` for studio detail response
- [ ] Extend `src/app/api/_mock-db.ts` with studio detail fields and linked collections
- [ ] Implement mock route: `GET /api/crm/studios/{id}`
- [ ] Implement studio detail page route and component composition
- [ ] Add role-gated header action rendering (edit/delete)
- [ ] Add linked lessons card with reservation-rate tier rendering
- [ ] Add studio images card and layout card branches
- [ ] Add utilization summary read-only card
- [ ] Add delete dialog with in-use guard disable behavior
- [ ] Add loading skeleton, not-found, and retryable error states
- [ ] Keep Change History tab title visible with empty content
- [ ] Add contract tests for detail endpoint (happy + error paths)

---

## Suggested File Targets

```text
src/
├── app/
│   ├── api/
│   │   ├── crm/
│   │   │   └── studios/
│   │   │       └── [id]/
│   │   │           └── route.ts                   # NEW: detail endpoint
│   │   ├── _schemas/
│   │   │   └── studio-detail.schema.ts            # NEW: shared zod schemas
│   │   └── _mock-db.ts                            # UPDATE: studio detail seeds + query method
│   ├── (private)/
│   │   └── studios/
│   │       └── [id]/
│   │           ├── page.tsx                       # NEW/UPDATE: detail page
│   │           └── _components/                   # NEW: card components + dialog + skeleton
│   └── ...
└── components/
    └── ...                                        # Reuse existing ui/common primitives
```

---

## Step-by-Step Flow

1. Define schema contract first

- Create Zod schemas for `StudioDetail`, `LinkedLessonSummary`, `LayoutPreview`, and `UtilizationSummary`.
- Export inferred TS types for reuse across route handlers and UI.

2. Seed mock detail data

- Add records covering: configured layout, not configured layout, in-use studio, zero linked lessons, inactive studio.
- Add a `getStudioDetailById(id, roleContext)` method with role-based visibility checks.

3. Implement `GET /api/crm/studios/{id}`

- Validate route param.
- Resolve role-scoped studio detail.
- Return 404 for unknown or out-of-scope IDs.
- Return shape defined in contracts.

4. Build detail page

- Fetch with React Query.
- Render states in order: loading skeleton, error retry, not found, data view.
- Render header badges and role-gated actions.

5. Implement required cards

- Basic information card including buffer value.
- Linked lessons card with threshold color tiers.
- Studio images card.
- Layout card with configured and not-configured branches.
- Utilization day/week/month summary card.

6. Implement delete dialog guard

- Open dialog from delete action.
- If `assigned_lesson_count > 0`, show warning and disable confirm button.
- Keep destructive flow outside scope (FR-005 remains out of scope).

7. Validate acceptance scenarios

- Run role matrix checks for action visibility.
- Verify linked lessons threshold rendering.
- Verify empty-state and error/not-found states.

---

## Verification Commands

```bash
npm run lint
npm run typecheck
npm run test
```

If the workspace does not provide `test`/`typecheck` scripts, run available equivalents and execute scenario-based manual QA for FR-003 acceptance criteria.

---

## Implementation Command Order (Phase 1)

```bash
# 1) Refresh OpenAPI from registered route schemas
npm run generate-openapi

# 2) Regenerate API client from the latest openapi.json
npm run generate-api

# 3) Validate production compilation
npm run build
```

## Verification Log

- 2026-07-02: `npm run build` completed successfully after moving studio detail seed/query source of truth into `src/app/api/_mock-db.ts`.
- 2026-07-02: lint/typecheck/test runs were intentionally skipped for this execution because the implementation request explicitly required build-only verification.

---

## Phase 2 Note

When stable backend OpenAPI for studio detail is published:

- Regenerate client with project API generation command.
- Replace Phase 1 mock endpoint usage with generated React Query option-factory for studio detail.
- Keep response shape parity to avoid UI refactor.
