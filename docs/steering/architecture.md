# Fitness CRM Architecture

> Change frequency: Low (update only when system structure changes significantly)
> Last updated: May 2026

---

## 1. System Overview

Fitness CRM is a **member management platform** for two fitness brands: **JOYFIT** and **FIT365**.

```
┌─────────────────────────────────────────────┐
│            Fitness CRM Platform              │
│                                              │
│  [CRM Web]     [Mobile App]    [WordPress]  │
│  (Next.js)     (iOS/Android)   (Public Web) │
│      └──────────┬──────────┘                │
│                 ▼                            │
│          [Backend API]                       │
│          (REST/OpenAPI)                      │
│              │                               │
│     ┌────────┼────────┐                      │
│     ▼        ▼        ▼                      │
│   [DB]    [SBPS]   [JACCS]                   │
│          (Credit)  (Bank)                    │
└─────────────────────────────────────────────┘
```

| Component      | Description                                    |
| -------------- | ---------------------------------------------- |
| **CRM Web**    | Staff-facing management console (this repo)    |
| **Mobile App** | Member-facing app for entry, bookings, account |
| **WordPress**  | Public website content                         |
| **SBPS**       | Credit card payment gateway                    |
| **JACCS**      | Bank transfer payment gateway                  |

---

## 2. Tech Stack

| Layer           | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| Runtime         | Node.js ≥ 24.0.0                                            |
| Framework       | Next.js 16 (App Router only)                                |
| Language        | TypeScript 5.x (strict mode, `no-explicit-any`)             |
| Styling         | Tailwind CSS v4 + `cn()` utility                            |
| Server State    | TanStack React Query                                        |
| URL State       | nuqs                                                        |
| Forms           | react-hook-form + Zod                                       |
| Schema Pipeline | Zod → OpenAPI → Generated TS Client + React Query factories |
| UI Components   | shadcn/ui (Radix primitives)                                |
| Icons           | lucide-react                                                |
| Toasts          | sonner                                                      |
| Dates           | date-fns v4                                                 |

---

## 3. Application Structure

```
src/
├── app/
│   ├── api/                    # API Routes (OpenAPI documented)
│   │   ├── _mock-db.ts         # In-memory mock database
│   │   ├── _schemas/           # Zod schemas for validation
│   │   ├── _routes/            # Route registration helpers
│   │   └── crm/               # CRM API endpoints
│   ├── (private)/              # Authenticated routes (CRM screens)
│   └── (public)/               # Public routes (login, 403)
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── common/                 # Shared (DataTable, breadcrumb, etc.)
├── lib/
│   ├── api/                    # GENERATED — do not edit manually
│   ├── utils.ts                # cn() utility
│   └── client.config.ts        # API client config
├── types/                      # Enums and type definitions
└── providers/                  # React context providers
```

### Feature Module Pattern

Each screen follows a consistent structure:

```
(private)/[module-name]/
├── page.tsx                    # Main page (RSC or Client)
├── _components/                # Module-specific components
├── _contexts/                  # Module-specific React contexts
└── _hooks/                     # Module-specific hooks
```

---

## 4. API Design

### OpenAPI-First Pipeline

```
Zod Schema → registerRoute() → OpenAPI Spec → npm run generate-api → TS Client + React Query
```

### API Route Map

```
/api/crm/
├── members/                    # GET: List
│   └── [id]/                   # GET/PATCH/DELETE: Single
├── staff/                      # GET: List
│   ├── [id]/                   # DELETE: Remove
│   ├── positions/              # GET: List positions
│   └── invitations/            # POST: Invite
└── applications/               # GET: List
    └── [id]/                   # GET/PATCH: Single
```

---

## 5. Authentication & Authorization

### 6-Role Model

| Role        | Japanese     | Scope                  |
| ----------- | ------------ | ---------------------- |
| System      | (hidden)     | All (dev/ops)          |
| Headquarter | 本部         | All stores, all brands |
| Manager     | マネージャー | Multiple stores        |
| Staff       | スタッフ     | Single store           |
| Trainer     | トレーナー   | Lesson-related only    |
| Observer    | 閲覧のみ     | Read-only              |

### 3-Tier Permission Structure

```
Role (fixed, 6 types)
└── Position Master (HQ configurable)
    └── Individual (Manager assigns per store)
```

### Store Access Patterns

- **Pattern A (Direct)**: Staff → Store (1:1)
- **Pattern B (FC Company)**: Staff → FC Company → All managed stores

---

## 6. Brand Configuration

| Setting                   | JOYFIT                       | FIT365                |
| ------------------------- | ---------------------------- | --------------------- |
| Minimum Age               | 15+                          | 16+                   |
| Transfer Mode             | Auto (origin approves)       | Manual (both approve) |
| Enrollment Fee            | ¥2,000 + ¥3,000 registration | ¥5,000 card fee       |
| Prepay Period             | 1–2 months (per contract)    | 2 months fixed        |
| Cross-use                 | Primary contract (free)      | Option (¥500)         |
| Forced Withdrawal (SBPS)  | 2 months unpaid              | 2 months unpaid       |
| Forced Withdrawal (JACCS) | 1 month unpaid               | 3 months grace        |

---

## 7. External Integrations

| Integration           | Direction     | Schedule / Purpose                       |
| --------------------- | ------------- | ---------------------------------------- |
| SBPS (Credit Card)    | Bidirectional | 9th: data send → 13th: result            |
| JACCS (Bank Transfer) | Bidirectional | 12–13th: send → next 4th: result         |
| WordPress             | Export        | Store page content, announcements        |
| Push Notification     | Export        | SMS, push, email, in-app                 |
| Gate Control Device   | Bidirectional | QR validation, entry/exit signals        |
| Mobile App Backend    | Bidirectional | Member data sync, booking, notifications |

---

## 8. Core Data Model

| Entity           | Description                      | Key Relations                      |
| ---------------- | -------------------------------- | ---------------------------------- |
| Member           | Gym member with primary contract | → Store, → Contracts, → Entry logs |
| Staff            | CRM user (employee)              | → Role, → Position, → Store/FC     |
| Store            | Physical gym location            | → Brand, → FC Company              |
| Brand            | JOYFIT or FIT365                 | → Stores, → Contract templates     |
| Primary Contract | Base membership agreement        | → Member, → Options                |
| Option           | Add-on services (locker, etc.)   | → Member, → Primary Contract       |

### Member Status Flow

```
[Application] → [Pending Review] → [Approved/Member]
                                        │
                            ┌───────────┴───────────┐
                            ▼                       ▼
                       [Active]               [Suspended]
                            │                       │
                            └───────────┬───────────┘
                                        ▼
                                   [Withdrawn] → [Blacklisted]
```

---

## 9. Related Documents

- [business-flows.md](./business-flows.md) — End-to-end business flows
- [business-glossary.md](./business-glossary.md) — Business term definitions
- [user-personas.md](./user-personas.md) — User types and behaviors
- `.github/copilot-instructions.md` — Code style, dev guidelines, project structure
