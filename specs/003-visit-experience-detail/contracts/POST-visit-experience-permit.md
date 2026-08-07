# Contract: POST /api/crm/visit-experiences/[id]/permit

**Phase 1 mock** — `src/app/api/crm/visit-experiences/[id]/permit/route.ts` _(new file)_  
**Phase 2 real** — `POST {BACKEND_BASE}/crm/visit-experiences/:id/permit` (not yet published)

---

## Purpose

Issues a 30-minute time-limited facility entry permit for the specified visit reservation. This:

1. Transitions the reservation status to `visiting`
2. Sets `permit_issued_at` to current timestamp
3. Sets B-01 integration fields: `b01_gate`, `b01_auth_method`
4. Appends a new timeline entry recording the issuing operator and timestamp
5. Returns the full updated `VisitExperienceDetail`

In Phase 2, this action also communicates with B-01 entry/exit management to activate face-recognition entry at the designated gate.

---

## Request

```
POST /api/crm/visit-experiences/:id/permit
Content-Type: application/json
```

### Path Parameters

| Parameter | Type     | Required | Description                       |
| --------- | -------- | -------- | --------------------------------- |
| `id`      | `string` | Yes      | Reservation ID (e.g., `"VE-002"`) |

### Request Body

```json
{}
```

> Phase 1: No request body fields required. The acting operator is determined server-side from the session context (mock: use a fixed operator name `"管理者A"`).  
> Phase 2: Operator identity comes from the authentication token.

---

## Responses

### 200 OK

Returns the full updated record.

```json
{
  "record": {
    "id": "VE-002",
    "customer_name": "鈴木 花子",
    "status": "visiting",
    "permit_issued_at": "2026-06-18T11:01:00+09:00",
    "b01_auth_method": "顔認証",
    "b01_gate": "メインエントランス",
    "b01_entry_at": null,
    "b01_exit_at": null,
    "timeline": [
      {
        "timestamp": "2026-06-18T11:01:00+09:00",
        "operator": "管理者A",
        "content": "見学許可を発行（30分間の時間制限入館）"
      },
      {
        "timestamp": "2026-06-18T11:00:00+09:00",
        "operator": "システム",
        "content": "見学申込受信（アプリ経由）"
      }
    ]
  }
}
```

### 400 Bad Request — Already permitted or in terminal state

```json
{ "error": "Permit cannot be issued", "reason": "Reservation is not in a permittable state" }
```

Returned when `status` is not one of: `application_received`, `bl_checking`.

### 404 Not Found

```json
{ "error": "Not found" }
```

### 500 Internal Server Error

```json
{ "error": "Failed to issue permit" }
```

---

## Permittable States

The permit action is valid only when the current `status` is:

| Status                 | Condition                    |
| ---------------------- | ---------------------------- |
| `application_received` | All checks pass (normal)     |
| `bl_checking`          | Staff risk-override (BL hit) |

All other statuses return `400`.

---

## Mock Implementation

```typescript
// POST /api/crm/visit-experiences/[id]/permit/route.ts
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = db.visitExperiences.getById(id);

  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const permittableStatuses = ['application_received', 'bl_checking'];
  if (!permittableStatuses.includes(record.status)) {
    return NextResponse.json(
      { error: 'Permit cannot be issued', reason: 'Reservation is not in a permittable state' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const updated: VisitExperienceDetail = {
    ...record,
    status: 'visiting',
    permit_issued_at: now,
    b01_gate: 'メインエントランス',
    b01_auth_method: '顔認証',
    timeline: [
      { timestamp: now, operator: '管理者A', content: '見学許可を発行（30分間の時間制限入館）' },
      ...record.timeline,
    ],
  };

  db.visitExperiences.update(id, updated);
  return NextResponse.json({ record: updated });
}
```

> **Mock DB note**: `db.visitExperiences` requires an `update(id, record)` method to persist in-memory mutations. Add this method alongside the existing `getAll()` and `getById()`.

---

## Contract Tests Required

- **Happy path — application_received**: Permit a `application_received` record → `200`, `status: "visiting"`, `permit_issued_at` is non-null ISO string, timeline has a new entry with `operator: "管理者A"` at the top.
- **Happy path — bl_checking (risk override)**: Permit a `bl_checking` + `bl_match: true` record → same `200` response shape.
- **Already visiting**: Attempt to permit a `visiting` record → `400`, `reason` present.
- **Completed**: Attempt to permit a `visit_completed` record → `400`.
- **Not found**: `POST /api/crm/visit-experiences/DOES-NOT-EXIST/permit` → `404`.
