---
name: to-issues
description: >-
  Turn a prompt or plan into implementation-ready vertical-slice tickets
  (Linear, GitHub Issues, or markdown) where the whole design is pre-decided,
  so a smaller model implements them without design choices. Use when the user
  asks to create issues, tickets, or slices from a plan/spec, including right
  after a grill session.
---

# to-issues

Create tickets only. Do not implement.

## Core principle: the thinking happens here

Issues are executed by a **less capable implementer** (e.g. Sonnet instead of Opus). It must reach the same result a strong model would, by following the ticket. So every design decision is made **in the ticket**, not during implementation:

- If the implementer would have to **choose** something (file, name, signature, pattern, data flow, error handling, edge-case behaviour, test cases), the ticket decides it.
- Anything a reviewer could flag (SOLID/DRY breach, shallow module, smell, naming conflict, missing edge case, wrong layer) must be resolved in the plan before filing.
- Target: the generated code gets **little to no review feedback**. A review finding on a faithfully implemented ticket is a planning bug.

**Who decides what:**

- **Grill decisions are settled.** to-issues normally runs right after a grill session: every decision taken there (product and technical) goes into the tickets as is. Do not re-decide, reinterpret, or ask about them again. The same goes for `CONTEXT.md` terms and `docs/adr/` decisions.
- **Technical gaps** the grill did not cover (structure, patterns, signatures, internal error handling): decide them yourself from the code and the design rules below.
- **Product gaps** (what end users see, data kept or lost, scope) that neither the grill nor the input settles: rare after a grill, but never guess them: ask the user in one batched round, with your recommendation for each, before writing bodies.

Banned in issue bodies (each one hands a decision to the implementer): "e.g.", "maybe", "if needed", "as appropriate", "or similar", "something like", "handle errors properly", "add tests". Replace with the concrete decision.

## User-facing output

Be concise with the user. Smallest understandable chat output.

No length limit on issue bodies, filed tickets, or code written into those tickets. Completeness beats brevity in the body.

## Destination

1. If the user names Linear, GitHub, or Markdown, use that.
2. Else prefer the tracker the repo already uses.
3. If unclear: Linear, then GitHub, then Markdown.

**Linear team / GitHub repo:** prompt override, else current GitHub repo / sole Linear team, else ask once if multiple Linear teams.

**Labels (Linear/GitHub):** parent `epic`, children `slice`, plus any labels from the prompt. Markdown: no labels.

## Slices

Extract **vertical slices**: each slice is a **small, cohesive logical brick** (one responsibility, one reason to change) that delivers an observable outcome, **testable on its own when possible**.

Size by cohesion, not by file count. A slice touches whatever files its brick naturally needs (its Reuse + Create). Never squash modules together or split them apart to hit a number.

Before filing a slice, it must pass:

- **One brick:** Goal fits in one sentence without "and" / "also" / "plus". If it needs a conjunction, split.
- **One concern:** every Create symbol and every Do step serves that Goal. No unrelated refactors, cleanups, or "while we're here" work.
- **Testable when possible:** the brick can be checked on its own, ideally by the user (a visible result to try: screen, endpoint, CLI output), otherwise by automated tests (unit tests are fine). Done when states that check as concrete pass/fail. If neither makes sense (pure wiring, config, docs), Done when is still one concrete pass/fail check.
- **Tests:** no limit on the number of automated tests. Plan as many as the brick's behaviour needs (main case, edge cases, errors), all targeting this brick.
- **TDD order:** Do steps go failing test first (RED), then minimal implementation (GREEN), when TDD applies.

**Catch-all smells** (split when you see one):

- Create lists symbols with unrelated purposes, or more than ~2 new public symbols.
- Do steps jump between unrelated areas (schema + UI + email sending in one slice).
- Done when describes several unrelated outcomes.
- One part of the slice could be accepted while another part is rejected.

**Too-thin smells** (merge into the neighbour slice):

- No observable behaviour on its own (a type or helper that nothing uses or tests yet).
- Done when can only be checked once another slice lands.

## Research (mandatory before writing bodies)

The ticket can only pre-decide what you have verified. For each slice, establish from the real codebase (delegate to Explore sub-agents with focused questions and minimal-output answers to keep context small):

1. **Architecture input:** grill decisions / provided file / prompt first, plus `CONTEXT.md` (domain vocabulary for naming) and `docs/adr/` when present; codebase fills the gaps. Reuse facts the grill already established instead of re-exploring them. Never invent fake "existing" symbols.
2. **Reuse targets:** exact file path, symbol, current signature, and behaviour the slice relies on.
3. **Insertion points:** where each Create lives (exact path) and who calls it.
4. **Model to mirror:** the closest existing module doing something similar (structure, naming, error handling, DI, logging). Point the implementer at it.
5. **Conventions:** project rules (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, CONTRIBUTING, coding-standards docs), linter/formatter configs, then neighbouring code. Naming of classes, files, methods, variables follows these.
6. **Test setup:** framework, test file location and naming, existing helpers/fixtures/factories/mocks, exact command to run a single test file.

## Design rules (applied in the plan, not left to the implementer)

- **Create** names classes, interfaces, and seam/adapter logic **only when a real boundary needs them** (payment provider, external API). Otherwise keep concrete and thin: few layers, not a flat API that exposes internals. Prefer a real module/class over a fat inline blob when the behaviour has a clear responsibility.
- When a symbol is created, design it **deep**: small stable public surface that hides real complexity. State explicitly what is public, what is private, and what complexity it hides. Never invent extra types "to deepen".
- SOLID, DRY (point at existing code to reuse instead of duplicating), simplest working code.
- Check the planned design against the usual smells and fix it in the plan: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest, Shallow Module.
- Downstream slices that depend on upstream work must **Reuse** the exact symbols (paths + signatures) the earlier issues create.

## Structure

- **Linear / GitHub:** one parent epic + child issues. Plain-text `Blocked by: …` on dependents. Epic body: feature goal, slices in order with blockers, user decisions taken.
- **Markdown:** ordered files under `docs/slices/<feature-slug>/` (prompt may override path) + explicit blockers.

**Titles:** `[Feature] S1: short goal` (epic = feature name).

## Preview then create

Default: show a **condensed** preview only: per slice, title + short architecture peek (reuse/create names); then only the technical decisions you took on gaps the grill left open, and the open product questions if any (see **Who decides what**). Do not restate grill decisions. Wait for OK and answers.

If the user says "create now" / "file it", skip preview and create.

Then create issues and return only URLs or file paths (plus epic link if any).

## Issue body (plain text only)

No schemas, no tables, no diagrams. Code blocks allowed for signatures, types, and non-obvious logic. Every path and symbol is exact. Deterministic: the implementer follows the plan and makes no design choice.

```
Goal
<one sentence>

Done when
<one concrete pass/fail check: user-facing check and/or exact test command>

Context
<why this brick exists, where it sits in the flow, what upstream slices already provide>

Reuse
- `path/to/file.ext` `symbol(signature)`: what this slice uses it for and how it is called

Create
- `path/to/new_file.ext` `SymbolName`: <responsibility in one line>
  - Public: `method(arg: Type): ReturnType`: <behaviour>
  - Private: <helpers it keeps internal>
  - Hides: <complexity callers never see>
  - Depends on: <collaborators and how they are injected/obtained>
  - Called by: <exact caller and call site>

Design
- Mirror: `path/to/similar_existing.ext` (follow its structure, naming, error handling, <anything specific>)
- Logic:
  1. <rule / step of the algorithm, in order>
  2. …
- Edge cases and errors:
  - <input or state>: <exact behaviour: returned value, thrown error type + message, status code>
- Decisions (grill decisions that apply to this slice, then decisions taken while planning):
  - <chosen option> over <rejected option>: <reason>

Tests
- File: `path/to/test_file.ext` (run: `<exact command>`)
- Reuse helpers/fixtures: `<symbol>` from `<path>`
- Cases:
  - `<test name>`: given <setup>, when <action>, then <expected>
  - …

Do
1. Write the failing tests listed in Tests (RED); skip this step only if TDD clearly does not apply
2. <imperative step: file + symbol + exact change>
3. …
N. Run `<exact command>`: all tests pass

Do not
- <slice-specific trap the implementer could fall into: tempting shortcut, wrong layer, existing code that must stay untouched, behaviour that belongs to another slice>
- …

Scope
- One brick: <the single responsibility this slice owns>
- Touch only code implied by Reuse / Create; anything else (extra files, symbols, behaviour): ask first
- Automated tests: the cases listed in Tests (add more only for behaviour of this brick)
```

Generic rules (no design decision outside the issue, ask before any divergence, SOLID/DRY/simplest code, no extra files/symbols, TDD order) are enforced by `implement`: do not repeat them in every ticket. **Do not** lists only what is specific to this slice; omit the section if nothing is.

## Plan review (before filing)

Once full bodies are drafted, spawn **one** reviewer sub-agent. Give it the drafted bodies and the research facts; it reads the referenced files directly (Reuse, Mirror, call sites) to verify them, without re-exploring the codebase broadly. It answers as `slice-review` would on the resulting code, findings only:

- **Standards:** would faithful implementation breach repo docs, SOLID/DRY/simplicity, deep-module direction, or the smells above?
- **Spec:** is anything left for the implementer to decide (missing path, signature, error behaviour, test case, banned vague word)? Do Reuse symbols and signatures exist as written? Do Do steps cover every Create and every test case? Does Done when actually prove Goal?
- **Slicing:** one brick per slice, no catch-all or too-thin smell, blockers correct.

Fix the plan for every finding, then file. Do not file a slice with an open finding.

## Workflow

1. Read input (prompt, sentence, and/or markdown file).
2. Resolve destination and team/repo.
3. Research the codebase (see **Research**); run independent Explore questions in parallel.
4. Split into cohesive logical bricks (check catch-all and too-thin smells); assign S1…Sn and blockers; carry architecture forward.
5. Condensed preview with decisions and open questions (unless create-now; open questions are still asked).
6. On confirmation, write full bodies with every design decision made (see **Design rules**).
7. Plan review; fix findings.
8. Create epic + children (or markdown files).
9. Stop. Report links/paths only.
