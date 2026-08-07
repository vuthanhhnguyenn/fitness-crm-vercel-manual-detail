# Fitness CRM Business Flows

> Change frequency: Medium (update when adding new features or modifying flows)
> Last updated: May 2026
>
> End-to-end business flows. For actors see [user-personas.md](./user-personas.md), for terms see [business-glossary.md](./business-glossary.md).

---

## 1. Member Onboarding (C-01 → A-01)

```
[Mobile App]                              [CRM]
Applicant: Select Campaign (→ G-03)
  → Enter personal info
  → Age check (JOYFIT 15+ / FIT365 16+)
    → Under age → blocked
    → Minor → parent consent required
  → Upload face photo
  → Select options (locker, etc.)
  → Register payment (SBPS / JACCS)
  → Submit application ──────────────→ C-01: Application created
                                          → Auto blacklist check
                                            → Match → staff review
                                          → Staff reviews (C-01-01)
                                            → Approve → Member created (A-01)
                                            → Enrollment fee charged (initial + prepay)
  ← Receive confirmation ─────────────────┘
```

---

## 2. Entry/Exit (B-01)

```
Member: Open app → Generate one-time QR
  → Present QR to gate reader
  → Gate validates:
    ├── Gate Stop (manual block by staff)? → display message
    ├── Unpaid balance? → display message
    ├── Blacklisted? → gate denied
    ├── Family card in use? → gate denied
    └── Valid → gate opens → entry log recorded → B-01 monitor
```

**Key rule**: One-time QR is invalid if member is already inside (prevents sharing).

---

## 3. Member Status Changes (A-01 / A-02 / A-03)

```
                     [Active Member]
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      SUSPENSION       WITHDRAWAL       TRANSFER
      (A-03)           (A-03)           (A-02)
           │               │               │
  Set start/end date   Request via     Request target store
           │           CRM              │
           ▼               │         ┌──┴──────────────┐
  [Suspended]              │         │ JOYFIT: Auto     │
  End date → [Active]      │         │ (origin approve) │
                           │         │ FIT365: Manual   │
                           ▼         │ (both approve)   │
                    [Withdrawn]      └──┬──────────────┘
                           │            ▼
                    Blacklist if   [Transfer complete]
                    unpaid         → New store active
```

---

## 4. Monthly Billing (F-01)

```
Day 2: Calculate amounts (primary contract + options + variable fees)
  → Staff/Manager: Review & confirm billing
  → Send to payment providers:
    ├── SBPS: Day 9 send → Day 13 result
    └── JACCS: Day 12–13 send → Next 4th result
  → Result:
    ├── Success → F-01-01: Payment record
    └── Failed → F-01-02: Unpaid management
        → Retry next month (no 6-month limit)
        → Eventually: paid (cleared) OR write-off at month end (bad debt)
```

### Forced Withdrawal Rules

| Provider | JOYFIT                      | FIT365                      |
| -------- | --------------------------- | --------------------------- |
| SBPS     | 2 months consecutive unpaid | 2 months consecutive unpaid |
| JACCS    | 1 month unpaid              | 3 months grace              |

---

## 5. Lesson Booking (D-01)

### Studio Lesson

```
HQ: Create lesson content master (D-02)
  → Store: Configure studio (D-03) → Create schedule (D-01)
  → Member: Book slot via app
  → Day of lesson: Scan QR → attendance confirmed
  → No-show: 2× in 1 week → 1-week booking ban
```

### Personal Training

| Mode                                            | Flow                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Mode A** (枠公開型 / Slot Publishing)         | Trainer publishes slots → Member books via app → Payment processed                                |
| **Mode B** (通知調整型 / Schedule Notification) | Trainer confirms monthly schedule → Notifies regulars → Clients respond → Trainer confirms in CRM |

---

## 6. Integration Points

| Integration         | Direction     | Purpose                                    |
| ------------------- | ------------- | ------------------------------------------ |
| SBPS                | Bidirectional | Credit card payment processing + results   |
| JACCS               | Bidirectional | Bank transfer payment processing + results |
| WordPress           | Export        | Store page content, announcements          |
| Push Notification   | Export        | SMS, push, email, in-app notifications     |
| Gate Control Device | Bidirectional | QR validation, entry/exit signals          |
| Mobile App Backend  | Bidirectional | Member data sync, booking, notifications   |
