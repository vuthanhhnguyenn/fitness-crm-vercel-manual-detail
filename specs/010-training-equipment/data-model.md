# Data Model: E-03 Training Equipment Management (Phase 1)

## 1) TrainingEquipment

Represents a single equipment record managed by the CRM.

### Fields

- `id` (string, required, unique)
- `storeId` (string, required)
- `storeName` (string, required)
- `name` (string, required, 1..255)
- `toolType` (enum, required): `machine | cable_machine | smith_machine | barbell | dumbbell | kettlebell | resistance_band | trx | other`
- `quantity` (integer, required, min 1)
- `installationArea` (string, optional, max 255)
- `manufacturer` (string, optional, max 255)
- `modelNumber` (string, optional, max 255)
- `installedOn` (date string, optional)
- `status` (enum, required): `installed | maintenance | removed | discarded`
- `notes` (string, optional, max 1000)
- `linkedExerciseCount` (integer, derived)
- `lastUpdatedAt` (datetime string, required)
- `lastUpdatedBy` (string, required)
- `isDeleted` (boolean, default false)

### Validation Rules

- `name`, `toolType`, `quantity`, `storeId` are required on create.
- `status` defaults to `installed` on create when omitted.
- `quantity` must be integer >= 1.
- Soft delete is blocked if linked exercises exist.

## 2) EquipmentStatusHistoryEntry (Read-only in Phase 1)

Represents one seeded status transition record for display.

### Fields

- `id` (string, required, unique)
- `equipmentId` (string, required)
- `changedAt` (datetime string, required)
- `changedBy` (string, required)
- `fromStatus` (enum, required)
- `toStatus` (enum, required)
- `reason` (string, required, 1..1000)

### Validation Rules

- No CUD operations in Phase 1.
- Returned entries are sorted by `changedAt` desc in API response.

## 3) EquipmentExerciseLink

Association between training equipment and exercise.

### Fields

- `equipmentId` (string, required)
- `exerciseId` (string, required)
- `exerciseName` (string, required)
- `exerciseToolType` (enum/string, required)
- `difficulty` (enum/string, optional)
- `bodyPart` (enum/string, optional)
- `createdAt` (datetime string, required)

### Validation Rules

- Same pair (`equipmentId`, `exerciseId`) cannot be duplicated.
- Tool-type mismatch is allowed only when explicitly confirmed by user flow.
- Unlink removes only association, not exercise master.

## 4) StatusChangeRequest

Payload for status update operation.

### Fields

- `nextStatus` (enum, required)
- `reason` (string, required, 1..1000)

### Validation Rules

- `reason` is mandatory (per FR-015 resolution).
- Missing/blank reason returns validation error.

## 5) ListQuery

Filter/sort/pagination request model for list endpoint.

### Fields

- `storeId` (string, optional)
- `keyword` (string, optional)
- `toolType` (enum/string, optional)
- `status` (enum/string, optional; supports special `exclude_discarded`)
- `page` (integer, required, min 1)
- `pageSize` (integer, required; allowed: 25, 50, 100, 200)
- `sortBy` (string, optional)
- `sortOrder` (`asc | desc`, optional)

### Validation Rules

- If `sortBy` omitted, backend/mock applies default ordering.
- Frontend should not inject default sort on initial load.

## State Transitions

### Equipment status

- Allowed transitions in Phase 1:
  - `installed -> maintenance | removed | discarded`
  - `maintenance -> installed | removed | discarded`
  - `removed -> installed | discarded`
  - `discarded -> installed` (allowed only if business permits restore; otherwise reject with error)

All status transitions require non-empty `reason`.
