# Fitness CRM User Personas

> User types, roles, and behavior patterns.
> Reference to determine which users are impacted during requirements definition.

---

## Persona List

| #   | Persona        | Japanese     | System          | Primary Concern                 |
| --- | -------------- | ------------ | --------------- | ------------------------------- |
| 1   | Store Staff    | 店舗スタッフ | CRM             | Efficient member support        |
| 2   | Manager        | マネージャー | CRM             | Store operations oversight      |
| 3   | Trainer        | トレーナー   | CRM (limited)   | Lesson scheduling               |
| 4   | Headquarter    | 本部         | CRM             | Full system management          |
| 5   | Observer       | 閲覧のみ     | CRM (read-only) | View access only                |
| 6   | Member         | 会員         | Mobile App      | Convenient gym experience       |
| 7   | Applicant      | 申請者       | Mobile App      | Easy signup process             |
| 8   | Companion      | 同伴者       | Mobile App      | Guest invited by premium member |
| 9   | 1Day Pass User | 1Day会員     | Mobile App      | Single-visit ticket             |

---

## CRM Users (Internal)

### 1. Store Staff (店舗スタッフ)

- Full/part-time employee at a gym location. Uses CRM daily.
- **"Happy"**: Liberation from admin tasks → more time for member interaction.

| Top Features           | Module |
| ---------------------- | ------ |
| Member search/details  | A-01   |
| Entry monitor          | B-01   |
| Application review     | C-01   |
| Locker management      | E-01   |
| Payment/billing lookup | F-01   |

### 2. Manager (マネージャー)

- Oversees one or multiple stores. Reports to area/regional management.
- **"Happy"**: Operational visibility — understand store status at a glance.

| Top Features              | Module     |
| ------------------------- | ---------- |
| Dashboard                 | Z-01       |
| Entry monitor             | B-01       |
| Transfer/withdrawal lists | A-02, A-03 |
| Staff management          | Y-01       |
| Billing overview          | F-01       |

### 3. Trainer (トレーナー)

- Full-time or contracted instructor. Limited CRM access (lessons only).
- **"Happy"**: Schedule management in one place — no more LINE + paper notes.

| Top Features               | Module |
| -------------------------- | ------ |
| My schedule view           | D-01   |
| Session booking management | D-01   |
| Session attendance (QR)    | D-01   |

### 4. Headquarter (本部)

- Corporate staff managing multiple brands/stores. Sets up contracts, campaigns, master data.
- **"Happy"**: Business visibility at scale — data-driven decisions.

| Top Features                | Module |
| --------------------------- | ------ |
| Analytics/Reports           | X-01   |
| Contract management         | G-01   |
| Campaign management         | G-03   |
| Staff/permission management | Y-01   |
| Store management            | Y-02   |

---

## App Users (External)

### 6. Member (会員)

- Active gym member. Uses mobile app for entry, bookings, workout tracking.

| Top Features     | Module     |
| ---------------- | ---------- |
| Entry QR code    | B-01       |
| Lesson booking   | D-01       |
| Workout tracking | Y-08, Y-09 |
| Payment history  | F-01       |

### 7. Applicant (申請者)

- Person applying for membership via mobile app.

```
Download app → Select campaign → Enter info → Age verify → Photo upload
→ Select options → Register payment → Submit → Wait for review → Approved
```

---

## Persona × Feature Matrix

| Feature Category       | Staff | Manager | Trainer | HQ  | Member | Applicant |
| ---------------------- | ----- | ------- | ------- | --- | ------ | --------- |
| Member management (A)  | ★★★   | ★★★     | ★       | ★★★ | —      | —         |
| Entry/exit (B)         | ★★★   | ★★      | —       | ★   | ★★★    | —         |
| Applications (C)       | ★★★   | ★★      | —       | ★★  | —      | ★★★       |
| Lessons (D)            | ★★    | ★★      | ★★★     | ★   | ★★★    | —         |
| Facilities (E)         | ★★★   | ★★      | —       | ★   | ★      | —         |
| Billing (F)            | ★★    | ★★      | —       | ★★★ | ★      | ★         |
| Products/Campaigns (G) | ★     | ★       | —       | ★★★ | —      | ★★        |
| Content (I)            | ★     | ★       | —       | ★★★ | ★      | ★         |
| Analytics (X)          | —     | ★★      | —       | ★★★ | —      | —         |
| System Settings (Y)    | ★     | ★★      | —       | ★★★ | —      | —         |
| Dashboard (Z)          | ★★    | ★★★     | —       | ★★★ | —      | —         |

★★★ = Heavy use, ★★ = Regular, ★ = Occasional, — = N/A

---

## Role → Store Access

| Role        | Scope                       | Data Access             |
| ----------- | --------------------------- | ----------------------- |
| System      | All                         | Full (dev/ops)          |
| Headquarter | All stores, all brands      | Full read/write         |
| Manager     | Assigned stores/areas       | Full within scope       |
| Staff       | Single store                | Operations within store |
| Trainer     | Single store (lessons only) | Lesson data only        |
| Observer    | Assigned scope              | Read-only               |
