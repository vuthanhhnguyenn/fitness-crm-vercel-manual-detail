# Quickstart Checklist: Studio Create/Edit

## Mock Data Verification

- [ ] `GET /api/crm/studios` returns the studio list
- [ ] `GET /api/crm/studios/STU-001` returns detail with layout, images
- [ ] `POST /api/crm/studios` creates a studio and returns an ID
- [ ] `PUT /api/crm/studios/STU-001` updates the studio and returns success
- [ ] `GET /api/crm/stores?limit=100` returns stores for dropdown

## UI Verification

### Create Flow

- [ ] Navigate to `/studios/create` — form renders with all fields, empty inputs
- [ ] Required fields marked (store, name, type, hours, capacity, buffer)
- [ ] Click "キャンセル" — navigates back via `history.back()`
- [ ] Submit with empty required fields — validation messages shown: "{項目名}は必須です。"
- [ ] Fill all fields, click "入力内容を確認する" — confirmation dialog shows key fields
- [ ] Confirm dialog — navigates to `/studios/{id}` detail page
- [ ] Cancel dialog — returns to form with data intact

### Edit Flow

- [ ] Navigate to `/studios/{id}/edit` — form pre-populates with existing values
- [ ] Title reads "スタジオ編集"
- [ ] Modify a field, click "変更を保存する" — confirmation dialog, then save
- [ ] Confirm — navigates to detail page with updated values
- [ ] Edit a studio with active scheduled lessons — warning alert shown
- [ ] Cancel — returns to detail page

### Space Layout Editor

- [ ] Right panel shows grid editor (default 2 rows × 8 columns)
- [ ] Placement mode selector: 通常席 / 器材席 / 固定物 / 未使用 — highlighted when selected
- [ ] Click a cell — cell changes to selected type
- [ ] Column dropdown: 6, 8, 10 — grid resizes dynamically
- [ ] Row dropdown: 2, 3, 4, 5 — grid resizes dynamically
- [ ] Cells preserved within new bounds; cells outside discarded
- [ ] "リセット" link — restores 2×8 empty grid
- [ ] Summary: 総スペース数 = rows × cols, 予約可能スペース = count(normal_seat), 利用不可スペース = count(equipment_seat + fixed_object)
- [ ] Legend shows color indicators matching grid

### Image Upload

- [ ] Upload zone with drag-and-drop support
- [ ] File picker for JPG/PNG/WebP, max 5MB
- [ ] Uploaded images shown in 3-column grid preview
- [ ] Remove button on each image
- [ ] Upload progress indicator (spinner)
- [ ] Studio image category is `'studio'` (new category)

## Edge Cases

- [ ] Buffer capacity defaults to 0
- [ ] Capacity and buffer both max 500
- [ ] Layout not configured — detail view omits layout preview
- [ ] Delete (out of scope for Phase 1 form) — handled by existing delete dialog
