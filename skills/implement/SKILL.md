---
name: implement
description: >-
  Implement one slice ticket produced by to-issues (Linear, GitHub Issues, or
  docs/slices/ markdown) by following its pre-decided design literally, TDD
  first, asking before any divergence from the plan. Use when the user asks to
  implement, do, or build a slice/issue/ticket from that pipeline.
---

# implement

Execute a `to-issues` ticket. The ticket already holds every design decision; your job is faithful execution, not design.

## User-facing output

Be concise with the user. Smallest understandable chat output. No length limit on code or tests written.

### Final report

The user reads the diff in their own tool. Do **not** list files touched, tests added, or a recap of the ticket.

Report only, in this order, skipping empty sections:

1. **Deviations**: what failed, was blocked, or diverged from the issue (Done when failing, blocker override, ticket typo fix, divergence approved by the user). One short line each.
2. **To decide**: only when a problem needs the user's call: context, options, your recommendation.
3. **How it works**: concise walkthrough of the added code following the execution flow, naming the real symbols, so the user knows in which order to read and how to review/test it. Example shape: "`XxxValidator` injected into `YyyController`. `YyyController.store` calls it to validate the request, then passes the data to `ZzzService.create` to persist and dispatch `ZzzCreated`." A few lines; no code dumps.
4. **Manual QA**: only when the slice is testable by the user (UI, endpoint, CLI): short numbered steps (where to go, what to do, what to expect). Include any Done when check you could not run yourself.

## Load the issue

1. Prefer an explicit Linear id/URL, GitHub `#n`/URL, or markdown path.
2. If exactly one clear pointer is in the message or focused file, use it.
3. Otherwise ask once; never pick among multiple slices silently.

Read the full issue body before coding.

**How many slices:** follow the user's instructions. If none: implement **one** slice, then stop. Chain only if they say "do all" / "next until done".

**Blockers:** if the issue has `Blocked by: …` and that work is not done, **refuse**. Proceed only if the user says "ignore blockers" / "do it anyway".

## Read the code

The issue gives exact paths and signatures, so read directly: the Reuse files, the Mirror file, the test helpers listed under Tests, and the call sites named in Create. Read only the parts you need.

Spawn an **Explore** sub-agent only for a question the issue does not answer and that needs a broad search. Give it a focused, self-contained question and ask for facts only (paths, signatures, key behaviour), no prose. If such a question exists, the plan is probably incomplete: see **Fidelity**.

## Fidelity

1. **Implement exactly** Goal / Context / Reuse / Create / Design / Tests / Do / Do not / Scope. The design is final: paths, signatures, public/private split, Mirror pattern, Logic, edge-case behaviour, Decisions, test cases. Do not redesign, rename, or pick an alternative you prefer. Copy the Mirror file's structure and conventions.
2. **Any divergence from the plan: ask first.** If the plan cannot be followed exactly, or following it would be wrong (a Reuse symbol or signature does not exist as written, the Mirror file contradicts the plan, a Logic rule conflicts with the real code, a test case cannot pass as specified, a decision is missing, extra files/symbols/behaviour are needed), stop **before** writing the divergent code and ask: what the issue says, what the code shows, options, your recommendation. Never diverge silently, even when the fix looks obvious. Resume only with the user's answer.
3. Only exception: a pure typo in the issue (a path or symbol misspelled that unambiguously matches exactly one existing file or symbol). Fix it and list it under Deviations.

Everything the plan leaves to code-level craft (local variable names, statement order inside a method) follows the Mirror file and repo conventions, with SOLID, DRY, and simplest working code. Never inline or squash a Create module into another file. Deepen modules only within listed symbols; never invent types, files, or seams.

Legacy tickets with a `Touch limit` section: apply its single-concern / one-test rules, ignore the file count.

## TDD

Default: **RED, then GREEN**.

1. **RED**: write every test case listed under Tests. Run them; confirm they fail for the right reason.
2. **GREEN**: implement the minimal production code (only listed Reuse/Create) until they pass, following the Do steps in order.

More tests are allowed for behaviour of this brick; never fewer than listed. Do not test code outside Reuse / Create.

Skip TDD only when it clearly does not apply (no runnable harness for this slice, pure wiring/docs, or Do says so). Never write production code first then a trailing test when TDD is viable.

## Git and tickets

**Do not** create a branch, commit, open a PR, or change ticket status unless the user explicitly asks.

## Verification

1. Run the Done when command/check, else the slice's tests. Must pass before stopping successfully.
2. A Done when check you cannot run (user-facing): put it under Manual QA.

Stuck in a fix loop: **stop and ask**. Do not thrash.

## Self-check (before reporting)

Re-read the issue, then your diff (`git diff HEAD` + untracked slice files). Fix any gap before reporting:

- **Plan coverage:** every Do step, Create symbol (with its Public signature and Called by site), Logic rule, edge-case behaviour, Decision, and listed test case is in the diff. Done when actually proves Goal.
- **Nothing extra:** no file, symbol, public method, behaviour, refactor, or cleanup the issue does not list.
- **Craft in unplanned details:** no duplication, no dead code, no speculative generality, conventions of the Mirror file respected.

Then re-run verification once. Still failing or unsure: **stop and ask** (no loop).
