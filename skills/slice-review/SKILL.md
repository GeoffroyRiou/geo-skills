---
name: slice-review
description: >-
  Two-axis review of changes from a to-issues / implement slice: Standards
  (repo docs, SOLID/DRY/simplicity, prefer-deeper-modules, Fowler smell baseline)
  and Spec (literal fidelity to the slice ticket: Goal, Reuse, Create, Do, Do
  not, Done when). Runs both axes in parallel sub-agents. Use when reviewing a
  slice, vertical-slice PR/WIP, or work produced by implement / to-issues.
---

# slice-review

Two-axis review of the diff for a **vertical-slice** ticket from `to-issues` / `implement`:

- **Standards** — repo coding docs + SOLID/DRY/simplest-possible + prefer-deeper-modules + smell baseline
- **Spec** — does the diff match the slice issue body literally?

Both axes run as **parallel sub-agents**, then this skill aggregates.

## User-facing output

Be concise with the user. Smallest understandable chat output.

Sub-agent briefs stay short; final report stays under two tight sections + one summary line.

**Hard findings** get one short block each (not a one-liner): what broke, where (file/hunk or issue line), and **why it matters** (risk, maintenance, or slice integrity). Judgement calls stay one line.

Do **not** report Touch-limit / file-count breaches — they pollute the report. Ignore that section of the issue for review purposes.

## Process

### 1. Pin the diff

`implement` often leaves work **uncommitted**. Resolve the diff like this:

1. If the user names a fixed point (SHA, branch, tag, `main`, …) → `git diff <fixed-point>...HEAD` and `git log <fixed-point>..HEAD --oneline`. Confirm `git rev-parse` and a non-empty diff.
2. If no fixed point and there is a dirty worktree/index → review **uncommitted** changes: `git diff HEAD` and `git diff --cached` (and note untracked files that belong to the slice).
3. If neither → ask once for a fixed point or confirm WIP review.

Fail here on a bad ref or empty review surface — not inside sub-agents.

### 2. Load the slice spec

Same rules as `implement`:

1. Explicit Linear id/URL, GitHub `#n`/URL, or `docs/slices/...` path (or prompt override path).
2. Exactly one clear pointer in the message or focused file → use it.
3. Else ask once.

Fetch the full issue body. The spec **is** that body (Goal / Done when / Reuse / Create / Do / Do not). Do not use `docs/agents/issue-tracker.md` or generic PRDs unless the user points at them as the slice source.

If no slice issue is available and the user says there isn’t one, skip the Spec sub-agent and report “no slice spec”.

### 3. Standards sources

Collect repo docs that define how to write code (`CODING_STANDARDS.md`, `CONTRIBUTING.md`, etc.).

Always also apply:

- **Pipeline rules:** SOLID, DRY, simplest working code, prefer deeper modules when possible (narrow interface, hide complexity — without inventing abstractions beyond the plan), no extra abstractions/files/refactors beyond the slice plan. When deep vs simple conflict, simplest wins.
- **Smell baseline** (below). Repo docs override the baseline when they conflict. Smells are judgement calls; documented-standard breaches can be hard. Skip anything tooling already enforces. **Shallow Module** is a judgement call unless it clearly violates a ticket `Do not` or a documented repo rule.

Smell baseline (*Refactoring*, Fowler ch.3 + deep-module direction) — *what it is* → *how to fix*:

- **Mysterious Name** — name doesn’t reveal role → rename; if no honest name, design is murky.
- **Duplicated Code** — same logic shape in more than one hunk/file → extract shared shape.
- **Feature Envy** — method uses another object’s data more than its own → move it.
- **Data Clumps** — same fields/params travel together → one type.
- **Primitive Obsession** — primitive standing in for a domain concept → small type.
- **Repeated Switches** — same cascade on the same type → polymorphism or one shared map.
- **Shotgun Surgery** — one change scatters across many files → gather into one module.
- **Divergent Change** — one module edited for unrelated reasons → split.
- **Speculative Generality** — abstraction the slice didn’t ask for → delete/inline.
- **Message Chains** — long `a.b().c().d()` → hide behind one method.
- **Middle Man** — mostly delegates → call the real target.
- **Refused Bequest** — ignores most of inheritance → composition instead.
- **Shallow Module** — wide interface / callers know internals for little payoff → hide behind fewer public methods (no new abstraction outside the plan).

### 4. Spawn both sub-agents in parallel

One message, two `Task` / general-purpose sub-agents.

**Standards sub-agent** — give:

- Diff command(s), commit list if any, untracked slice files if WIP
- Paths of standards docs found + **pipeline rules** + **full smell baseline** pasted
- Brief: "Report per file/hunk: (a) documented-standard violations (cite file + rule); (b) SOLID/DRY/simplicity breaches; (c) prefer-deeper-modules misses (Shallow Module = judgement unless Do not / repo rule breached); (d) baseline smells (name + quote hunk). Hard vs judgement call. Skip tooling-enforced items and Touch-limit/file-count. For each hard finding: what, where, why it matters (1–2 sentences). Under 350 words."

**Spec sub-agent** — give:

- Diff command(s) / WIP surface
- Full slice issue body
- Brief: "Report: (a) Goal / Done when / Do steps missing or partial; (b) symbols/files not in Reuse or Create (freestyle); (c) Do not violations; (d) behaviour not asked for (scope creep); (e) listed Create/Reuse used wrongly. Quote the issue line for each finding. Skip Touch-limit/file-count entirely. For each hard finding: what, issue line, why it matters for slice integrity (1–2 sentences). Under 350 words."

Skip Spec sub-agent if no slice spec.

### 5. Aggregate

Present under `## Standards` and `## Spec` only — verbatim or lightly cleaned. Do **not** merge or rerank across axes.

When rewriting hard findings for the user, keep the **why it matters** sentence — do not collapse them to titles alone.

One-line summary: findings count per axis + worst issue **within each** axis. No cross-axis winner.

## Why two axes

- Follows every standard but drifts from the slice plan → Standards pass, Spec fail.
- Matches the issue but breaks conventions / SOLID-DRY-simplicity / deep-module direction → Spec pass, Standards fail.
