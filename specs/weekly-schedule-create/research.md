# Research: Weekly Schedule Registration

> Phase 0 output — resolves all NEEDS CLARIFICATION from the Technical Context.

## R1: Existing Lesson-Schedule Schemas for Create/Update

**Decision**: Extend `lesson-schedule.schema.ts` with new schemas, do not create a separate file.

**Rationale**: The existing file only has read/query/response schemas. `CreateLessonScheduleRequestSchema` and `UpdateLessonScheduleRequestSchema` must be added from scratch, following the same `extendZodWithOpenApi(z)` + `.openapi({...})` pattern.

**Alternatives Considered**:

- Separate schema file → rejected because all lesson-schedule types should be co-located per project convention (see `member.schema.ts`).
- Inline in form schema → rejected because the API contract must be independently reusable.

**Key patterns observed**:

- Enum schemas for `LessonType`, `ScheduleStatus`
- `ScheduleChangeDraftSchema` shows the partial-update pattern
- All schemas use `.openapi()` with `title` and `description` in Japanese

## R2: Mock DB Creation Pattern

**Decision**: Follow the factory-builder pattern used by `createMember()` in `_mock-db.ts`.

**Rationale**: The mock DB uses a singleton pattern (`globalThis.__fitnessDb_v15`) with a `_seed()`/`_rows` approach. New schedules will be added via a `create()` method on the `db.lessonSchedules` namespace, auto-generating IDs and seeding with defaults.

**Key patterns**:

- DB singleton initialized at module level (line 13034)
- Each entity has `_rows`, `_seeded`, `_seed()`
- `create()` methods construct full objects from input + hardcoded defaults
- IDs auto-generated as `LS-{timestamp}-{random}` pattern

## R3: Instructor/Store/Studio Mock Data Availability

**Decision**: Use existing `SEED_RESERVATION_INSTRUCTORS` and store master data.

**Rationale**: 10 instructors already seeded across 4 stores in `SEED_RESERVATION_INSTRUCTORS`. Store master has 10 stores with full metadata. Studio data will need to be added (not yet present in mock DB).

**Studio data gap**: No studio master data exists in the mock DB. Must add `SEED_STUDIOS` with name, physical capacity, store_id mappings covering at least stores ST001-ST004.

**Instructor coverage**: Only 4 of 10 stores have instructors assigned. For the create form's instructor multi-select, need to either extend coverage or filter by store.

## R4: Form Validation Pattern (Zod + react-hook-form)

**Decision**: Follow the `campaign-form.schema.ts` pattern exactly.

**Rationale**: This is the established convention in the codebase:

```typescript
// Schema structure
export const formSchema = z.object({
  // String fields with .trim().min().max()
  // Enum fields with z.nativeEnum()
  // Date fields via helper function
  // Coerced numbers via z.coerce.number()
  // Cross-field validation via .superRefine()
})
export type FormValues = z.input<typeof formSchema>;
export type FormSubmitValues = z.output<typeof formSchema>;
export const emptyFormValues: FormValues = { ... };
```

**Additional patterns**:

- `useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: emptyFormValues })`
- Shadcn `<Form>` wrapper with `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `superRefine` for cross-field rules (date ranges, conditional requirements)

## R5: DataStateBoundary Usage Pattern

**Decision**: Wrap all data-fetching regions with `<DataStateBoundary>`.

**Rationale**: This is enforced by the constitution (Principle IV). Each query gets its own boundary with custom skeleton, error/retry, and empty state.

**Pattern**:

```tsx
<DataStateBoundary
  isLoading={query.isLoading}
  isError={query.isError}
  isEmpty={!query.data}
  onRetry={() => query.refetch()}
  skeleton={<CustomSkeleton />}
  emptyTitle="データがありません"
  emptyDescription="..."
>
  {query.data && <Content data={query.data} />}
</DataStateBoundary>
```

## R6: Route Auto-Discovery

**Decision**: Create `src/app/(private)/lesson-schedules/create/page.tsx` and `src/app/(private)/lesson-schedules/[id]/edit/page.tsx` — route generation is automatic.

**Rationale**: The `RouteScanner` recursively scans `src/app/(group)/` for `page.tsx` files. Both new pages will be auto-discovered and registered in `routes.config.ts` after running `npm run generate-routes`.
