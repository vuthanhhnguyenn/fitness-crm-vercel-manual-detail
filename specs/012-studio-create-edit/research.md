# Research: Studio Registration & Space Layout Management

**Date**: 2026-07-03 | **Branch**: `012-studio-create-edit`

## Unknowns Resolution

### U1: Studio create/edit POST/PUT API contract

- **Decision**: Create `POST /api/crm/studios` and `PUT /api/crm/studios/[id]` endpoints using `registerRoute()` pattern.
- **Rationale**: The OpenAPI spec currently only has `GET /crm/studios` and `GET /crm/studios/{id}`. Following OpenAPI-First principle (Constitution II), new endpoints must be declared before frontend implementation. The `stores/route.ts` POST handler serves as the reference pattern.
- **Alternatives considered**: Using a single upsert endpoint was considered but rejected because create and edit have different validation and response semantics.
- **Request body shape** (shared `UpsertStudioPayload`):
  - `name`: string (required)
  - `store_id`: string (required)
  - `studio_type`: enum `'normal' | 'hot_yoga' | 'virtual'`
  - `capacity`: number (required, max 500)
  - `buffer_value`: number (required, default 0, max 500)
  - `operating_hours`: string (required, format `"HH:mm~HH:mm"`)
  - `equipment_notes`: string | null (optional)
  - `internal_notes`: string | null (optional)
  - `status`: enum `'active' | 'inactive'`
  - `images`: array of `{ url: string; sort_order: number }` (optional)
  - `layout`: `{ rows: number; columns: number; cells: Array<{ x: number; y: number; kind: 'normal_seat' | 'equipment_seat' | 'fixed_object' | 'empty' }> }` (optional)
- **Response**: `{ id: string }` for create; `{ success: true }` for update.

### U2: Mock DB storage for space layout

- **Decision**: Use the existing layout data structure from the detail response and extend `db.studios` with `create()` and `update()` methods.
- **Rationale**: The detail response already models `layout: { state, rows, columns, cells }`. The seed structure is in `SEED_STUDIO_DETAILS` as a Record keyed by studio ID. New methods will write to an in-memory store that mirrors this structure.
- **Alternatives considered**: Creating a separate layout table was considered but adds unnecessary complexity for Phase 1. The layout is always part of studio data.

### U3: Image upload category for studio images

- **Decision**: Add `'studio'` category to the upload enum and use it in the studio form.
- **Rationale**: The spec says "follow same pattern as elsewhere." The existing `useImageUpload` hook supports categories. Adding `'studio'` keeps images organized vs. the catch-all `'other'` bucket.
- **Files to modify**:
  - `src/app/api/_schemas/upload.schema.ts` — Add `'studio'` to the Zod enum
  - `src/hooks/use-image-upload.hook.ts` — Add `'studio'` to `UploadCategory` type
  - Regenerate OpenAPI + SDK
- **Alternatives considered**: Reusing `'other'` category would work but mixes unrelated uploads in storage.

### U4: Edit form data fetching

- **Decision**: Fetch existing studio data via `GET /api/crm/studios/[id]` on the edit page server component, pass as props/`defaultValues` to the client form.
- **Rationale**: The detail endpoint already returns all needed fields: `{ data: StudioDetail, images: StudioImage[], layout: LayoutPreview }`. The edit page wraps a data-fetching server component that renders the client form.
- **Alternatives considered**: Client-side fetching with TanStack Query was considered but the RSC-first pattern (Constitution IV) prefers server-side data fetching for initial page load.

### U5: Navigation after create/edit

- **Decision**: After successful create/edit, navigate to `/studios/[id]` (the studio detail page).
- **Rationale**: The existing detail page at `/studios/[id]/page.tsx` is already built. The lesson form pattern uses `router.push(navigate('/lessons'))`; analogously the studio form uses `router.push(navigate('/studios/' + id))`.
- **Note**: The detail page's full implementation is out of scope per the spec but the route exists and renders basic info.

### U6: Store dropdown data source

- **Decision**: Fetch stores from `GET /api/crm/stores?limit=100` in the form component, map to dropdown options.
- **Rationale**: The endpoint exists, returns all stores with role-based scoping, and the response shape (`{ stores: Store[] }`) is sufficient for a select dropdown.
- **Alternatives considered**: Client-side fetch in a RSC query wrapper was considered but the dropdown is interactive so a TanStack Query call in the client component is appropriate.

## Technology Decisions

### Space layout grid rendering

- **Decision**: Use CSS Grid with dynamic `grid-template-columns: repeat(N, 1fr)` and `grid-template-rows: repeat(M, 1fr)`.
- **Rationale**: Pure Tailwind/CSS — no canvas or SVG library needed. Each cell is a `<button>` element for click handling. Matches the existing UI conventions (no extra dependencies per Constitution V).
- **Alternatives considered**: HTML5 Canvas (too low-level), SVG (over-engineered for cells), a grid library (adds dependency).

### Grid default and reset

- **Decision**: Default 2 rows × 8 columns; reset restores this with all cells set to `'empty'`.
- **Rationale**: Per spec FR-006-03 and FR-006-01 (default 2×8). Reset behavior clarified in edge cases section.

### Cell types

- **Decision**: Map spec types to internal enum: `normal_seat` (green/bookable), `equipment_seat` (orange), `fixed_object` (grey/pillar), `empty` (unused).
- **Rationale**: Matches `LayoutCellKind` in the existing detail schema and the SpaceReservationGrid pattern from `lesson-reservation.tsx`.

### Place mode selector

- **Decision**: Render as a row of 4 pill buttons with color indicators and ring highlight on selected.
- **Rationale**: Matches the spec description (FR-006-02) and the UI mockup pattern in `lesson-studio.tsx SpaceLayoutEditor`.

### Summary section

- **Decision**: Display 3 counts: 総スペース数 (rows × columns), 予約可能スペース (count of `normal_seat` cells), 利用不可スペース (count of `equipment_seat` + `fixed_object` cells).
- **Rationale**: Directly from spec FR-006-04.

### Confirmation dialog

- **Decision**: Use `AlertDialog` from shadcn/ui, modeled exactly after `LessonFormConfirmDialog`.
- **Rationale**: Constitution IV — use shadcn/ui primitives only. The lesson form's confirm dialog is the reference pattern.
- **Key fields to show**: スタジオ名, 所属店舗, スタジオ区分, 定員, 利用可能時間, ステータス (per FR-002-05).
