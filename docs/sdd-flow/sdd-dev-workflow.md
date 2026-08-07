# SDD Development Workflow — Fitness CRM

> AI-assisted development workflow using **SpecKit** (GitHub Copilot) for the Fitness CRM project.
> Reference: [sdd-sequence-flow.md](./sdd-sequence-flow.md) | [constitution.md](../.specify/memory/constitution.md)

---

## Overview

```
PO / PM → Feature idea
    |
    v
[Phase 1] Kickoff & Handoff ──── Commit prototype + flow screens + spec assets to feature branch
    |
    v
Feature Branch (### -feature-name)
    |
    v
[Phase 2] FE: Spec Analysis & Implementation
    |
    ├─ speckit.specify ──── spec.md (draft)
    ├─ speckit.clarify ──── spec.md (finalized, all [NEEDS CLARIFICATION] resolved)
    ├─ speckit.plan    ──── plan.md · research.md · data-model.md · api-contracts/
    ├─ speckit.tasks   ──── tasks.md
    ├─ speckit.analyze ──── consistency report (spec / plan / tasks)
    └─ speckit.implement── code + tests
    |
    v
★ Review Gate 1 – Spec Approved (PO / BA)
    |
    v
[Phase 3] BE Integration & FE–BE Contract QA ──── openapi.json finalized
    |
    v
★ Review Gate 2 – Contract Finalized (FE + BE)
    |
    v
[Phase 4] FE: Real API Integration
    |
    ├─ speckit.plan    ──── plan-integrate-api.md · tasks-integrate-api.md
    └─ speckit.implement── integrated code
    |
    v
[Phase 5] QC: System Testing
    |
    v
★ Review Gate 3 – QC Sign-off
    |
    v
[Phase 6] Bug Triage & Fix (if defects)
    |
    ├─ speckit.specify ──── spec.md (bug scope update)
    ├─ speckit.tasks   ──── tasks-bug.md
    └─ speckit.implement── fixed code
    |
    v
[Phase 7] Verification & Release ──── MR approved → merge → deploy
    |
    v
★ Review Gate 4 – MR Approved
```

---

## Phase 1: Kickoff & Handoff

PO/PM commits prototype, flow screens, and spec assets to the feature branch and notifies the team.

### Branch naming

```
### -feature-name
# Example: 001-staff-list
```

### What to commit

| Asset                          | Location           |
| ------------------------------ | ------------------ |
| Prototype (HTML or Figma link) | `specs/<feature>/` |
| Flow screens (PNG / Figma)     | `specs/<feature>/` |
| Spec assets (Markdown notes)   | `specs/<feature>/` |

---

## Phase 2: FE Spec Analysis & Implementation

### Step 1 — Draft spec (`speckit.specify`)

Trigger SpecKit Specify with the feature description and commit reference. SpecKit pulls the spec assets from the branch, performs a diff, and generates `spec.md`.

**Output:** `specs/<feature>/spec.md` (draft — contains `[NEEDS CLARIFICATION]` tags)

### Step 2 — Clarify (`speckit.clarify`)

SpecKit identifies up to 5 targeted clarification questions about underspecified areas.

- Resolve within Dev authority → answer directly
- Resolve outside Dev authority → escalate to PO/PM, feed decision back to SpecKit
- All `[NEEDS CLARIFICATION]` tags must be resolved before proceeding

**Output:** `specs/<feature>/spec.md` (finalized)

Commit the finalized spec:

```bash
git add specs/<feature>/spec.md
git commit -m "docs: finalize spec for <feature>"
```

★ **Review Gate 1** — PO and BA review `spec.md`. All acceptance criteria must be verifiable. Status moves from `draft` → `approved`.

### Step 3 — Implementation plan (`speckit.plan`)

SpecKit generates the technical implementation plan from the approved spec.

**Output:**

- `specs/<feature>/plan.md`
- `specs/<feature>/research.md`
- `specs/<feature>/data-model.md`
- `specs/<feature>/contracts/api-contracts.md`

### Step 4 — Task breakdown (`speckit.tasks`)

SpecKit breaks the plan into a dependency-ordered task list.

**Output:** `specs/<feature>/tasks.md`

### Step 5 — Consistency analysis (`speckit.analyze`)

SpecKit performs a read-only cross-artifact check across `spec.md`, `plan.md`, and `tasks.md`.

- Constitution violations → CRITICAL (must fix before proceeding)
- Inconsistencies / gaps → HIGH/MEDIUM (fix or document justification)

**Output:** Analysis report (no files modified)

### Step 6 — Implementation (`speckit.implement`)

SpecKit executes `tasks.md` following the implementation order documented below.

**Implementation order (MANDATORY):**

```
Phase 1: Data Layer
  □ src/types/<feature>.type.ts
  □ src/app/api/_schemas/<feature>.schema.ts
  □ src/app/api/_mock-db.ts (extend with seed data)

Phase 2: API Routes
  □ src/app/api/crm/<feature>/route.ts
  □ src/app/api/crm/<feature>/<sub-resource>/route.ts  (if needed)
  □ src/app/api/crm/<feature>/[id]/route.ts            (if DELETE/PATCH needed)
  □ src/app/api/_routes/index.ts                       (add imports)
  □ npm run generate-openapi                           (dev server must be running)
  □ npm run generate-api
  □ Verify generated factories in src/lib/api/

Phase 3: UI Components
  □ src/app/(private)/<feature>/_hooks/use-<feature>-filters.ts
  □ src/app/(private)/<feature>/_contexts/<feature>-filters-context.tsx
  □ src/app/(private)/<feature>/_components/<feature>-table-columns.tsx
  □ src/app/(private)/<feature>/_components/<feature>-filters.tsx
  □ src/app/(private)/<feature>/_components/<feature>-delete-dialog.tsx
  □ src/app/(private)/<feature>/_components/<feature>-invite-dialog.tsx (if needed)
  □ src/app/(private)/<feature>/page.tsx
  □ src/app/(private)/<feature>/layout.tsx                              (if needed)

Phase 4: Validation
  □ npm run type-check  (zero errors)
  □ npm run lint        (zero errors)
  □ npm run build       (bundle ≤ 250 kB per route)
  □ Manual browser test
```

**Output:** Code + tests committed to feature branch with mock API

```bash
git add .
git commit -m "feat(<feature>): implement UI with mock API (refs spec)"
```

---

## Phase 3: BE Integration & FE–BE Contract QA

FE hands off `api-contracts/` to BE for review and real API implementation.

### Contract review checklist

| Item                                             | Owner   |
| ------------------------------------------------ | ------- |
| Endpoint paths match spec                        | FE + BE |
| Field names and data types match `data-model.md` | FE + BE |
| Auth flow and error codes are agreed             | FE + BE |
| Breaking changes require PO sign-off             | PO      |

★ **Review Gate 2** — BE commits `openapi.json` (real API). FE confirms the contract matches `api-contracts.md`.

---

## Phase 4: FE — Real API Integration

### Step 1 — Integration plan (`speckit.plan`)

Feed `openapi.json` into SpecKit to generate the integration plan.

**Output:**

- `specs/<feature>/plan-integrate-api.md`
- `specs/<feature>/tasks-integrate-api.md`

### Step 2 — Implementation (`speckit.implement`)

Execute `tasks-integrate-api.md`. Verify all four states: `loading` / `error` / `empty` / `success`.

```bash
git add .
git commit -m "feat(<feature>): integrate real API (refs spec)"
# Remove temp plan/task files from the branch
git rm specs/<feature>/plan-integrate-api.md
git rm specs/<feature>/tasks-integrate-api.md
git commit -m "chore: remove temp integration plan files"
```

---

## Phase 5: QC — System Testing

| Input                           | Source  |
| ------------------------------- | ------- |
| Test build (integrated branch)  | FE Dev  |
| `spec.md` + acceptance criteria | PO / PM |

| Outcome       | Next step                                   |
| ------------- | ------------------------------------------- |
| All passed    | ★ Gate 3 — QC sign-off → proceed to Phase 7 |
| Defects found | Bug report + evidence → Phase 6             |

---

## Phase 6: Bug Triage & Fix

### Triage

Request reproduction steps from QC. Determine bug scope:

| Scope  | Action                                               |
| ------ | ---------------------------------------------------- |
| BE bug | Hand off report + evidence + affected endpoint to BE |
| FE bug | Proceed with SpecKit fix flow below                  |
| Shared | Coordinate FE + BE, split into separate fix tickets  |

### FE bug fix flow

1. **`speckit.specify`** — feed bug report → update `spec.md` with bug scope
2. Escalate to PO if the fix requires a spec change; get decision before proceeding
3. **`speckit.tasks`** — generate `tasks-bug.md` from updated spec
4. **`speckit.implement`** — execute `tasks-bug.md`

```bash
git add .
git commit -m "fix(<feature>): <bug description> (refs bug-ID + spec)"
```

Notify QC: fix deployed, ready for re-verification.

---

## Phase 7: Verification & Release

QC re-tests and confirms sign-off. PO/PM approves the MR.

```
QC re-test passed
    → PO approves MR
    → Merge to main / release branch
    → Deployed to production
```

★ **Review Gate 4** — MR approval. Reviewer checklist:

| Step | Check                                                   |
| ---- | ------------------------------------------------------- |
| 1    | All acceptance criteria in `spec.md` are met            |
| 2    | No interfaces listed in "do not change" are broken      |
| 3    | No files outside the defined scope were modified        |
| 4    | Constitution Check section is complete (Principles I–V) |

---

## SpecKit Agent Quick Reference

| Agent               | Command                          | When to invoke                                                              |
| ------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `speckit.specify`   | `@speckit.specify <description>` | Phase 2 Step 1 — draft spec from assets; Phase 6 — bug scope update         |
| `speckit.clarify`   | `@speckit.clarify`               | Phase 2 Step 2 — resolve ambiguities before planning                        |
| `speckit.plan`      | `@speckit.plan`                  | Phase 2 Step 3 — implementation plan; Phase 4 — integration plan            |
| `speckit.tasks`     | `@speckit.tasks`                 | Phase 2 Step 4 — task list; Phase 6 — bug fix tasks                         |
| `speckit.analyze`   | `@speckit.analyze`               | Phase 2 Step 5 — cross-artifact consistency (run after tasks)               |
| `speckit.implement` | `@speckit.implement`             | Phase 2 Step 6 — execute tasks; Phase 4 — integrate API; Phase 6 — fix bugs |
| `speckit.checklist` | `@speckit.checklist <domain>`    | Any phase — generate requirements quality checklist                         |

---

## Definition of Done

A feature branch is ready to merge when ALL gates pass:

| Gate                  | Check                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------- |
| ✅ Type check         | `npm run type-check` → 0 errors                                                         |
| ✅ Lint               | `npm run lint` → 0 errors                                                               |
| ✅ Contract tests     | All API route contract tests pass (Constitution Principle IV)                           |
| ✅ Constitution Check | `spec.md` plan section has explicit pass / N/A / justified-exception for Principles I–V |
| ✅ Performance        | `npm run build` → bundle ≤ 250 kB per route; LCP ≤ 2.5 s                                |
| ✅ Design review      | No duplicate UI primitives; WCAG 2.1 AA contrast                                        |
| ✅ QC sign-off        | All acceptance criteria verified                                                        |

---

## Feedback Loop

| Situation                           | Action                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Spec is wrong after writing         | Re-run `speckit.specify` or edit `spec.md` directly; open a spec PR before changing code |
| Plan doesn't match spec             | Re-run `speckit.plan` with the corrected spec                                            |
| Tasks are too coarse                | Re-run `speckit.tasks`; target 1 task ≈ 1 atomic commit                                  |
| `speckit.analyze` flags CRITICAL    | Fix the affected artifact; do not proceed to `speckit.implement`                         |
| Code doesn't match spec             | `speckit.implement` self-reviews via `speckit.analyze`; fix and re-run                   |
| Codegen mismatch after route change | Follow codegen pipeline: `generate-openapi` → `generate-api` → verify factories          |

---

## Key Files Reference

| File                                         | Purpose                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| `.specify/memory/constitution.md`            | Project constitution — non-negotiable principles          |
| `docs/steering/`                             | System-wide patterns, glossary, and architecture          |
| `.github/copilot-instructions.md`            | Active tech stack and project structure                   |
| `specs/<feature>/spec.md`                    | Feature specification (SpecKit output)                    |
| `specs/<feature>/plan.md`                    | Implementation plan (SpecKit output)                      |
| `specs/<feature>/tasks.md`                   | Task list (SpecKit output)                                |
| `specs/<feature>/contracts/api-contracts.md` | FE–BE API contract                                        |
| `src/app/api/_mock-db.ts`                    | In-memory mock DB (must stay in sync with `types.gen.ts`) |
| `src/lib/api/`                               | Generated client — **do not edit manually**               |

## Example

> **Feature:** `C-01-01 入会申請詳細画面 (Membership Application Detail Page)`
> **Branch:** `feature/c01-01-application-detail`

---

### Phase 2, Step 1 — `speckit.specify`

**DEV prompt:**

```
/speckit.specify Create spec for screen "I-01 店舗ページ管理" (Store Page Management) using the agent: .github/agents/speckit.specify.agent.md

### Inputs:
Spec: .cache/fitness-crm-ui/public/requirements/I-01.md
UI Code: .cache/fitness-crm-ui/src/pages/store-page-list.tsx

### Scope Restriction:
**Phase 1 Only:** Focus exclusively on the features, user actions, and components allocated for Phase 1.
If the source spec or UI code contains placeholders, comments, or components designated for later phases (e.g., Phase 2+, future enhancements, or disabled features marked for future scope), explicitly exclude them from the active specifications and note them as "Out of Scope for Phase 1".

### Expected Output Requirements:
1. **Language:** The response and the generated spec.md must be written in English.
2. **Strict Grounding:** The specifications must be strictly based on the provided UI code and existing spec file. Do NOT make assumptions, do NOT invent new features, and do NOT omit any existing functionalities.
3. **Deep Code Analysis:** Analyze the UI code to extract:
   - Component hierarchy and layout structure.
   - User interaction scenarios (clicks, inputs, Toggles, etc.) and their expected behaviors.
   - UI states (Loading, Empty, Data-rendered, Error states if any in the code).
4. **Traceability:** Map each UI element found in the code to its corresponding requirement in the source spec.

### Handling Discrepancies & Missing Info (Preparation for speckit.clarify):
If there is any mismatch between the code and the requirement spec, or if the logic is ambiguous, do NOT guess.
Mark those specific parts with a [NEED CLARIFICATION] tag within the text.
Consolidate all these points into a dedicated **"Q&A / Clarification Needed"** section at the very bottom of the generated spec.md so it can be seamlessly processed in the next step (speckit.clarify). @speckit.specify.agent.md
```

**AI output:** `specs/membership-applications/detail/spec.md` (draft)

- 13 sections: overview, 2-column layout, 7 cards, 4 dialogs, API schema delta, permissions, state management, component file structure
- Contains `[NEEDS CLARIFICATION]` tags for 10 open questions (PageHeader shared?, role-gating?, cancel dropdown always visible?, ...)

**DEV review:** Reads spec, confirms it matches the Figma prototype structure. No structural issues found.

**DEV → next step:**

```
speckit.clarify
```

---

### Phase 2, Step 2 — `speckit.clarify`

**AI output:** Appended 10 Q&A blocks to `spec.md`, all `[NEEDS CLARIFICATION]` resolved:

| #   | Question                                      | Decision                                       |
| --- | --------------------------------------------- | ---------------------------------------------- |
| Q1  | PageHeader — new shared or inline?            | Create `src/components/common/page-header.tsx` |
| Q3  | Cancel dropdown — always show or conditional? | Always show; guard at click time               |
| Q6  | Memo add/delete — local state or API?         | Local state only (Phase 1)                     |
| …   | …                                             | …                                              |

**DEV review:** Checks Q1 and Q3 against PO decision. Q1 answer is correct. Q3 needs update — PO confirmed always visible.

**DEV update (direct edit to spec.md):**

```
Q3: Always show the MoreHorizontal dropdown regardless of status.
    Guard conditions (start date, cancel count) checked at click time only.
```

**DEV → next step:**

```
speckit.plan
```

---

### Phase 2, Step 3 — `speckit.plan`

**AI output:**

- `specs/membership-applications/detail/plan.md`
  - 25 execution steps
  - File creation list (14 new), file deletion list (13 old)
  - API schema changes, mock DB changes, GET route handler changes
  - Component design pseudocode for each card/dialog
  - Risk table

**DEV review:** Notices Step 22 is a manual browser check — wants automated code-vs-code review instead.

**DEV update request:**

```
Update plan step 22: instead of a browser check, change it to a code-vs-code UI review —
read the prototype file, compare it with the implementation, and auto-fix if there are differences.
Then create `tasks.md`.

speckit.tasks
```

**AI output:**

- Updated plan.md (Step 22 → Step 23, added UI code review step)
- `specs/membership-applications/detail/tasks.md` — 22 tasks in dependency order

---

### Phase 2, Step 6 — `speckit.implement`

**DEV prompt:**

```
Before implementation, update TASK-21 to a code-vs-code check (no browser).
If anything differs from the prototype, auto-fix it. Then implement all tasks.

speckit.implement
```

**AI execution sequence (automated, no DEV input needed per task):**

```
TASK-01  → created  src/components/common/page-header.tsx
TASK-02  → modified src/app/api/_schemas/membership-application.schema.ts
           + TimelineEntrySchema
           + 20 new fields in GetApplicationDetailResponseSchema
           + note?: string in RejectRequestSchema
TASK-03  → modified src/app/api/crm/membership-applications/[id]/route.ts
           - removed PATCH handler
           - extended GET response mapping
TASK-04  → modified src/app/api/_mock-db.ts
           + rich seed data for all 19 applications
           + special variants: BL match (0003, 0007, 0016), minor (0017), proxy (0018)
TASK-05  → ran: npm run generate-openapi && npm run generate-api
TASK-06  → deleted 9 old component files + 2 old schema files
TASK-07  → created applicant-info-card.tsx    (photo placeholder + masked fields)
TASK-08  → created blacklist-result-card.tsx  (match/no-match states)
TASK-09  → created contract-info-card.tsx     (brand/store/plan/dates/options)
TASK-10  → created fee-payment-card.tsx       (fee table + JACCS alert)
TASK-11  → created activity-timeline-card.tsx (timeline + memo input)
TASK-12  → created status-action-card.tsx     (circle + checklist + action buttons)
TASK-13  → created application-meta-card.tsx  (ID/date/source/proxy)
TASK-14  → created approve-dialog.tsx
TASK-15  → created reject-dialog.tsx
TASK-16  → created cancel-dialog.tsx
TASK-17  → created cancel-error-dialog.tsx
TASK-18  → created membership-application-detail-skeleton.tsx (2-column)
TASK-19  → created membership-application-detail.tsx (main orchestrator)
TASK-20  → rewrote page.tsx → clean async RSC
TASK-21  → code-vs-code review vs prototype:
           • Fixed column widths: w-[60%] / w-[40%] confirmed
           • Fixed sticky top-6 on right column
           • Fixed fee table: py-0 gap-0 on Card, first:pl-4 last:pr-4 on cells
           • Fixed timeline dot size-2.5, connector w-px flex-1
           • Fixed memo area bg-muted/30 rounded-lg p-4
           • Fixed note text text-[11px]
           All divergences auto-fixed.
TASK-22  → npm run type-check → 0 errors
           npm run lint (new files) → 0 errors
```

**DEV review:** Checks generated files against tasks.md checklist. All 22 tasks marked done. Commits:

```bash
git add .
git commit -m "feat(c01-01): implement membership application detail page with mock API (refs spec)"
```

---

### Key takeaways from this example

| Pattern                                      | Lesson                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| DEV edits spec between steps                 | Accepted — always edit `spec.md` directly then re-prompt next step                       |
| DEV changes task definition before implement | Prompt: "update TASK-X to …, then implement" — AI updates tasks.md first                 |
| AI auto-fixes during TASK-21                 | Code-vs-code review prevents browser round-trips; faster iteration                       |
| Type errors caught at TASK-22                | One error in unrelated `family-registrations` file fixed as collateral; zero regressions |
| Parallel tool calls                          | AI reads prototype + schema + route simultaneously — total implement time ≈ 1 session    |
