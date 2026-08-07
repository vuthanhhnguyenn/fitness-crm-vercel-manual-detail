# Specification-Driven Development (SDD) — Fitness CRM

> How and why we use SDD in this project, and what problems it solves compared to unstructured AI-assisted coding.

---

## 1. Evolution of AI-Assisted Development

### Phase 1 — AI Assistance (2023)

Engineers use GitHub Copilot or Cursor for inline suggestions. The human writes the code; AI is a fast autocomplete.

### Phase 2 — Vibe Coding (2024)

Models like Claude and GPT-4o become capable enough that "describe roughly what you want → working prototype" is real. Non-engineers can build small products. Fast to start, but no structure to sustain growth.

### Phase 3 — Agentic Coding (2025–present)

Tools like **GitHub Copilot (agent mode)** and Cursor operate autonomously across multiple files — implementing, testing, and revising without per-line supervision. **This is where SDD becomes necessary.** Without structured specifications the agent has no stable contract to work against.

---

## 2. Vibe Coding: What It Solves and Where It Breaks

Vibe Coding solved the **0 → 1 speed problem** — anyone with an idea can produce a prototype without deep technical knowledge. That value is real.

But the limitations are structural, not incidental:

| Problem                      | Detail                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Context loss**             | Each new session starts with no memory of prior decisions. Once the codebase grows past a few hundred lines the model starts generating code that contradicts earlier choices. |
| **No architecture**          | "Just make it work" produces tangled module dependencies. Adding a feature later becomes archaeology.                                                                          |
| **Implicit intent**          | _Why_ something was designed a certain way is never recorded. Three months later — by another developer, another AI session, or even yourself — the reasoning is gone.         |
| **Unverifiable correctness** | "It looks like it works" ≠ "it works according to the spec." Edge cases, security requirements, and accessibility constraints are never systematically considered.             |

### The typical lifecycle of a Vibe-Coded system

```
0–3 months   → comfortable to use, easy to change
3–12 months  → every change breaks something else, AI dependency grows
12+ months   → effectively unmaintainable, or full rewrite required
```

A full rewrite is doubly expensive because the original intent cannot be recovered from unstructured code.

---

## 3. What SDD Is

> **"Optimise the input to the AI agent so that the output is controllable."**

Every Vibe Coding problem traces back to poor input quality and structure. SDD fixes the input.

### Three things SDD does

**① Externalise intent before coding (specification first)**
Write acceptance criteria, edge cases, and constraints in a structured spec before any code is generated. AI agents are literal interpreters — ambiguous input produces ambiguous output. A precise spec makes the result predictable.

**② Define context boundaries**
Decompose the system into spec-sized units that fit comfortably inside an AI context window. Decide explicitly what the agent needs to know for each session.

**③ Persist decisions as living documents**
The spec, not the code, carries the system's intent. Any future session — by any agent or developer — can reconstruct _why_ the code is the way it is by reading the spec.

### SDD vs TDD vs BDD

| Method  | Starting point             | Primary focus                                    |
| ------- | -------------------------- | ------------------------------------------------ |
| TDD     | Test                       | Unit-level behaviour guarantee                   |
| BDD     | Natural-language behaviour | User-perspective scenario                        |
| **SDD** | **Spec document**          | **Architecture-level constraints and contracts** |

SDD does not replace TDD or BDD — it operates at the architecture layer while TDD handles unit-level verification. They are complementary.

### How the developer role changes

|                | Vibe Coding                             | SDD                                              |
| -------------- | --------------------------------------- | ------------------------------------------------ |
| Developer role | Instruction giver                       | **Spec designer + output verifier**              |
| Primary work   | Prompting and re-prompting              | **Writing specs, reviewing generated artefacts** |
| AI involvement | Continuous "make it like this" dialogue | Agent runs autonomously within the spec contract |

---

## 4. SDD in This Project

### Toolchain

| Tool                                       | Role                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| **GitHub Copilot (agent mode)**            | AI agent that executes SpecKit skills                               |
| **SpecKit**                                | Skill set: `specify → clarify → plan → tasks → analyze → implement` |
| **Zod + `@asteasolutions/zod-to-openapi`** | Schema as single source of truth for types and OpenAPI spec         |
| **`@hey-api/openapi-ts`**                  | Generates TypeScript client + React Query factories from OpenAPI    |
| **TanStack React Query**                   | Server-state ownership; all fetches via generated option-factories  |

### Why SpecKit maps naturally to this project

The Fitness CRM already has a strongly-typed, contract-first architecture:

```
Zod schema (spec)
    → openapi.json (contract)
    → types.gen.ts (TypeScript types)
    → react-query.gen.ts (React Query factories)
    → component (implementation)
```

SpecKit's artefact chain mirrors this:

```
spec.md → plan.md → tasks.md → code
```

Both chains share the same principle: **the upstream document is the source of truth; downstream artefacts are derived and must not contradict it.**

---

## 5. The Three SDD Conditions — and How This Project Meets Them

SDD only works when three conditions hold:

| Condition                           | Status                  | How it is met                                                                                                                                      |
| ----------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec exists as source of truth**  | ✅                      | `specs/<feature>/spec.md` generated and reviewed before any code is written. Status field: `draft → approved → implemented`.                       |
| **Context is controllable**         | ✅                      | Feature specs are self-contained files. SpecKit skills read only the relevant spec + constitution + steering — not the whole codebase.             |
| **Spec and code do not contradict** | ✅ new code / ⚠️ legacy | New features: spec is updated in the same PR as the code (enforced by review protocol). Legacy code: incremental — each touched file gains a spec. |

---

## 6. Consequences of Skipping SDD

Skipping spec generation and running `speckit.implement` directly on a vague description leads to exactly the Vibe Coding failure modes listed in Section 2.

Specific risks for this project:

| Risk                                | Impact                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Codegen pipeline ignored            | `types.gen.ts` drifts from Zod schemas → silent runtime type errors in CRM data flows         |
| Provider / context pattern bypassed | Two `useFiltersHook()` instances → URL state out of sync, pagination breaks                   |
| `any` introduced                    | ESLint blocks the build; Constitution Principle I violated                                    |
| Spec not updated when code changes  | Next feature built on wrong assumptions; `speckit.analyze` will flag CRITICAL on the next run |

---

## 7. Summary

```
Vibe Coding    → unlocks AI capability, loses control
SDD            → recovers that control through structured specifications
               → works best on new code with clear boundaries
               → SpecKit provides the skill chain to execute it consistently

This project   → contract-first architecture (Zod → OpenAPI → generated client)
               → mirrors SDD's own artefact chain
               → SpecKit + GitHub Copilot is the natural fit
```

**SDD is not a silver bullet. It works when applied correctly on well-bounded features. The Constitution and Implementation Playbook are the guardrails that keep the agent within those bounds.**

---

_Created: 2026-04-14_
_Tools: SpecKit · GitHub Copilot · Next.js 16 · TypeScript 5 · Zod_
