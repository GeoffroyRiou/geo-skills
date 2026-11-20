---
name: to-architecture
description: >-
  Do all the research and design of a feature before to-issues: deep modules,
  interfaces, seams, slice plan. Exposes the final architecture as a simple
  Mermaid map the user validates, in a file that to-issues then turns into
  tickets without any design left. Use after a grill session, or when the user
  wants the architecture, the global picture, or to prepare to-issues.
---

# to-architecture

Design the whole feature once, before `to-issues`. Output: one validated file that shows the user exactly what the final code looks like, and gives `to-issues` everything it needs to write tickets with no research and no design.

Do not implement. Do not create tickets.

## Core principle

After this skill, nothing structural is left to discover. Every module, its role, its public interface, its seams, and the slice plan are decided here. `to-issues` writers only fix what stays hidden inside a module (private helpers, edge-case details, test cases), and they fix it in the tickets.

- **Grill decisions are settled:** apply them as is, never re-decide or re-ask. Same for `CONTEXT.md` terms and `docs/adr/`.
- **Technical gaps** the grill left open: you decide them, and expose them in the decisions section for the user to challenge.
- **Product gaps** (what users see, data kept or lost, scope): never guess. Ask in one batched round, with your recommendation for each.

## Token economy

Minimise tokens without losing quality:

- The architecture lives in the file only. Never print it in chat: chat is the file path plus what you need from the user.
- Apply feedback with targeted edits to the file, never full rewrites.
- Sub-agents get paths and focused questions, never pasted documents. They return facts only.
- Reuse what the grill already established instead of re-exploring it.
- An agent's cost is its number of turns times its context size: every turn re-reads the whole context. Fewer, bigger reads beat many small ones, for you and for sub-agents.
- Main thread: issue independent reads in parallel in one message. Read a spec once, in one pass (whole file, or the sections the grill points to), never in successive chunks.

## Input

The current conversation (usually right after a grill), or a spec/plan given as argument (path or text).

## Workflow

1. **Vocabulary.** Call the Skill tool with `codebase-design`. Use its terms (module, interface, seam, adapter, depth, leverage, locality) and principles (deletion test, the interface is the test surface, one adapter means a hypothetical seam). Read its `DEEPENING.md` to classify dependencies.
2. **Research**, once, with Explore sub-agents in parallel, `model: "sonnet"` (they collect facts, they do not design). Give each agent a **disjoint** scope: the list of areas, files or symbols it owns, so no file is read by two agents. Topics to cover:
   - Architecture of the touched areas: where things live, main flows, the existing modules the feature hooks into.
   - Conventions: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, CONTRIBUTING, coding-standards docs, linter configs, `CONTEXT.md` vocabulary, `docs/adr/`.
   - Test setup: framework, test file location and naming, shared helpers, exact command to run one test file.
   - Mirror: the closest existing module for each kind of module to create.
   - Exact current signature of every existing symbol the design reuses. Never invent "existing" symbols.

   Every research prompt includes the [Research agent rules](#research-agent-rules). Each agent writes its facts to `/tmp/geo-skills/<feature-slug>/FACTS-<scope>.md` and returns only that path and its `GAPS` line. Read the FACTS files, then close each gap with one targeted lookup yourself (`codegraph_explore`) or one focused follow-up agent. Never design on an unknown.
3. **Design the modules** (see Design rules). Product gaps found here: ask now, in one round.
4. **Slice** the work (see Slices).
5. **Write the draft** to `/tmp/geo-skills/<feature-slug>/ARCHITECTURE.md` following [FORMAT.md](FORMAT.md). If the file already exists, it is a previous draft of this feature: read it and continue with edits.
6. **Self-check** the draft before showing it: every new or modified module in the diagram has a module entry; every reused symbol was verified in the code; every downstream slice reuse matches an upstream Create exactly; design rules and slicing smells pass. Fix with targeted edits.
7. **Validate.** Chat: the file path, open product questions if any, and the 1 to 3 decisions most worth the user's attention, one line each. Apply each round of feedback with targeted edits. Loop until the user explicitly approves.
8. **Hand off.** After approval, output exactly these 2 lines and stop:

```
<absolute path of ARCHITECTURE.md>
/to-issues <absolute path of ARCHITECTURE.md>
```

## Research agent rules

Paste these into every research prompt:

- Start with one `codegraph_explore` naming every symbol and file you already know. Then read several files per call (parallel Reads in one message, or one `cat a b c`), never one grep per turn.
- Read only what answers your questions: signatures, call sites and the relevant lines, not whole bodies.
- Stay in your scope: other agents cover the rest.
- Budget: about 15 tool calls. It is a checkpoint, not a hard stop: at the budget, stop and list every still-open question in `GAPS` instead of guessing or digging further.
- Facts only, each with its file path (and line when useful). No design opinion. Unverified is not a fact: put it in `GAPS`.
- Return exactly: `FACTS: <path>` and `GAPS: <open questions, or none>`.

## Design rules

- **Deep modules:** a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. Apply the deletion test to every proposed module: merge pass-throughs, never split a responsibility that has a single caller.
- **Seams only where something varies:** a port needs two adapters (production + test). Classify every dependency with the `DEEPENING.md` categories; it decides how the module is tested.
- **Design it twice, targeted:** only for the 1 to 3 structuring modules where a genuinely different interface exists. Run step 2 of `DESIGN-IT-TWICE.md` with 2 sub-agents (a third only if a third genuinely different interface exists), same model as you: design needs judgment. Their brief is a short `/tmp/geo-skills/<feature-slug>/BRIEF.md` (problem, constraints, dependency categories) plus the paths of the FACTS files. They design from these files only and **do not explore the code**: a missing fact goes in a `GAPS` line, not a lookup. Compare yourself (depth, locality, seam placement), keep the best. Skip its user-facing steps: the rejected options become one-line decisions in the file.
- SOLID, DRY (reuse existing code instead of duplicating), simplest working design, repo conventions, `CONTEXT.md` names. When deep and simple conflict, simplest wins.
- No smell: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest, Shallow Module.
- Decide everything public: path, interface (signatures, invariants, ordering, error modes), dependencies and how they are obtained, exact call sites, test surface. Leave only module internals to the writers.

## Slices

Each slice is a **small, cohesive logical brick** (one responsibility, one reason to change) that delivers an observable outcome, **testable on its own when possible**. Size by cohesion, not by file count. Never squash modules together or split them apart to hit a number.

Each slice must pass:

- **One brick:** Goal fits in one sentence without "and" / "also" / "plus". If it needs a conjunction, split.
- **One concern:** everything it creates serves that Goal. No unrelated refactors or "while we're here" work.
- **Testable when possible:** checkable on its own, ideally by the user (screen, endpoint, CLI output), otherwise by automated tests. Done when is one concrete pass/fail check.

**Catch-all smells** (split): unrelated public symbols or more than ~2 of them; work spread over unrelated areas (schema + UI + email sending); several unrelated outcomes in Done when; one part acceptable while another is rejected.

**Too-thin smells** (merge into the neighbour): no observable behaviour on its own (a type or helper nothing uses or tests yet); Done when only checkable once another slice lands.
