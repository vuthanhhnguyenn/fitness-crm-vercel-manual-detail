# Steering Index

> Navigation for all Steering docs.
> Register in AI tool's project settings for constant reference.

---

## Product Overview

**Project**: Move to Happy — Fitness CRM Renewal
**Brands**: JOYFIT / FIT365
**Go-Live**: September 2026 (Phase 1)

---

## Product-wide

| Document                                       | Purpose                                                      | Update Freq. |
| ---------------------------------------------- | ------------------------------------------------------------ | ------------ |
| [architecture.md](./architecture.md)           | System structure, tech stack, auth model, integrations       | Low          |
| [business-flows.md](./business-flows.md)       | End-to-end business flows (onboarding, entry, billing, etc.) | Medium       |
| [business-glossary.md](./business-glossary.md) | Japanese business terms → English / technical mapping        | Medium       |
| [user-personas.md](./user-personas.md)         | User types, roles, behavior patterns, feature matrix         | Low          |

---

## Module Index

| Cat | ID   | Module                            | Req Doc                | Status      |
| --- | ---- | --------------------------------- | ---------------------- | ----------- |
| A   | A-01 | Member Management (List)          | `requirements/A-01.md` | In Progress |
| A   | A-02 | Transfer Management               | `requirements/A-02.md` | In Progress |
| A   | A-03 | Suspension/Withdrawal Management  | `requirements/A-03.md` | In Progress |
| B   | B-01 | Entry/Exit Management             | `requirements/B-01.md` | In Progress |
| C   | C-01 | Membership Application Management | `requirements/C-01.md` | In Progress |
| D   | D-01 | Lesson Management                 | `requirements/D-01.md` | In Progress |
| D   | D-02 | Lesson Content Management         | `requirements/D-02.md` | In Progress |
| D   | D-03 | Studio Management                 | `requirements/D-03.md` | In Progress |
| D   | D-04 | Instructor Management             | `requirements/D-04.md` | In Progress |
| E   | E-01 | Locker Management                 | `requirements/E-01.md` | In Progress |
| E   | E-02 | Facility Equipment Management     | `requirements/E-02.md` | In Progress |
| E   | E-03 | Training Equipment Management     | `requirements/E-03.md` | In Progress |
| F   | F-01 | Sales Management                  | `requirements/F-01.md` | In Progress |
| G   | G-01 | Primary Contract Management       | `requirements/G-01.md` | In Progress |
| G   | G-02 | Option Management                 | `requirements/G-02.md` | In Progress |
| G   | G-03 | Campaign Management               | `requirements/G-03.md` | In Progress |
| G   | G-04 | Survey Management                 | `requirements/G-04.md` | In Progress |
| G   | G-05 | Enrollment Fee Management         | `requirements/G-05.md` | In Progress |
| G   | G-06 | Promo Code Management             | `requirements/G-06.md` | In Progress |
| I   | I-01 | Store Page Management             | `requirements/I-01.md` | In Progress |
| I   | I-02 | Announcement/Blog Management      | `requirements/I-02.md` | In Progress |
| I   | I-03 | Notification Management           | `requirements/I-03.md` | In Progress |
| X   | X-01 | Analytics & Reports               | —                      | Planned     |
| Y   | Y-01 | Staff & Permission Management     | `requirements/Y-01.md` | In Progress |
| Y   | Y-02 | Store Management (Master)         | `requirements/Y-02.md` | In Progress |
| Y   | Y-03 | FC Company Management             | `requirements/Y-03.md` | In Progress |
| Y   | Y-04 | Terms & Policy Management         | `requirements/Y-04.md` | In Progress |
| Y   | Y-05 | App Version Management            | `requirements/Y-05.md` | In Progress |
| Y   | Y-06 | App Maintenance Management        | `requirements/Y-06.md` | In Progress |
| Y   | Y-07 | Brand Management (Master)         | `requirements/Y-07.md` | In Progress |
| Y   | Y-08 | Exercise Management (Master)      | `requirements/Y-08.md` | In Progress |
| Y   | Y-09 | Routine Management (Master)       | `requirements/Y-09.md` | In Progress |
| Y   | Y-10 | CRM Maintenance Management        | `requirements/Y-10.md` | In Progress |
| Z   | Z-01 | Dashboard                         | —                      | Planned     |

## Category Summary

| ID  | Category               | Primary Role                                | Primary Actors |
| --- | ---------------------- | ------------------------------------------- | -------------- |
| A   | Member Management      | Search, view, manage existing members       | Staff, HQ      |
| B   | Entry/Exit             | Real-time monitoring, historical entry data | Staff          |
| C   | Membership Application | App-based membership review and approval    | Staff, HQ      |
| D   | Lesson Management      | Studio & personal training scheduling       | Staff          |
| E   | Facility & Equipment   | Lockers, devices, training equipment        | Staff, HQ      |
| F   | Sales Management       | Payment records, billing, collections       | HQ, Staff      |
| G   | Products & Campaigns   | Contracts, options, campaigns, surveys      | HQ             |
| I   | Content                | Website & mobile app content delivery       | HQ, Staff      |
| X   | Analytics & Reports    | Behavioral analysis, usage statistics       | HQ, Staff      |
| Y   | System Settings        | Staff permissions, store/brand masters      | HQ             |
| Z   | Dashboard              | Real-time snapshots, role-based summaries   | All            |

## Related Docs (outside Steering)

| Document                          | Summary                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `.github/copilot-instructions.md` | Agent dev guidelines, tech stack, code style, project structure |
| `requirements/`                   | Detailed feature specifications per module                      |

---

## Related Documents

| Category     | Document                                          | Summary                           |
| ------------ | ------------------------------------------------- | --------------------------------- |
| Requirements | `requirements/CRM情報設計_構造化定義書.md`        | Overall CRM information design    |
| Requirements | `requirements/A-01.md` ... `requirements/Y-11.md` | Feature-specific requirements     |
| Guidelines   | `.github/copilot-instructions.md`                 | Development guidelines for agents |
| Specs        | `specs/`                                          | Feature specifications            |

---

_Last updated: April 2026_
