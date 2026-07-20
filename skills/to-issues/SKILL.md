---
name: to-issues
description: >-
  Turn a prompt, sentence, or markdown plan into thin vertical-slice tickets
  (Linear, GitHub Issues, or markdown files). Each issue is a deterministic
  implement-only plan with architecture (reuse/create), SOLID/DRY/simplicity,
  prefer-deeper-modules guidance, TDD-friendly Do steps (RED → GREEN), and hard
  size caps. Use when the user asks to create issues, tickets, or slices from a
  plan/spec — including right after a grill session.
---

# to-issues

Create tickets only. Do not implement.

## User-facing output

Be concise with the user. Smallest understandable chat output.

No length limit on issue bodies, filed tickets, or code written into those tickets.

## Destination

1. If the user names Linear, GitHub, or Markdown — use that.
2. Else prefer the tracker the repo already uses.
3. If unclear: Linear → GitHub → Markdown.

**Linear team / GitHub repo:** prompt override → current GitHub repo / sole Linear team → ask once if multiple Linear teams.

**Labels (Linear/GitHub):** parent `epic`, children `slice`, plus any labels from the prompt. Markdown: no labels.

## Slices

Extract **testable vertical slices**: one demoable end-to-end outcome each, **as thin as possible**.

Before filing a slice, it must pass:

- Single concern (no unrelated refactors)
- ≤ 6 files touched (excluding the one test) — soft cap for thinness, not a reason to squash modules
- ≤ 2 new public symbols
- Exactly 1 focused test (or one small test file for that slice)
- Do steps ordered for **TDD when possible**: failing test first (RED), then minimal implementation (GREEN)

Split further if any cap would break. If a listed **Create** needs its own file (class/module), count that file in the plan — never design a slice that forces inlining to stay under the cap.

## Architecture source

1. Use architecture already in the grill context / provided file / prompt.
2. If incomplete, search the codebase to fill gaps.
3. Never invent fake “existing” symbols.

**Create** must name classes, interfaces, and seam/adapter logic **only when a real boundary needs them** (e.g. payment provider). Otherwise keep concrete and thin: few layers — not a flat API that exposes internals. Prefer a real module/class over a fat inline blob when the behaviour has a clear responsibility; do not skip a Create file just to stay under the touch budget.

When a symbol *is* created, prefer a **deeper** module: small stable public surface that hides real complexity. Never invent extra types “to deepen.”

Downstream slices that depend on upstream work must **Reuse** symbols the earlier issues create.

## Structure

- **Linear / GitHub:** one parent epic + child issues. Plain-text `Blocked by: …` on dependents.
- **Markdown:** ordered files under `docs/slices/<feature-slug>/` (prompt may override path) + explicit blockers.

**Titles:** `[Feature] S1 — short goal` (epic = feature name).

## Preview then create

Default: show a **condensed** preview only — per slice: title + short architecture peek (reuse/create names). Wait for OK.

If the user says “create now” / “file it”, skip preview and create.

Then create issues and return only URLs or file paths (plus epic link if any).

## Issue body (plain text only)

No schemas, no tables, no diagrams. Deterministic: the implementer follows the plan.

```
Goal
<one sentence>

Done when
<one concrete pass/fail check>

Reuse
- <existing symbol or file>
- …

Create
- <new class/function/method>: <one-line purpose>
- <interface/seam/adapter only if needed>: <one-line purpose>

Do
1. Write the focused failing test for Done when (RED) — skip this step only if TDD clearly does not apply
2. …
3. …

Do not
- Violate SOLID or DRY
- Add abstractions, files, or refactors not listed above
- Make the code more complex than required — simplest working code is mandatory
- Prefer deeper modules (narrow interface, hide complexity) when it does not add complexity or abstractions beyond this plan — simplest working code still wins
- Inline or squash a listed Create into another file just to stay under the file cap — if Create needs a module/class file, create that file (ask before exceeding Touch limit)
- Implement production code before the failing focused test when TDD applies (must be RED → GREEN)
- Exceed the touch limits for this slice without asking

Touch limit
- ≤6 files (excl. test), ≤2 new public symbols, 1 focused test, single concern
- File count is a thinness guide: maintainable Create modules beat minimizing files
```

Put the same Do not / Touch limit spirit into every issue so implementers cannot freestyle.

## Workflow

1. Read input (prompt, sentence, and/or markdown file).
2. Resolve destination and team/repo.
3. Split into thin slices; assign S1…Sn and blockers; carry architecture forward.
4. Condensed preview (unless create-now).
5. On confirmation, write full bodies and create epic + children (or markdown files).
6. Stop. Report links/paths only.
