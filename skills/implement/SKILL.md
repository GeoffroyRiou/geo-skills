---
name: implement
description: >-
  Implement a single vertical-slice ticket produced by to-issues (Linear, GitHub
  Issues, or markdown under docs/slices/). Follow the issue body literally:
  Reuse/Create/Do/Do not/Touch limit, prefer TDD (RED → GREEN) when possible,
  run Done when verification, keep code simplest possible under SOLID and DRY,
  preferring deeper modules within listed symbols. Use when the user asks to
  implement, do, or build a slice/issue/ticket from that pipeline.
---

# implement

Implement code from a `to-issues` ticket. Do not freestyle architecture.

## User-facing output

Be concise with the user. Smallest understandable chat output.

No length limit on code or tests written.

When done: report Done when pass/fail + files touched. Add a short note only if something unusual happened (blocker override, tiny typo/path fix, stopped to ask).

## Load the issue

1. Prefer an explicit Linear id/URL, GitHub `#n`/URL, or markdown path.
2. If exactly one clear pointer is in the message or focused file, use it.
3. Otherwise ask once — do not pick among multiple slices silently.

Read the full issue body before coding.

## Scope

Follow the user’s instructions for how many slices to do.

If none: implement **one** slice, then stop. Chain only if they say “do all” / “next until done”.

## Blockers

If the issue has `Blocked by: …` and that work is not done: **refuse**.

Proceed only if the user says “ignore blockers” / “do it anyway”.

## Fidelity

1. **First rule:** implement exactly Goal / Reuse / Create / Do / Do not / Touch limit.
2. Tiny obvious fixes only (typos, wrong paths that clearly match existing files) — no redesign.
3. Anything else unclear or impossible: stop and ask once.

Respect SOLID, DRY, and simplest-possible code as stated in Do not.

Prefer **deeper** modules when possible: small stable interface that hides complexity; avoid shallow APIs (callers knowing internals for little payoff). Deepen only **within listed Reuse/Create symbols** — never invent types, files, or seams to deepen. If the ticket already prescribes the API, follow it. When deep vs simple conflict, **simplest working code wins**.

## Touch limit

Never exceed the issue’s Touch limit without asking first.

If the plan cannot be done within caps: stop and ask (do not quietly expand the slice).

**Never trade maintainability for the file count.** If Create names a class/module that belongs in its own file, create that file. Do **not** inline or squash it into another file just to stay under the cap — ask instead. Simplest working code still wins, but “fewest files” is not the same as “simplest.”

## TDD (prefer when possible)

Default flow for the slice’s focused test: **RED → GREEN**.

1. **RED** — write (or extend) the focused failing test that encodes Done when / Goal. Run it; confirm it fails for the right reason.
2. **GREEN** — implement the minimal production code (only listed Reuse/Create) until that test passes.

Skip TDD only when it clearly does not apply (no runnable test harness for this slice, pure wiring/docs, or the issue’s Do already forbids it). Do not write production code first then a trailing test when TDD is viable.

Do not expand into extra tests beyond the issue’s one focused test.

## Git and tickets

Default: write code + tests and run verification only.

**Do not** create a branch, commit, open a PR, or change ticket status unless the user explicitly asks.

## Verification

1. If Done when names a command or check — run that.
2. Else run the issue’s focused test(s).
3. Must pass before stopping successfully.

If stuck in a fix loop and cannot resolve: **stop and ask**. Do not thrash.

## Pre-review self-check

After verification passes, audit the diff against the issue **before** reporting done. Same bar as `slice-review` — fix what you find; do not hand off known gaps.

Surface: `git diff HEAD`, `git diff --cached`, and untracked files for this slice.

### Spec (issue fidelity)

Confirm each; fix or remove drift:

- **Goal** — diff delivers the one-sentence outcome.
- **Do** — every numbered step done; none skipped; no extra steps.
- **Reuse** — existing code touched only via listed Reuse symbols/files.
- **Create** — new code only via listed Create symbols; purposes match the issue lines; Create modules/classes live in their own files when that is the natural boundary (no inlining to dodge the file cap).
- **Do not** — no forbidden abstractions, files, refactors, or scope; simplest working code; deep-module line respected (deepen only within listed symbols); no file-cap dodging via inline squash.
- **Done when** — the check actually proves Goal, not just incidental green.
- **TDD** — when applicable, focused test existed and failed before production code made it pass (RED → GREEN); no production-first then trailing test.
- **No scope creep** — no behaviour, routes, views, or cleanups the issue did not ask for.
- **Prescribed API** — if Create or Do names methods/signatures/responsibilities, match them (e.g. controller must not do work assigned to a Create symbol).

### Standards (pipeline bar)

Quick pass on the diff; fix **hard** issues before stopping:

- SOLID, DRY, simplest working code.
- No speculative generality — nothing invented outside Reuse/Create.
- Within listed symbols: prefer narrow public surface over callers knowing internals.
- Obvious smells in **new** code: duplicated logic, feature envy across the slice boundary, long message chains, middle-man pass-through — fix when cheap and inside the slice.

**Judgement calls** (Shallow Module, naming nits): fix if trivial; otherwise leave — do not thrash.

### If self-check fails

1. Fix in place.
2. Re-run verification.
3. Re-run self-check once.
4. Still blocked → **stop and ask** (do not loop).

## Workflow

1. Load issue; check blockers.
2. Prefer TDD: RED (failing focused test) → GREEN (minimal implementation via listed Reuse/Create). Follow Do steps in that order when they allow it.
3. Stay inside Touch limit and Do not.
4. Run verification (test must have been red first when TDD applied).
5. Pre-review self-check; fix findings.
6. Minimal report to the user. Stop (or continue only if chaining was requested).
