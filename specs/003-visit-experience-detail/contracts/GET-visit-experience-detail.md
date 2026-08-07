# Contract: GET /api/crm/visit-experiences/[id]

**Phase 1 mock** — `src/app/api/crm/visit-experiences/[id]/route.ts`  
**Phase 2 real** — `GET {BACKEND_BASE}/crm/visit-experiences/:id` (not yet published)

> **Upgrade note**: The existing stub returned `VisitExperience` (list fields only). This contract replaces that stub with a full `VisitExperienceDetail` response.

---

## Request

```
GET /api/crm/visit-experiences/:id
```

### Path Parameters

| Parameter | Type     | Required | Description                       |
| --------- | -------- | -------- | --------------------------------- |
| `id`      | `string` | Yes      | Reservation ID (e.g., `"VE-001"`) |

No query parameters.

---

## Responses

### 200 OK

```json
{
  "id": "VE-001",
  "customer_name": "山田 太郎",
  "customer_name_kana": "ヤマダ タロウ",
  "birth_date": "1990/04/15",
  "phone": "090-1234-5678",
  "email": "yamada.taro@example.com",
  "address": "東京都渋谷区渋谷1-1-1",
  "status": "visiting",
  "bl_match": false,
  "bl_match_reason": null,
  "brand_name": "JOYFIT",
  "store_name": "JOYFIT渋谷店",
  "reserved_at": "2026-06-18T09:00:00+09:00",
  "visit_start_at": "2026-06-18T09:05:00+09:00",
  "visit_end_scheduled_at": "2026-06-18T09:35:00+09:00",
  "visit_end_actual_at": null,
  "id_document_type": "運転免許証",
  "id_document_verified": true,
  "permit_issued_at": "2026-06-18T09:03:00+09:00",
  "b01_auth_method": "顔認証",
  "b01_gate": "メインエントランス",
  "b01_entry_at": "2026-06-18T09:05:00+09:00",
  "b01_exit_at": null,
  "timeline": [
    {
      "timestamp": "2026-06-18T09:05:00+09:00",
      "operator": "システム",
      "content": "施設入館（顔認証）— 30分見学開始"
    },
    {
      "timestamp": "2026-06-18T09:03:00+09:00",
      "operator": "管理者A",
      "content": "見学許可を発行（30分間の時間制限入館）"
    },
    {
      "timestamp": "2026-06-18T09:00:00+09:00",
      "operator": "システム",
      "content": "見学申込受信（アプリ経由）"
    }
  ]
}
```

**Info-missing example** (phone, address null; id_document unverified):

```json
{
  "id": "VE-006",
  "customer_name": "渡辺 奈々",
  "status": "info_missing",
  "phone": null,
  "address": null,
  "id_document_type": null,
  "id_document_verified": false,
  "bl_match": false,
  "bl_match_reason": null,
  "permit_issued_at": null,
  "b01_auth_method": null,
  "b01_gate": null,
  "b01_entry_at": null,
  "b01_exit_at": null,
  "timeline": [
    {
      "timestamp": "2026-06-18T15:01:00+09:00",
      "operator": "システム",
      "content": "情報不足を検出: 電話番号・住所・本人確認書類が未登録"
    },
    {
      "timestamp": "2026-06-18T15:00:00+09:00",
      "operator": "システム",
      "content": "見学申込受信（アプリ経由）"
    }
  ]
}
```

### 404 Not Found

```json
{ "error": "Not found" }
```

### 500 Internal Server Error

```json
{ "error": "Failed to fetch visit experience" }
```

---

## Mock Implementation Notes

1. Look up the record from `db.visitExperiences.getById(id)` — returns `VisitExperienceDetail`.
2. Return `NextResponse.json(record)` if found.
3. Return `404` if `record === undefined`.
4. Validate response shape with `VisitExperienceDetailSchema.parse(record)` before returning (development guard only; skip in production mock if too slow).

---

## Contract Tests Required

- **Happy path — visiting**: `GET /api/crm/visit-experiences/VE-001` returns status 200 with `status: "visiting"`, non-null `permit_issued_at`, `b01_entry_at`, non-null `timeline`.
- **Info-missing**: `GET /api/crm/visit-experiences/VE-006` returns `phone: null`, `address: null`, `id_document_verified: false`.
- **BL match**: Request a record with `bl_match: true` → `bl_match_reason` is non-null string.
- **Completed**: Request a `visit_completed` record → `b01_exit_at` is non-null.
- **Not found**: `GET /api/crm/visit-experiences/DOES-NOT-EXIST` → `404`.
