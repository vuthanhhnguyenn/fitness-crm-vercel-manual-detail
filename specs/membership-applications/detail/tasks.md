# C-01-01 Membership Application Detail — Task List

> **SpecKit Step**: 4 — speckit.tasks
> **Status**: Awaiting Approval
> **Created**: 2026-05-06
> **Plan reference**: `specs/membership-applications/detail/plan.md`
> **Spec reference**: `specs/membership-applications/detail/spec.md`

---

## TASK-01 — Create shared `PageHeader` component

**File**: `src/components/common/page-header.tsx`

- [ ] Create the file with `PageHeaderProps` interface (`breadcrumb`, `title`, `badge`, `subtitle`, `actions`, `sticky`)
- [ ] Implement sticky header: `sticky top-0 z-10 bg-muted/40 backdrop-blur-sm pb-3 -mx-6 px-6 pt-2 border-b mb-4`
- [ ] Implement non-sticky fallback: `mb-4` only
- [ ] Export named `PageHeader` function

**Acceptance**: Component renders with all props; sticky mode applies correct Tailwind classes.

---

## TASK-02 — Extend API schema: `TimelineEntrySchema` + new detail fields

**File**: `src/app/api/_schemas/membership-application.schema.ts`

- [ ] Add `TimelineEntrySchema` above `GetApplicationDetailResponseSchema`:
  - Fields: `id` (string), `kind` (enum `system|memo`), `date` (string), `operator` (string), `content` (string)
  - Export `TimelineEntrySchema` and `TimelineEntry` type
- [ ] Add `note: z.string().optional()` to `RejectRequestSchema`
- [ ] Extend `GetApplicationDetailResponseSchema` with all new fields (do not duplicate existing ones):
  - `applicant_kana`, `birth_date`, `age`
  - `phone` (masked), `phone_real` (unmasked), `email_masked`, `address` (masked), `address_real`
  - `blacklist_conditions` (`z.array(z.string()).optional()`)
  - `usage_start_date`, `monthly_fee`
  - `campaign` (`z.string().nullable().optional()`)
  - `options` (`z.array(z.string()).optional()`)
  - `fee_rows` (`z.array(z.object({ label: z.string(), amount: z.number() })).optional()`)
  - `card_last4`, `application_source` (enum `アプリ|管理画面`)
  - `is_minor`, `parental_consent`
  - `proxy_applicant` (nullable), `agreement_date` (nullable)
  - `rejected_reason` (nullable)
  - `updated_at` (string)
  - `timeline` (`z.array(TimelineEntrySchema).optional()`)
  - Verify `approved_by`, `approved_at`, `rejected_by`, `rejected_at` — add if missing

**Acceptance**: `npm run type-check` passes with no new errors from schema file.

---

## TASK-03 — Remove PATCH from GET/PATCH route + extend GET response mapping

**File**: `src/app/api/crm/membership-applications/[id]/route.ts`

- [ ] Remove `registerRoute` call for PATCH (`method: 'patch'`)
- [ ] Remove `export async function PATCH` handler
- [ ] Remove imports of `UpdateMembershipApplicationRequestSchema`, `UpdateMembershipApplicationResponseSchema`, `UpdateMembershipApplicationRequest`, `UpdateMembershipApplicationResponse` from the route file (keep them in schema file)
- [ ] Extend GET handler response object to include all new fields by merging `app` (list item) + `details` (extended):
  - `applicant_kana`, `birth_date`, `age`, `gender`
  - `phone`, `phone_real`, `email_masked`, `applicant_email`
  - `address`, `address_real`, `applicant_address`
  - `blacklist_conditions`
  - `usage_start_date`, `monthly_fee`, `campaign`, `options`, `fee_rows`
  - `payment_method`, `card_last4`
  - `application_source`, `is_minor`, `parental_consent`
  - `proxy_applicant`, `agreement_date`
  - `approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `rejected_reason`
  - `updated_at` (use `app.application_date` as fallback)
  - `timeline`

**Acceptance**: `GET /api/crm/membership-applications/APP-2026-0001` returns all new fields without 500 error.

---

## TASK-04 — Extend mock DB `_details` seed data

**File**: `src/app/api/_mock-db.ts`

- [ ] In `membershipApplications._seed()`, extend each `_details[app.id]` entry with:
  - `applicant_kana` (e.g. `'ヤマダ タロウ'`)
  - `birth_date` (e.g. `'1990-01-15'`), `age` (calculated from birth_date)
  - `phone` (masked, e.g. `'090-****-5678'`), `phone_real` (e.g. `'090-1234-5678'`)
  - `email_masked` (e.g. `'ap***@example.jp'`)
  - `address` (masked, e.g. `'東京都渋谷区****'`), `address_real` (e.g. `'東京都渋谷区1-2-3'`)
  - `blacklist_conditions`: `['氏名＆生年月日一致', '電話番号一致']` when `app.blacklist_match`, else `[]`
  - `usage_start_date`: same as `app.start_date`
  - `monthly_fee`: `7700`
  - `campaign`: `null` when `app.campaign === 'なし'`, else `app.campaign`
  - `options`: `['水素水', 'ロッカー']`
  - `fee_rows`: FIT365 rows (`カード発行料/初月/翌月`) or JOYFIT rows (`入会金/登録事務手数料/初月/翌月`) based on `app.brand_name`
  - `payment_method`: `'クレジットカード'`
  - `card_last4`: `'1234'`
  - `application_source`: `'管理画面'` when `app.is_proxy`, else `'アプリ'`
  - `parental_consent`: `true` when `app.is_minor`
  - `proxy_applicant`: `'管理者A（STAFF-001）'` when `app.is_proxy`, else `null`
  - `agreement_date`: `'2026/03/30 09:00'` when `app.is_proxy`, else `null`
  - `approved_by`: `'管理者A'` when `app.status === '承認済'`, else `null`
  - `approved_at`: `app.application_date` when `app.status === '承認済'`, else `null`
  - `rejected_by`: `'管理者B'` when `app.status === '否認'`, else `null`
  - `rejected_at`: `app.application_date` when `app.status === '否認'`, else `null`
  - `rejected_reason`: `'本人確認不備'` when `app.status === '否認'`, else `null`
  - `updated_at`: `app.application_date`
  - `timeline`: initial system entry (受付 or 代理申請登録)
- [ ] Special values for specific IDs:
  - `APP-2026-0017` (minor): `birth_date: '2009-05-15'`, `age: 16`, `applicant_kana: 'ワカバヤシ ミナミ'`
  - `APP-2026-0003`, `APP-2026-0007`, `APP-2026-0016` (BL match): `blacklist_conditions: ['氏名＆生年月日一致', '電話番号一致']`
  - `APP-2026-0018` (proxy): `application_source: '管理画面'`, `is_proxy: true`

**Acceptance**: All 19 seed entries have complete detail fields; GET route returns them correctly.

---

## TASK-05 — Regenerate OpenAPI spec and API client

```bash
npm run generate-openapi
npm run generate-api
```

- [ ] Run `generate-openapi` — confirm `lib/openapi.json` updated with new fields
- [ ] Run `generate-api` — confirm `lib/api/types.gen.ts` and `lib/api/@tanstack/react-query.gen.ts` updated
- [ ] Verify `GetCrmMembershipApplicationsByIdResponse` in `types.gen.ts` includes new fields

**Acceptance**: Generated types include `timeline`, `fee_rows`, `blacklist_conditions`, `applicant_kana`.

---

## TASK-06 — Delete old files

- [ ] Delete `[id]/_components/basic-info-card.tsx`
- [ ] Delete `[id]/_components/risk-details-section.tsx`
- [ ] Delete `[id]/_components/member-info-tab.tsx`
- [ ] Delete `[id]/_components/contract-info-tab.tsx`
- [ ] Delete `[id]/_components/payment-info-tab.tsx`
- [ ] Delete `[id]/_components/history-tab.tsx`
- [ ] Delete `[id]/_components/edit-membership-application-modal.tsx`
- [ ] Delete `[id]/_components/application-detail-footer.tsx`
- [ ] Delete `[id]/_components/membership-application-detail-skeleton.tsx`
- [ ] Delete `[id]/_schemas/edit-membership-application-form.schema.ts`
- [ ] Delete `[id]/_schemas/reject-form.schema.ts`
- [ ] Delete `membership-applications/_components/approve-application-modal.tsx`
- [ ] Delete `membership-applications/_components/reject-application-modal.tsx`

**Acceptance**: No remaining imports of deleted files anywhere in the codebase.

---

## TASK-07 — Create `membership-application-detail-skeleton.tsx`

**File**: `[id]/_components/membership-application-detail-skeleton.tsx`

- [ ] Add `'use client'` directive (uses `Skeleton` component)
- [ ] Render `PageHeader`-height skeleton (breadcrumb + title)
- [ ] Render two-column layout (`flex gap-6`): left 60%, right 40%
- [ ] Left: 4 `Card` skeletons (applicant-info height ~200px, BL ~60px, contract ~150px, fee ~200px)
- [ ] Right: sticky div with 2 `Card` skeletons (status ~280px, meta ~120px)
- [ ] Use `<Skeleton className="..."/>` from `@/components/ui/skeleton`

**Acceptance**: Skeleton renders without errors; matches two-column proportions of final layout.

---

## TASK-08 — Create `applicant-info-card.tsx`

**File**: `[id]/_components/applicant-info-card.tsx`

- [ ] Props: `{ application, allPersonalVisible, onToggleAllPersonal }`
- [ ] Inline `Field` sub-component: `label` (xs muted) + `value` (sm)
- [ ] Inline `MaskedField` sub-component:
  - Props: `{ label, maskedValue, realValue, forceVisible }`
  - Internal `useState(false)` for `individualVisible`
  - Show eye icon button (`Eye`/`EyeOff`) when `!forceVisible`
- [ ] Card header: title "申請者情報" + bulk toggle button (`Eye`/`EyeOff` ghost, right-aligned)
- [ ] Face photo placeholder: 96×96px `rounded-md border bg-muted/30`, `User` icon + "未設定" label
- [ ] Basic 2-col grid: 氏名, フリガナ, 生年月日+年齢 (`birth_date（age歳）`), 性別
- [ ] Masked fields section (2-col grid): 電話番号, メールアドレス, 住所 (col-span-2)

**Acceptance**: Bulk toggle shows/hides all masked fields; individual toggle works independently.

---

## TASK-09 — Create `blacklist-result-card.tsx`

**File**: `[id]/_components/blacklist-result-card.tsx`

- [ ] Props: `{ blacklistMatch: boolean, blacklistConditions: string[] }`
- [ ] No match: `CheckCircle` (success color) + "照合済み：該当なし"
- [ ] Match: card with `border-destructive/50 bg-destructive/10`; `AlertTriangle` + "照合済み：一致あり"; bulleted `blacklistConditions` list; link button "該当BLエントリの詳細を確認 →" (variant ghost, xs, destructive color, `router.push('/blacklist')` placeholder)

**Acceptance**: Both states render correctly; match state applies destructive card border/background.

---

## TASK-10 — Create `contract-info-card.tsx`

**File**: `[id]/_components/contract-info-card.tsx`

- [ ] Props: `{ application }` (destructure brand_name, store_name, plan_name, monthly_fee, start_date, usage_start_date, campaign, options)
- [ ] 2-column grid layout using inline `Field` component
- [ ] Brand: `Badge variant="outline"`
- [ ] Campaign: `Badge bg-info/15 text-info border-info/20`; hidden when `campaign === null`
- [ ] Options: row of `Badge variant="outline"` per option; hidden when empty

**Acceptance**: All fields display; campaign/options hidden when null/empty.

---

## TASK-11 — Create `fee-payment-card.tsx`

**File**: `[id]/_components/fee-payment-card.tsx`

- [ ] Props: `{ feeRows: { label: string; amount: number }[], paymentMethod: string, cardLast4: string }`
- [ ] Card with `py-0 gap-0` (no padding — table flush to edges)
- [ ] CardHeader (`px-4 pt-4 pb-3`): title "費用・決済情報"
- [ ] `<Table>` with TableHeader (`bg-muted/50`) — columns: 項目 / 金額 (right-aligned)
- [ ] TableBody: map `feeRows` → TableRow
- [ ] Total row: `border-t-2 bg-muted/50`, label "合計", sum of all amounts
- [ ] `formatPrice(n)` helper: `¥${n.toLocaleString()}`
- [ ] Below table (`Separator` + `px-4 py-3 flex flex-col gap-3`):
  - 支払方法 + カード番号 (`**** **** **** ${cardLast4}`, mono font)
  - JACCS `Alert` when `paymentMethod !== 'クレジットカード'`: `border-info/50 bg-info/10`, `Info` icon, "JACCS（口座振替）利用者のため、初回請求は翌月合算になるケースがあります。請求タイミングにご注意ください。"

**Acceptance**: Fee table totals correctly; JACCS alert shows only for 口座振替; mono font on card number.

---

## TASK-12 — Create `activity-timeline-card.tsx`

**File**: `[id]/_components/activity-timeline-card.tsx`

- [ ] Props: `{ timeline, memoText, onMemoTextChange, onAddMemo, onDeleteMemo }`
- [ ] Timeline entry rendering:
  - Dot: `size-2.5 rounded-full mt-2`; `bg-muted-foreground` for `system`, `bg-primary` for `memo`
  - Connector line: `w-px flex-1 bg-border mt-1` between entries
  - `group` class on outer div for hover-delete visibility
  - `memo` entries: `Badge "メモ"` outline + delete `Button` (ghost, destructive hover, `opacity-0 group-hover:opacity-100`)
- [ ] Below timeline: `Separator`
- [ ] Memo input area (`bg-muted/30 rounded-lg p-4`):
  - Label "メモを追加"
  - Note text (11px muted): "システム記録・操作ログは削除できません。追加したメモのみ後から削除できます。"
  - `Textarea` rows=3, placeholder "メモを入力してください..."
  - "追加" button (outline), right-aligned; disabled when `memoText.trim() === ''`
  - `// TODO Phase 2: replace with useMutation → POST /memo`

**Acceptance**: Timeline renders system vs memo entries with correct dot colors; delete shows on hover for memo only; add button disabled when empty.

---

## TASK-13 — Create `approve-dialog.tsx`

**File**: `[id]/_components/approve-dialog.tsx`

- [ ] Props: `{ open, onOpenChange, application, totalFee, onConfirm, isPending }`
- [ ] `AlertDialog` with:
  - Title: "入会申請を承認しますか？"
  - Description: "承認すると会員登録が完了し、契約完了通知が送信されます。"
  - Summary rows (flex justify-between): 申請者 / 店舗 / プラン / `Separator` / 初期費用合計
  - BL `Alert` (`border-destructive/50 bg-destructive/10`) when `application.blacklist_match`
  - Cancel: "キャンセル" | Action: "承認する" (disabled when `isPending`)

**Acceptance**: Dialog opens/closes; BL warning shows conditionally; confirm calls `onConfirm`.

---

## TASK-14 — Create `reject-dialog.tsx`

**File**: `[id]/_components/reject-dialog.tsx`

- [ ] Props: `{ open, onOpenChange, onConfirm, isPending }`
- [ ] Internal state: `rejectReason` (string), `rejectNote` (string)
- [ ] Reset state on close (`onOpenChange(false)`)
- [ ] `Dialog` (not AlertDialog) with:
  - Title: "入会申請を否認"
  - `Select` (required), label "否認理由": 本人確認不備 / 年齢制限 / ブラックリスト該当 / その他
  - `Textarea` (optional), label "補足（任意）", rows=4
  - Cancel button (outline) | "否認する" button (destructive, disabled when `!rejectReason || isPending`)
- [ ] On confirm: call `onConfirm({ rejection_reason: rejectReason, note: rejectNote || undefined })`; reset state

**Acceptance**: Confirm disabled until reason selected; passes correct body shape to `onConfirm`.

---

## TASK-15 — Create `cancel-dialog.tsx`

**File**: `[id]/_components/cancel-dialog.tsx`

- [ ] Props: `{ open, onOpenChange, paymentMethod, onConfirm, isPending }`
- [ ] Internal state: `cancelReason` (string)
- [ ] Reset state on cancel (`AlertDialogCancel`)
- [ ] `AlertDialog` with:
  - Title: "申請を取り消しますか？"
  - Description: "取り消すと申請者に通知されます。この操作は元に戻せません。"
  - Payment alert:
    - `クレジットカード` → `border-info/50 bg-info/10` — "カード決済の取消処理を実行します（90日以内）。"
    - Other → `border-warning/50 bg-warning/10` — "口座振替の返金は手動対応となります（CASHPOSTまたは振込）。"
  - `Textarea` (required) rows=3, label "取り消し理由 \*"
  - Cancel action resets `cancelReason` | Confirm action: `bg-destructive text-destructive-foreground`, disabled when `!cancelReason.trim() || isPending`
- [ ] On confirm: call `onConfirm({ cancellation_reason: cancelReason })`

**Acceptance**: Confirm disabled until reason filled; payment alert variant matches payment method.

---

## TASK-16 — Create `cancel-error-dialog.tsx`

**File**: `[id]/_components/cancel-error-dialog.tsx`

- [ ] Props: `{ open, onOpenChange, message }`
- [ ] `AlertDialog` with title "キャンセルできません", description from `message`, single "閉じる" action

**Acceptance**: Renders error message; closes on "閉じる".

---

## TASK-17 — Create `application-meta-card.tsx`

**File**: `[id]/_components/application-meta-card.tsx`

- [ ] Props: `{ application }` (destructure id, application_date, application_source, updated_at, proxy_applicant, agreement_date)
- [ ] CardTitle: "申請情報"
- [ ] Inline `Field` component (label + value)
- [ ] Fields: 申請ID (mono font), 申請日時, 申請元, 更新日時
- [ ] Conditional (only when `application_source === '管理画面'`): 代理申請者, 合意日時

**Acceptance**: Proxy fields hidden for アプリ source; mono font on ID.

---

## TASK-18 — Create `status-action-card.tsx`

**File**: `[id]/_components/status-action-card.tsx`

- [ ] Props: `{ application, currentStatus, todayCancelCount, approvedBy, approvedAt, rejectedBy, rejectedAt, rejectedReason, onApprove, onReject, isApprovePending, isRejectPending }`
- [ ] Status visual map (icon + bgClass): `Clock/warning`, `ClipboardCheck/info`, `CheckCircle/success`, `XCircle/destructive`, `Archive/muted`
- [ ] Status circle: `size-20 rounded-full flex items-center justify-center`
- [ ] Status badge with correct color classes (from spec Section 4.6)
- [ ] "最終更新: ..." (xs muted)
- [ ] Approval feedback (`bg-success/10 rounded-md px-3 py-2`) when `currentStatus === '承認済'`
- [ ] Daily cancel count row (`N / 2`, destructive when `≥ 2`) when `currentStatus === '承認済'`
- [ ] Rejection feedback (`bg-destructive/10 rounded-md px-3 py-2`) when `currentStatus === '否認'`
- [ ] Action section (when `currentStatus === '未審査'`, below Separator):
  - Pre-approval checklist label "承認前チェック"
  - BL check row: `CheckCircle` success + "ブラックリスト照合完了"; if match: "一致あり" destructive badge
  - Age check row: adult → `CheckCircle` success + `age`; minor → `AlertTriangle` warning + age + brand limit text + optional "保護者同意確認済み" badge
  - Usage start date row: `CheckCircle` success + "利用開始日: 2ヶ月以内"
  - BL warning `Alert` when `application.blacklist_match`
  - Approve button: `variant={application.blacklist_match ? 'outline' : 'default'}`, label "承認する" or "リスクを確認して承認する", calls `onApprove`, disabled when `isApprovePending`
  - Reject button: `variant="outline"` + `text-destructive hover:text-destructive`, calls `onReject`, disabled when `isRejectPending`
  - `// TODO Phase 2: role gate — allowedRoles: ["Headquarter", "Manager", "Staff"]`

**Acceptance**: Action section shows only for 未審査; checklist items render correctly for all variants (BL match, minor, adult, normal).

---

## TASK-19 — Create `membership-application-detail.tsx` (main layout)

**File**: `[id]/_components/membership-application-detail.tsx`

- [ ] `'use client'` directive
- [ ] Props: `{ application: GetCrmMembershipApplicationsByIdResponse['application'] }`
- [ ] All `useState` as per spec Section 8:
  - `currentStatus`, `timeline`, `memoText`, `allPersonalVisible`
  - `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `rejectedReason`
  - `todayCancelCount` initialized to module constant `CANCEL_COUNT_TODAY = 0`
  - `approveDialogOpen`, `rejectDialogOpen`, `rejectReason`, `rejectNote`
  - `cancelDialogOpen`, `cancelReason`, `cancelErrorOpen`, `cancelErrorMessage`
- [ ] Initialize all status state from `application` prop (on first render via initial values)
- [ ] `useMutation` for approve:
  - `mutationFn`: `postCrmMembershipApplicationsByIdApprove({ path: { id: application.id }, body: {} })`
  - `onSuccess`: invalidate query key, `toast.success('入会申請を承認しました')`, close dialog, append timeline entry
  - `onError`: `toast.error('承認に失敗しました')`
- [ ] `useMutation` for reject:
  - `mutationFn`: `postCrmMembershipApplicationsByIdReject({ path: { id }, body: { rejection_reason, note } })`
  - `onSuccess`: invalidate, toast, close dialog, append timeline entries
- [ ] `useMutation` for cancel:
  - `mutationFn`: `postCrmMembershipApplicationsByIdCancel({ path: { id }, body: { cancellation_reason } })`
  - `onSuccess`: invalidate, toast, close dialog, append timeline entry, increment `todayCancelCount`
- [ ] `handleCancelButtonClick()` with 3 guards (status / date / count → error dialog)
- [ ] `handleAddMemo()` and `handleDeleteMemo(id)` — local state only; TODO comment for Phase 2
- [ ] Two-column layout: `<div className="flex gap-6">`, left `w-[60%] flex flex-col gap-4`, right `w-[40%]`
- [ ] Right column: `<div className="sticky top-6 flex flex-col gap-4">`
- [ ] `PageHeader` with:
  - `breadcrumb`: `<Button variant="ghost" size="sm" onClick={() => router.push('/membership-applications')}><ChevronLeft/>入会申請管理に戻る</Button>`
  - `title`: `application.applicant_name`
  - `badge`: status `Badge`
  - `actions`: `MoreHorizontal` `DropdownMenu` with "申請を取り消す" item (always shown; click calls `handleCancelButtonClick`)
- [ ] Wire all card components with correct props
- [ ] Wire all dialog components with correct props

**Acceptance**: Full page renders without errors for all 6 prototype variants (default, BL, minor, proxy, JACCS, approved); mutations call correct API routes.

---

## TASK-20 — Rewrite `page.tsx`

**File**: `src/app/(private)/membership-applications/[id]/page.tsx`

- [ ] Remove all old imports (BreadcrumbNav, old components, Tabs, etc.)
- [ ] Keep outer component as Server Component (no `'use client'`)
- [ ] Inner `MembershipApplicationDetailContent` as `'use client'` component:
  - `useParams()` to get `id`
  - `useQuery(getCrmMembershipApplicationsByIdOptions({ path: { id } }))`
  - Loading: `<MembershipApplicationDetailSkeleton />`
  - Error / no data: `<div className="flex flex-1 items-center justify-center"><p className="text-destructive">申込情報が見つかりません</p></div>`
  - Success: `<MembershipApplicationDetail application={data.application} />`
- [ ] Wrap in `<Suspense fallback={<MembershipApplicationDetailSkeleton />}>`
- [ ] Page wrapper `<div className="flex flex-1 flex-col">` (remove old `pb-[70px]`)

**Acceptance**: Page loads, shows skeleton during fetch, renders detail on success, shows error on 404.

---

## TASK-21 — UI Review: code-to-code diff against prototype

Compare each implemented component file against the corresponding section in `.cache/fitness-crm-ui/src/pages/enrollment-application-detail.tsx`. Fix any divergence proactively — do **not** open a browser.

- [ ] Read prototype file in full: `.cache/fitness-crm-ui/src/pages/enrollment-application-detail.tsx`
- [ ] For each component, diff className strings, layout structure, and conditional logic against prototype:
  - **`page-header.tsx`**: className, sticky classes, slot order — match `.cache/fitness-crm-ui/src/components/page-header.tsx`
  - **`applicant-info-card.tsx`**: photo div dimensions (`w-24 h-[96px]`), grid cols, gap values, `MaskedField` structure, eye button classes
  - **`blacklist-result-card.tsx`**: card className when match (`border-destructive/50 bg-destructive/10`), icon+text alignment, link button classes
  - **`contract-info-card.tsx`**: grid layout, badge classes for brand/campaign/options
  - **`fee-payment-card.tsx`**: `py-0 gap-0` on Card, header `px-4 pt-4 pb-3`, table head `first:pl-4 last:pr-4`, total row `border-t-2 bg-muted/50`, separator + `px-4 py-3` section
  - **`activity-timeline-card.tsx`**: dot size (`size-2.5`), connector `w-px flex-1`, group-hover opacity pattern, memo area `bg-muted/30 rounded-lg p-4`, note text `text-[11px]`
  - **`status-action-card.tsx`**: circle `size-20`, icon sizes (`size-8`), feedback box bg classes, checklist gap/icon size, BL alert `py-2`, approve/reject button width `w-full gap-2`
  - **`approve-dialog.tsx`**: summary row flex pattern, separator, BL Alert import
  - **`reject-dialog.tsx`**: select trigger placeholder, textarea rows, button order
  - **`cancel-dialog.tsx`**: Alert border/bg class per payment method, textarea label asterisk, cancel action resets reason
  - **`membership-application-detail.tsx`**: column widths (`w-[60%]`, `w-[40%]`), outer gap (`gap-6`), sticky top value (`sticky top-6`)
- [ ] Fix every found divergence in-place before marking done

**Acceptance**: All className strings, layout proportions, and conditional rendering match the prototype code exactly.

---

## TASK-22 — Type-check and lint

- [ ] Run `npm run type-check` — zero errors
- [ ] Run `npm run lint` — zero errors or warnings

**Acceptance**: Both commands exit with code 0.

---

## Task Summary

| Task    | File(s)                                                  | Type      | Est. complexity |
| ------- | -------------------------------------------------------- | --------- | --------------- |
| TASK-01 | `components/common/page-header.tsx`                      | Create    | Low             |
| TASK-02 | `_schemas/membership-application.schema.ts`              | Edit      | Medium          |
| TASK-03 | `api/crm/membership-applications/[id]/route.ts`          | Edit      | Medium          |
| TASK-04 | `api/_mock-db.ts`                                        | Edit      | Medium          |
| TASK-05 | CLI                                                      | Generate  | Low             |
| TASK-06 | 13 files                                                 | Delete    | Low             |
| TASK-07 | `_components/membership-application-detail-skeleton.tsx` | Create    | Low             |
| TASK-08 | `_components/applicant-info-card.tsx`                    | Create    | Medium          |
| TASK-09 | `_components/blacklist-result-card.tsx`                  | Create    | Low             |
| TASK-10 | `_components/contract-info-card.tsx`                     | Create    | Low             |
| TASK-11 | `_components/fee-payment-card.tsx`                       | Create    | Medium          |
| TASK-12 | `_components/activity-timeline-card.tsx`                 | Create    | Medium          |
| TASK-13 | `_components/approve-dialog.tsx`                         | Create    | Low             |
| TASK-14 | `_components/reject-dialog.tsx`                          | Create    | Low             |
| TASK-15 | `_components/cancel-dialog.tsx`                          | Create    | Low             |
| TASK-16 | `_components/cancel-error-dialog.tsx`                    | Create    | Low             |
| TASK-17 | `_components/application-meta-card.tsx`                  | Create    | Low             |
| TASK-18 | `_components/status-action-card.tsx`                     | Create    | High            |
| TASK-19 | `_components/membership-application-detail.tsx`          | Create    | High            |
| TASK-20 | `[id]/page.tsx`                                          | Rewrite   | Low             |
| TASK-21 | Browser                                                  | UI Review | Medium          |
| TASK-22 | CLI                                                      | QA        | Low             |

**Total: 22 tasks** — recommended implementation order: TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06 → TASK-07 through TASK-18 (any order) → TASK-19 → TASK-20 → TASK-21 → TASK-22.

---

## Handoff

```
Next agent: speckit.implement
Task: Implement tasks in order TASK-01 through TASK-22 as defined above
```
