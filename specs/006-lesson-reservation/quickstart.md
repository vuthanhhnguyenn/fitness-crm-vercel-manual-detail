# Quickstart: D-01 FR-007 Lesson Reservation Detail

## Prerequisites

- Use Node.js `>=24.0.0` as required by `package.json`.
- Install dependencies with the repository package manager.
- Stay on branch `006-lesson-reservation-spec`.
- 005-lesson-management schedule list page must be implemented (the reservation detail page is navigated from it).

## Generate Routes and API Client

After adding the route, Zod schemas, and registering API routes:

```bash
npm run generate-routes
npm run generate-openapi
npm run generate-client
```

Expected results:

- `/lesson-schedules/[scheduleId]/reservations` appears in generated route config.
- All reservation mock endpoints (14 endpoints) are included in the generated OpenAPI document.
- Generated React Query option factories exist for all reservation endpoints.

## Run Locally

```bash
npm run dev
```

Open the reservation detail page by navigating from the schedule list or directly:

```text
/lesson-schedules/LS001/reservations
```

## Manual Verification

### User Story 1 — View Reservation Detail and Space Grid (P1)

1. Open `/lesson-schedules` and click any session from the schedule list.
2. Confirm navigation to `/lesson-schedules/[scheduleId]/reservations`.
3. Confirm the "予約管理に戻る" breadcrumb link navigates back to the schedule list.
4. Confirm the lesson header displays: lesson name, date (with day of week), time range, studio name, instructor names.
5. Confirm the space reservation grid renders with color-coded cells: blue (reserved), white/green (available), orange (equipment), grey (fixed structure/pillar).
6. Confirm a legend below the grid explains each color code.
7. Confirm the reservation list table renders columns: No, member name, plan type, space number, reservation date, status, attendance, cancel action.
8. Confirm the right sidebar shows lesson info (name, date, time, studio, instructors, capacity, reservation count, recurrence) and a reservation statistics panel with bar charts for each of the 5 statuses.
9. Confirm "12/14 予約済(残り2席)" remaining seats display is visible.
10. If > 7 reservations, confirm pagination controls show "1-7 / N件" with page numbers and prev/next buttons.
11. Click a column header and confirm sorting works for sequence, member name, space number, reservation date, and status.
12. Click a member name and confirm the limited profile popover opens.
13. Confirm clicking a reserved space in the grid shows a popover with member name, "会員詳細", and "予約取消" buttons.

### User Story 2 — Add Manual Reservation (P1)

1. Click "予約を追加" button and confirm the dialog opens with session info (date, time, lesson name, remaining seats).
2. Type a member name in the search field and confirm matching results appear.
3. Select a member with remaining sessions = 0 and confirm the "残回数が不足しています" warning is shown and the member cannot be added.
4. Select a member with active penalty and confirm the "予約不可期間中の会員です" warning is shown and the member cannot be added.
5. Select an eligible member and confirm they appear in the "追加予定" list and remaining seats decreases.
6. Check "予約確定通知を送信する" and confirm notification toggle is active.
7. Click "追加確定（N名）" and confirm the dialog closes and the reservation appears in the list.
8. Also test clicking an available cell in the grid and confirm the same add-reservation dialog opens.

### User Story 3 — Cancel or Change Session (P2)

1. Click the "取消" button next to a reservation in the list.
2. Confirm the cancel dialog shows member info, 3 cancel type radio buttons (会員/スタッフ/指導者), and a notification checkbox.
3. Select a cancel type, check "キャンセル通知を送信する", click "キャンセルを確定", confirm the list updates.
4. Click "この回を変更" dropdown and select "講師を変更する".
5. Confirm the dialog shows current instructors, searchable instructor list with photo/specialty, multi-select chips, notification checkbox, required reason textarea, and impact summary.
6. Select replacement instructor(s), enter a reason, click "講師を変更する", confirm success.
7. Repeat for "時間を変更する" and "スタジオを変更する" — confirm each dialog has appropriate fields and completes successfully.
8. Click "中止にする" and step through the 3-step wizard:
   - Step 1: Confirm impact summary (affected reservations, notification count, refund amount) and scope selection.
   - Step 2: Select cancel reason, enter detail, toggle notification/refund/instructor options.
   - Step 3: Confirm summary and click "この内容でレッスンを中止する".
9. After cancellation, confirm the header shows "中止済み" badge, status card appears, "この回を変更" is disabled, and "中止にする" is replaced with "中止を取り消す".
10. Close the cancel wizard midway and confirm it resets to Step 1 on next open.

### User Story 4 — View Member Limited Profile (P3)

1. Open a reservation detail page with reservation list entries.
2. Click a member name in the list and confirm a popover opens with: initial avatar, name, age, gender, visit frequency, last visit date, lesson history with attendance badges, body data (height, weight, body fat %), plan type, remaining session count.
3. Confirm no protected personal data (address, phone, email, contract/payment) is shown.
4. Click "会員詳細を見る" and confirm navigation to the member detail page.
5. Confirm a "ペナルティ中" badge appears for members under penalty (row has red background tint).
6. Confirm a "残回数不足" badge appears for members with 0 remaining sessions.

### User Story 5 — Session Memos (P3)

1. Open the right sidebar and locate the "セッションメモ" card.
2. Confirm existing memos display date, author name, content, and a delete (Trash2) button.
3. Type content in the textarea and click "メモを保存", confirm the memo appears.
4. Click the delete button on an existing memo, confirm it is removed.

### Edge Cases

1. Open a cancelled lesson and confirm "中止済み" badge, cancellation status card, disabled "この回を変更" dropdown, and "中止を取り消す" button.
2. Open a session with available seats = 0 and confirm "残り0席" display, disabled "追加" button, hidden confirm button.
3. Search members with no results and confirm "該当する会員が見つかりません" empty state.
4. Search instructors with no results and confirm "該当する講師が見つかりません" empty state.
5. Open a session with no reservations and confirm "予約者はいません" empty state.

### Loading States

1. Confirm skeleton placeholders render for each page section during initial data load.
2. Confirm `DataStateBoundary` error states display correctly when API returns an error.
3. Confirm each dialog opens and closes without page-wide loading disruption.

## Quality Gates

Run before handing off to `/speckit.tasks` or implementation review:

```bash
npm run type-check
npm run lint
```

Expected results:

- TypeScript exits successfully.
- ESLint exits successfully.
- No raw colors, raw route strings in navigation, raw component fetches, or `any` types are introduced.
