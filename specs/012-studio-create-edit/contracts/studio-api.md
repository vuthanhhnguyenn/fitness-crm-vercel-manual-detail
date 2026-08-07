# Studio API Contracts

## POST /api/crm/studios — Create Studio

Creates a new studio record with optional images and space layout.

### Request

```
POST /api/crm/studios
Content-Type: application/json
```

```json
{
  "name": "スタジオA",
  "store_id": "STO-001",
  "studio_type": "normal",
  "capacity": 30,
  "buffer_value": 5,
  "operating_hours": "09:00~21:00",
  "equipment_notes": "ヨガマット20枚、ミラー壁面",
  "internal_notes": "",
  "status": "active",
  "images": [{ "url": "https://cdn.mock.example.com/studio/uuid.jpg", "sort_order": 1 }],
  "layout": {
    "rows": 2,
    "columns": 8,
    "cells": [
      { "x": 0, "y": 0, "kind": "normal_seat" },
      { "x": 1, "y": 0, "kind": "equipment_seat" }
    ]
  }
}
```

### Response — 201 Created

```json
{
  "id": "STU-042"
}
```

### Response — 400 Bad Request

```json
{
  "error": "スタジオ名は必須です。"
}
```

---

## PUT /api/crm/studios/{id} — Update Studio

Updates an existing studio record. Request body same shape as POST. Returns success.

### Response — 200 OK

```json
{
  "success": true
}
```

---

## GET /api/crm/stores — Store List (for dropdown)

Existing endpoint. Use `?limit=100` to fetch all stores for the dropdown.

### Request

```
GET /api/crm/stores?limit=100
```

### Response (abbreviated)

```json
{
  "stores": [
    { "id": "STO-001", "name": "吉祥寺店", "brand": "joyfit", ... },
    { "id": "STO-002", "name": "渋谷店", "brand": "joyfit24", ... }
  ],
  "pagination": { "page": 1, "limit": 100, "total": 5, "total_pages": 1 }
}
```

---

## POST /api/crm/uploads/presign — Image Upload Presigned URL

Existing endpoint. Use with new `category: "studio"`.

### Request

```json
{
  "category": "studio",
  "content_type": "image/jpeg"
}
```

### Response

```json
{
  "presign_url": "https://cdn.mock.example.com/studio/uuid.jpg?signature=...",
  "public_url": "https://cdn.mock.example.com/studio/uuid.jpg"
}
```
