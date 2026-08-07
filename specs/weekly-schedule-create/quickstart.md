# Quickstart: Weekly Schedule Registration

## Prerequisites

- Node.js ≥ 24.0.0
- pnpm 10.x
- `.env` file with any required environment variables

## Setup

```bash
# Install dependencies (if not already done)
pnpm install

# Generate routes (discovers new create page automatically)
pnpm generate-routes
```

## Development

```bash
# Start dev server (includes route generation)
pnpm dev
```

## Verification

### Type Check

```bash
pnpm type-check
```

Must exit 0 before opening a PR.

### Lint

```bash
pnpm lint
```

Must exit 0 — zero errors, zero promoted warnings.

## Test Data

The following seed data is available for manual testing:

| Entity      | Count         | Details                                 |
| ----------- | ------------- | --------------------------------------- |
| Stores      | 10            | FIT365/JOYFIT locations across 3 areas  |
| Instructors | 10            | 4 stores covered (ST001-ST004)          |
| Lessons     | ~36 templates | Both studio and personal types          |
| Studio data | TBD           | Must be added in Phase 1 if not present |

## URL Access

| Page          | URL                        |
| ------------- | -------------------------- |
| Schedule List | `/lesson-schedules`        |
| Create Form   | `/lesson-schedules/create` |
