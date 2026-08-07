# API Contracts: Staff Management — Y-01

**Feature**: `001-staff-list`  
**Date**: 2026-04-08  
**Base path**: `/api/crm` (Next.js App Router under `src/app/api/crm/`)

All request/response bodies are JSON. All responses include appropriate HTTP status codes.
Error responses conform to `StaffErrorResponseSchema: { error: string }`.

---

## GET /crm/staff

List staff accounts with filtering, sorting, and pagination.

### Request

```
GET /api/crm/staff
```

**Query Parameters**

| Parameter     | Type                                                                 | Required | Default    | Description                                            |
| ------------- | -------------------------------------------------------------------- | -------- | ---------- | ------------------------------------------------------ |
| `page`        | integer ≥ 1                                                          | No       | `1`        | Page number                                            |
| `limit`       | integer 1–100                                                        | No       | `50`       | Records per page (Constitution max: 50)                |
| `q`           | string                                                               | No       | —          | Free-text search on `name_kanji`, `name_kana`, `email` |
| `position_id` | string                                                               | No       | —          | Filter by position ID (e.g. `pos-store-manager`)       |
| `brand`       | `joyfit \| fit365`                                                   | No       | —          | Filter by staff brand                                  |
| `sub_brand`   | `joyfit_plus \| joyfit_yoga \| joyfit24`                             | No       | —          | Filter by store sub-brand (requires `brand=joyfit`)    |
| `status`      | `active \| inactive`                                                 | No       | —          | Filter by account status                               |
| `sort_by`     | `staff_id \| name_kanji \| position_name \| status \| last_login_at` | No       | `staff_id` | Sort column                                            |
| `sort_order`  | `asc \| desc`                                                        | No       | `asc`      | Sort direction                                         |

**Authorization**: Session JWT required. Role scoping applied server-side:

- `headquarter` / `system`: all staff visible
- `manager`: only staff within Manager's Branch (`branch_id → store_ids[]`)
- Others: 403

### Response 200 — Success

```json
{
  "staff": [
    {
      "staff_id": "STF-001",
      "name_kanji": "田中 太郎",
      "name_kana": "タナカ タロウ",
      "email": "tanaka@joyfit.co.jp",
      "role": "headquarter",
      "position_id": "pos-hq-admin",
      "position_name": "本部管理者",
      "brand": null,
      "status": "active",
      "last_login_at": "2026-04-01T09:00:00+09:00",
      "branch_id": "BRN-001",
      "store_id": null,
      "fc_company_id": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 8,
    "total_pages": 1
  }
}
```

### Response 400 — Validation Error

```json
{ "error": "Invalid sort_by value" }
```

### Response 500 — Server Error

```json
{ "error": "Internal server error" }
```

---

## GET /crm/staff/positions

Return the full 職位マスター list for use in filters and the invite dialog.

### Request

```
GET /api/crm/staff/positions
```

No query parameters.

**Authorization**: Any authenticated session.

### Response 200 — Success

```json
{
  "positions": [
    { "id": "pos-hq-admin", "name": "本部管理者" },
    { "id": "pos-block-manager", "name": "ブロック長" },
    { "id": "pos-territory-manager", "name": "テリトリーマネージャー" },
    { "id": "pos-store-manager", "name": "店舗責任者" },
    { "id": "pos-staff-fulltime", "name": "正社員スタッフ" },
    { "id": "pos-staff-contract", "name": "契約社員スタッフ" },
    { "id": "pos-part-super", "name": "アルバイト（スーパー）" },
    { "id": "pos-part-general", "name": "アルバイト（一般）" },
    { "id": "pos-trainer-employee", "name": "社員トレーナー" },
    { "id": "pos-trainer-external", "name": "社外トレーナー" },
    { "id": "pos-observer", "name": "閲覧専任" }
  ]
}
```

---

## DELETE /crm/staff/[id]

Permanently delete a staff account. Only `headquarter` role may call this endpoint.

### Request

```
DELETE /api/crm/staff/{staffId}
Content-Type: application/json
```

**Path Parameters**

| Parameter | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| `staffId` | string | Yes      | Staff ID (e.g. `STF-004`) |

**Body** (optional)

```json
{ "reason": "退職のため" }
```

| Field    | Type   | Required | Description                           |
| -------- | ------ | -------- | ------------------------------------- |
| `reason` | string | No       | Deletion reason (stored in audit log) |

**Authorization**: `headquarter` role only. Returns 403 for Manager role.

### Response 200 — Success

```json
{
  "success": true,
  "deleted_id": "STF-004"
}
```

### Response 403 — Forbidden

```json
{ "error": "Insufficient permissions" }
```

### Response 404 — Not Found

```json
{ "error": "Staff not found" }
```

---

## POST /crm/staff/invitations

Send invitation emails to one or more email addresses, pre-assigning 職位 and ブランド.

### Request

```
POST /api/crm/staff/invitations
Content-Type: application/json
```

**Body**

```json
{
  "invitations": [
    {
      "email": "new-staff@joyfit.co.jp",
      "position_id": "pos-staff-fulltime",
      "brand": "joyfit"
    },
    {
      "email": "another@joyfit.co.jp",
      "position_id": "pos-staff-fulltime",
      "brand": null
    }
  ]
}
```

| Field                       | Type                       | Required | Description                           |
| --------------------------- | -------------------------- | -------- | ------------------------------------- |
| `invitations`               | array                      | Yes      | Min 1 entry                           |
| `invitations[].email`       | string (email)             | Yes      | Invitee email                         |
| `invitations[].position_id` | string                     | Yes      | Pre-assigned 職位                     |
| `invitations[].brand`       | `joyfit \| fit365 \| null` | Yes      | Pre-assigned brand; null = 全ブランド |

**Authorization**: `headquarter` role only. Returns 403 for other roles.

### Response 201 — Success

```json
{
  "invited_count": 2,
  "invitations": [
    { "email": "new-staff@joyfit.co.jp", "status": "sent" },
    { "email": "another@joyfit.co.jp", "status": "sent" }
  ]
}
```

`status` per entry:

- `"sent"` — invitation email queued/sent
- `"already_exists"` — an active staff account with this email already exists (no email sent; not a hard error)
- `"failed"` — individual send failed (overall response still 201)

### Response 400 — Validation Error

```json
{ "error": "invitations array must not be empty" }
```

### Response 403 — Forbidden

```json
{ "error": "Insufficient permissions" }
```
