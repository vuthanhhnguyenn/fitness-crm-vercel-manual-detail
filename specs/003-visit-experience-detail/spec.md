# Feature Specification: Visit/Experience Management — Detail Page

**Feature Branch**: `003-visit-experience-detail`  
**Created**: 2026-06-18  
**Status**: Draft  
**PO Spec**: `FR-S001` — 見学・体験の管理 (Phase 1)  
**Source**: `dx-fitness/fitness-crm-ui` → `src/pages/visit-experience-detail.tsx` + `dx-fitness/fitness-spec` → `crm/requirements/C-01.md`  
**Input**: User description: "spec: FR-S001 見学・体験の管理(Scope: phase 1) design: dx-fitness/fitness-crm-ui: page = src/pages/visit-experience-detail.tsx"

---

## External Context Loaded

**Repo**: `dx-fitness/fitness-crm-ui`  
**UI file**: `src/pages/visit-experience-detail.tsx`  
**Requirement**: `dx-fitness/fitness-spec` → `crm/requirements/C-01.md` § FR-S001

### UI Mockup Summary

The design presents a two-column detail page for front-desk staff to review and act on a single visit/experience reservation. Key regions observed:

- **Page header**: Back-link to the list, customer name as title, status badge (tone varies by state)
- **Left column (60%)** — read-only information panels:
  1. **個人情報**: face-photo placeholder with 登録済み/未登録 badge, 氏名, フリガナ, 生年月日, 電話番号, メールアドレス, 住所 — fields missing for `info-missing` variant are shown as "未登録" in warning colour; face photo placeholder shows a warning icon and border when unregistered; a warning `Alert` is displayed at the top of the card when any information is missing
  2. **ブラックリスト照合結果**: shows 照合済み：該当なし (success icon) or 照合済み：一致あり (alert icon, match reason, link to BL entry detail) with destructive card styling for match
  3. **タイムライン**: chronological audit trail — each entry has timestamp, operator (システム or named operator), and action description; system entries use neutral dot, operator entries use primary dot
- **Right column (40%, sticky)** — operational panels (Cards 1 and 2 below are combined into one `ステータス` card):
  1. **ステータス + 操作 (merged card)**: toned icon circle and status badge with 予約受付 datetime at top; a `Separator` divides the status display from the context-sensitive action area whose content changes per reservation state (see table below)
  2. **来店詳細情報**: 来店予定日時, 見学許可発行日時 (conditional, when permit has been issued), 見学終了日時 (completed state only)
  3. **B-01 入退館連携情報** (visiting/completed states only): 認証方式, 許可ゲート, 入館時刻, 退館時刻 (completed only)
- **見学許可確認ダイアログ**: confirmation alert dialog before issuing the 30-minute permit

> **Note**: A separate 本人確認書類（eKYC）card was considered but removed in v3 of the design. Face photo registration status is surfaced directly inside the 個人情報 card. The "未登録" indicator for face photo serves as the identity-check signal for the blocking state.

> **Note**: The 残り時間 countdown was removed in v3 (FR-S001 v3). Monitoring of in-progress visits is handled by the B-01 在館者リスト on a separate page, not by a countdown on this detail page.

**Detail page states from design**:

| Variant      | Status Label | Status Tone | 操作 Section Content (within ステータス card)                                   |
| ------------ | ------------ | ----------- | ------------------------------------------------------------------------------- |
| default      | 申込受付     | muted       | All-OK alert + "見学を許可する（30分）" button (role-gated)                     |
| info-missing | 確認待ち     | warning     | Error alert listing missing items + disabled "見学を許可する" button            |
| bl-match     | BL照合中     | destructive | BL warning alert + "リスクを確認して見学を許可する（30分）" button (role-gated) |
| visiting     | 見学中       | info        | B-01 連携状況 row + "時間制限入館 有効" badge (no action buttons)               |
| completed    | 見学終了     | muted       | Completion datetime text + "入会申請へ誘導" button (role-gated)                 |

**Role gating from design comments** (`RoleGatedButton`):

- 見学許可 and 入会申請への誘導: Headquarter, System, Manager, Staff — permitted
- Trainer, Observer — denied (tooltip shown instead of active button)

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Review applicant information and issue visit permit (Priority: P1)

As front-desk staff, I can open a visit reservation detail page, verify the applicant's personal information, identity document, and BL screening result, and — when all checks pass — issue a 30-minute timed facility entry permit so the applicant can begin their visit.

**Why this priority**: This is the core operational action of FR-S001. Without the ability to issue a permit from the detail page, the visit management workflow has no actionable outcome.

**Independent Test**: Can be fully tested end-to-end with a single reservation record that has all required information completed and no BL match: open detail, confirm all info panels, click permit button, confirm the dialog, and verify the permit is issued and the timeline is updated.

**Acceptance Scenarios**:

1. **Given** a reservation with all personal information, a verified identity document, and no BL match, **When** staff opens the detail page, **Then** the system displays an all-clear alert in the 操作 panel and shows an active "見学を許可する（30分）" button.
2. **Given** the permit button is visible and active, **When** staff clicks it, **Then** a confirmation dialog appears stating the applicant name, the 30-minute time-limited entry scope, and the B-01 integration note.
3. **Given** the confirmation dialog is open, **When** staff confirms, **Then** the system issues a 30-minute time-limited entry permit, the timeline is updated with a new entry recording the issuing operator and timestamp, and the dialog closes.
4. **Given** a staff user with the Trainer or Observer role, **When** they view the 操作 panel, **Then** the permit button is rendered in a disabled state with a tooltip message stating they lack permit permission.
5. **Given** the detail page is open, **When** staff clicks the back-link, **Then** the system navigates back to the visit/experience list page without losing the current list state.

---

### User Story 2 — Identify and handle blocked reservations (info-missing or BL match) (Priority: P2)

As front-desk staff, I can immediately see why a reservation cannot proceed (missing information or BL match) so I can take the appropriate action: inform the applicant about missing data, or carefully assess and override a BL match with full awareness of the risk.

**Why this priority**: Blocked states require explicit staff judgment. Without visible blocking signals and clear in-page guidance, staff may inadvertently permit an ineligible applicant or deny a legitimate one.

**Independent Test**: Can be tested independently using the info-missing and bl-match reservation states: verify that blocked states prevent the standard permit action, display the blocking reason clearly, and offer the correct alternative path.

**Acceptance Scenarios**:

1. **Given** a reservation where phone number, address, or face photo is missing, **When** staff opens the detail page, **Then** the 個人情報 card displays a warning `Alert` at the top, missing fields show "未登録" in warning colour, and the face-photo placeholder uses a warning icon and border; the action section inside the ステータス card displays the permit button in a disabled state with a list of the specific missing items.
2. **Given** a reservation with a BL match, **When** staff opens the detail page, **Then** the ブラックリスト照合結果 card uses destructive styling, shows the match reason, and provides a link to the matched BL entry detail.
3. **Given** a reservation with a BL match, **When** staff reviews the detail, **Then** the 操作 panel shows a destructive-toned warning alert and an active "リスクを確認して見学を許可する（30分）" button — identical permit flow but with explicit risk acknowledgment messaging.
4. **Given** staff clicks "該当BLエントリの詳細を確認" in the BL result card, **When** the link is activated, **Then** the system navigates to the corresponding blacklist entry detail page.
5. **Given** a reservation with incomplete information, **When** the face photo is unregistered, **Then** the 個人情報 card shows the face-photo placeholder with a warning icon and "未登録" badge, and the action section lists face photo as one of the blocking items preventing permit issuance.

---

### User Story 3 — Monitor an in-progress visit and initiate membership application after completion (Priority: P3)

As front-desk staff, I can open a detail page for a visitor currently in the facility, see the remaining visit time and B-01 entry data, and — once the visit ends — guide the applicant into the membership application flow with their information pre-filled.

**Why this priority**: Post-visit conversion to membership is the primary business outcome of the visit flow. The detail page is the handoff point. This is lower priority than P1/P2 because the B-01 integration handles the visit lifecycle automatically; staff action is only needed at the conversion step.

**Independent Test**: Can be tested independently using visiting and completed reservation states: verify that in-progress state shows remaining time and B-01 data, and that completed state offers the membership application handoff button.

**Acceptance Scenarios**:

1. **Given** a reservation in the "visiting" state, **When** staff opens the detail page, **Then** the ステータス card shows "見学中" with info tone and a "時間制限入館 有効" badge in the B-01 連携状況 row; the 来店詳細情報 panel shows 来店予定日時 and 見学許可発行日時 — no remaining-time countdown is shown on this page.
2. **Given** a reservation in the "visiting" or "completed" state, **When** staff views the right column, **Then** the B-01 入退館連携情報 card is visible, showing the authentication method, permitted gate, and entry datetime; for completed state, exit datetime is also shown.
3. **Given** a reservation in the "completed" state, **When** staff opens the detail page, **Then** the 操作 panel shows the visit end datetime and an active "入会申請へ誘導" button.
4. **Given** staff clicks "入会申請へ誘導", **When** the system navigates to the enrollment application form, **Then** the applicant's name and other available personal information are pre-filled in the form.
5. **Given** a staff user with the Trainer or Observer role viewing a completed reservation, **When** they view the 操作 panel, **Then** the "入会申請へ誘導" button is disabled with a tooltip stating they lack permission.

---

### User Story 4 — Review the full audit trail for a reservation (Priority: P4)

As front-desk staff or a manager, I can scroll the timeline of a reservation to see the complete history of system events and operator actions in chronological order so I can understand what happened during the visit lifecycle.

**Why this priority**: The timeline is essential for incident review and dispute resolution, but it adds informational context rather than enabling a core workflow action.

**Independent Test**: Can be tested independently by opening a detail page and verifying that timeline entries appear in reverse-chronological order with timestamps, operator names, and action descriptions.

**Acceptance Scenarios**:

1. **Given** a reservation with multiple lifecycle events, **When** staff views the タイムライン card, **Then** all recorded events are shown in reverse-chronological order, each with a timestamp, operator name (システム or a named staff), and a plain-language description of the event.
2. **Given** an event was triggered by the system (e.g., BL check), **When** the timeline renders, **Then** the entry uses a neutral dot indicator to distinguish it from operator-initiated events.
3. **Given** an event was triggered by a named operator (e.g., permit issued), **When** the timeline renders, **Then** the entry uses a primary-toned dot indicator.
4. **Given** a permit is issued via the confirmation dialog, **When** the permit action completes, **Then** a new timeline entry is immediately appended at the top of the timeline, recording the current operator and timestamp.

---

### Edge Cases

- **Face photo unregistered**: The face-photo placeholder in 個人情報 shows a warning icon and border with "未登録" badge; the action section inside ステータス card lists face photo as a missing item and disables the permit button.
- **BL match with normal personal info**: BL card destructive styling and 操作 panel warning appear regardless of whether personal info is complete or identity document is verified — BL match is an independent signal.
- **All nullable timestamps absent** (approvedAt, visitStartAt, visitEndAt, b01EntryAt): Page must remain stable; the corresponding fields in 来店詳細情報 and B-01 card are hidden or show a dash placeholder — no blank cells.
- **Visit time expires while page is open**: The visiting state remains until B-01 confirms exit and the record transitions to 見学終了 via a background update. No countdown is shown; the page remains stable and the ステータス badge continues to display "見学中" until the backend status changes.
- **入会申請済 status**: Reservation already transitioned to membership application; the 操作 panel shows a read-only completion message and no further actions.
- **キャンセル status**: Cancelled reservation; the 操作 panel shows a cancellation notice and all action buttons are absent.
- **Navigation to non-existent BL entry**: If the linked BL entry has been removed, the BL detail navigation must handle the error gracefully without crashing the current detail page.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a dedicated visit/experience reservation detail page, accessible by clicking a row on the visit/experience list page. Per the C-01 権限マトリクス (申請一覧/詳細参照), page access MUST be restricted to the System, Headquarter, Manager, Staff, and Observer roles; the Trainer role MUST NOT be able to access this page (page-level permission `visit-experiences.view`).
- **FR-002**: System MUST display the applicant's personal information in a dedicated 個人情報 card: face-photo placeholder with 登録済み/未登録 badge, 氏名, フリガナ, 生年月日, 電話番号, メールアドレス, and 住所; when phone, address, or face photo is missing (info-missing state), the card MUST display a warning `Alert` at the top and show each missing field as "未登録" in warning colour.
- **FR-003**: ~~Separate 本人確認書類 card~~ — **Removed in v3**: Face photo registration status (登録済み/未登録 badge and icon inside the face-photo placeholder in FR-002) serves as the identity-check signal. A standalone eKYC card is deferred to Phase 2.
- **FR-004**: System MUST display the BL screening result in a dedicated panel: when no match exists, show a cleared indicator; when a match exists, show the match reason and a link to the corresponding BL entry detail — with destructive-toned card styling for the match state.
- **FR-005**: System MUST display the reservation's current status in a right-column ステータス card with a toned icon circle and a status badge matching the current state. Status label and tone per state: 申込受付 (muted), 確認待ち (warning), BL照合中 (destructive), 見学中 (info), 見学終了 (muted), 入会申請済 (muted), キャンセル (muted). The 予約受付 datetime is shown below the badge.
- **FR-006**: System MUST display a 来店詳細情報 panel showing 来店予定日時, and conditionally: 見学許可発行日時 (when permit has been issued), 見学終了日時 (when visit is completed). No remaining-time countdown is shown on the detail page (removed in v3).
- **FR-007**: System MUST display a context-sensitive action section inside the ステータス card (separated by a `Separator`) whose content changes based on the reservation's current state:
  - When all checks pass (info complete, ID verified, no BL match): show all-clear alert and active permit button.
  - When information is missing or ID document is unverified: show a blocking alert listing each missing item and a disabled permit button.
  - When a BL match exists: show a destructive-toned warning alert and an active risk-override permit button.
  - When visit is in progress: show a "B-01 連携状況" row with "時間制限入館 有効" badge (no action buttons, no countdown).
  - When visit is completed: show completion message and active membership application guidance button.
- **FR-008**: System MUST gate the "見学を許可する" and "入会申請へ誘導" actions by staff role: Headquarter, System, Manager, and Staff roles may activate these buttons; Trainer and Observer roles see the buttons in a disabled state with an explanatory tooltip.
- **FR-009**: System MUST show a confirmation dialog before issuing the visit permit, stating the applicant name, the 30-minute time-limited entry scope, and the B-01 integration detail (face recognition at main entrance).
- **FR-010**: System MUST issue a 30-minute time-limited entry permit to B-01 entry/exit management upon permit confirmation, integrating with face-recognition entry at the designated gate.
- **FR-011**: System MUST append a new timeline entry immediately after a permit is issued, recording the issuing operator's name and the timestamp of the action.
- **FR-012**: System MUST display the full reservation audit trail in the タイムライン panel, listing events in reverse-chronological order with timestamp, operator (system or named staff), and action description.
- **FR-013**: System MUST visually distinguish system-generated timeline entries (neutral indicator) from staff-initiated timeline entries (primary-toned indicator).
- **FR-014**: System MUST display a B-01 入退館連携情報 panel (authentication method, permitted gate, entry datetime) when the reservation is in the visiting or completed state; for completed state, the exit datetime must also be shown.
- **FR-015**: System MUST navigate the user to the enrollment application form when "入会申請へ誘導" is clicked, with the applicant's available personal information pre-filled.
- **FR-016**: System MUST provide a back-link that navigates the user to the visit/experience list page.
- **FR-017**: System MUST display all missing or null optional fields as a dash (`—`) placeholder — never as a blank cell.
- **FR-018**: System MUST handle the 入会申請済 and キャンセル reservation states with read-only display and no actionable buttons in the 操作 panel.

### Key Entities

- **Visit Experience Reservation**: A single visit/experience application record. Key attributes: reservation ID, applicant name, furigana, birth date, phone, email, address, face photo, brand, store, status, BL match flag, BL match reason, reserved datetime, permit issued datetime, visit start datetime, visit end datetime, scheduled visit end datetime.
- **Visit Status**: Operational phase in the lifecycle. Values: 申込受信, 情報不足, 要注意(BL), 許可済(見学中), 見学終了, 入会申請済, キャンセル.
- **Face Photo Record**: Registration artifact uploaded via the applicant's mobile app. Attributes: registration status (registered / unregistered), registration datetime. Phase 1 renders registration status only; photo display is deferred to Phase 2.
- **BL Screening Result**: Result of blacklist comparison. Attributes: match flag (boolean), match reason (text, nullable).
- **Visit Permit**: A time-limited facility entry authorization issued to B-01. Attributes: permitted gate, authentication method, permit issued datetime, duration (30 minutes).
- **B-01 Entry/Exit Record**: Entry and exit event data from the B-01 integration. Attributes: authentication method, gate name, entry datetime, exit datetime (nullable).
- **Timeline Entry**: An individual audit event. Attributes: timestamp, operator (system or named staff), action description.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In usability validation, at least 95% of front-desk staff can identify whether a reservation is permit-ready or blocked within 10 seconds of opening the detail page.
- **SC-002**: In UAT, 100% of permit-issuance actions that complete the confirmation dialog result in a correctly recorded timeline entry with operator name and timestamp.
- **SC-003**: In UAT, 100% of "入会申請へ誘導" actions successfully navigate to the enrollment form with at least the applicant name pre-filled.
- **SC-004**: In usability testing, at least 90% of staff correctly identify the BL match reason and navigate to the BL entry detail without additional guidance.
- **SC-005**: In pilot operation, zero cases of a visit permit being issued for a reservation with missing personal information or an unverified identity document.
- **SC-006**: In usability testing, at least 90% of users report that the detail page provides sufficient information to decide whether to permit or decline a visit without leaving the page.

---

## Assumptions

- The primary users are front-desk staff (Manager and Staff roles) with access to visit/experience management pages. Per the C-01 権限マトリクス, the System, Headquarter, Manager, Staff, and Observer roles may view this page (Observer is read-only); the Trainer role has no access to the visit/experience pages and is blocked at the page level.
- Phase 1 scope covers: information display, BL result visibility, permit issuance, in-progress monitoring, and membership application handoff. Manual visit cancellation from this page and inline editing of applicant data are out of scope.
- The 30-minute visit permit integrates with B-01 entry/exit management. No remaining-time countdown is shown on the detail page (removed in v3); in-progress monitoring is handled by the B-01 在館者リスト page.
- BL screening runs automatically upstream (same process as FR-M003); the detail page displays the result only — it does not trigger a new BL check.
- When a BL match exists, the system does NOT automatically block the permit; a staff member with sufficient role authorization makes the final decision.
- The face-photo placeholder shown in 個人情報 references a photo stored upstream by the applicant's mobile app; Phase 1 renders the placeholder area without implementing photo download or display.
- The "入会申請へ誘導" pre-fill behavior pre-populates at minimum the applicant's name, furigana, birth date, phone, email, and address in the enrollment application form; the exact field mapping follows the enrollment form spec (C-01-01).
- Face photo shown in 個人情報 card is a placeholder in Phase 1; actual photo download and display are deferred to Phase 2 backend integration. Only registration status (登録済み/未登録) and registration datetime are shown in Phase 1.
- Timeline entries are append-only; no editing or deletion of existing entries is supported.
- The residual statuses 入会申請済 and キャンセル arrive via upstream status transitions; the detail page renders them as read-only states with no active actions.
