# Quickstart: E-02 Connected Equipment Detail

**Branch**: `006-equipment-detail`  
**Route**: `/equipment/[id]`

---

## Prerequisites

- Node v22.14.0
- On branch `006-equipment-detail`
- Dev server: `npm run dev`

---

## Implementation order

1. **Schema** — extend `src/app/api/_schemas/equipment.schema.ts` (detail + history read schemas)
2. **Mock DB** — extend `db.equipment` (getDetailById, getHistory seed, delete)
3. **API routes** — add **2** route files under `src/app/api/crm/equipment/[id]/` (detail + history); DELETE on `[id]/route.ts`
4. **Register routes** — `src/app/api/_routes/index.ts` + `register-schemas.ts`
5. **Regenerate API** — `npm run generate-openapi && npm run generate-api`
6. **Routes config** — add `/equipment/[id]` to `src/lib/routes/routes.config.ts`
7. **List navigation** — link name column in `equipment-table-columns.tsx`
8. **Detail page** — `src/app/(private)/equipment/[id]/` + `_components/`
9. **Status dialog** — reuse `postCrmEquipmentBulkStatusMutation` + `invalidateQueries`
10. **Constants** — update `maintenance` badge to `warning`

---

## Verify locally

```bash
npm run generate-openapi
npm run generate-api
npm run dev
```

1. Open `/equipment`
2. Click equipment name → `/equipment/EQ-0001`
3. **基本情報** tab: verify all cards render
4. **ステータス変更** → select new status → save
5. Header badge + status card update after refetch (not from mutation response)
6. **変更履歴** tab: shows seed rows only (unchanged after status save)
7. **削除** → confirm → returns to `/equipment`
8. Open `/equipment/INVALID-ID` → error state + retry; back link in header returns to list

---

## Key files

| Purpose              | Path                                                                   |
| -------------------- | ---------------------------------------------------------------------- |
| Spec                 | `specs/006-equipment-detail/spec.md`                                   |
| Plan                 | `specs/006-equipment-detail/plan.md`                                   |
| Bulk status (reuse)  | `src/app/api/crm/equipment/bulk-status/route.ts`                       |
| Bulk status hook ref | `src/app/(private)/equipment/_hooks/use-equipment-bulk-status.hook.ts` |
| Reference detail     | `src/app/(private)/lockers/[id]/page.tsx`                              |
