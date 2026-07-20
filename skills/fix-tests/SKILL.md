---
name: fix-tests
description: >-
  Fix failing tests by looping through them one by one, diagnosing each failure
  against recent code changes, and applying minimal corrections without
  regressions. Discovers the repo's test runners and conventions first. Use when
  the user says "fix tests", "fix failing tests", "make tests pass", has broken
  tests after a refactor, or wants to green the test suite.
---

# fix-tests

Green the test suite with minimal, justified fixes. Do not freestyle product scope.

## User-facing output

Be concise with the user. Smallest understandable chat output.

No length limit on diagnosis notes written into `.test-progress` comments or code/test edits.

When done: report pass count + files fixed. Add a short note only if something unusual happened (infra blocker, ambiguous code-vs-test choice, stopped to ask).

## Philosophy

**Tests are the specification.** A failing test signals either a code regression or a test that no longer matches a deliberate change. Determine which before touching anything.

Priority:

1. Code bug → fix the code
2. Deliberate change made the test stale → update the test to the new correct behavior
3. Never twist assertions to force a pass — if intent is unclear, stop and ask

## Scope and pipeline

Standalone by default: green whatever the user scoped (full suite, one runner, one directory, one file).

If the failures come from a `to-issues` / `implement` slice:

- Stay inside that issue’s Goal / Reuse / Create / Do / Do not / Touch limit
- Prefer fixing production code listed in the plan over rewriting the focused test
- Do not expand into extra tests, refactors, or files the slice did not ask for
- If a correct fix needs more than the Touch limit, stop and ask

## Discover runners and conventions

Before initializing `.test-progress`, learn how **this** repo runs and writes tests. Do not assume a stack.

### 1. Find how tests are run

Check in order (stop when enough to run scoped tests):

1. User message (explicit command or scope)
2. Project docs: `README`, `CONTRIBUTING`, `AGENTS.md`, `.cursor/rules`, `docs/**` mentioning tests
3. Package scripts: `package.json`, `Makefile`, `justfile`, `Taskfile`, `composer.json` scripts
4. Config presence: `vitest.config.*`, `jest.config.*`, `playwright.config.*`, `phpunit.xml*`, `Pest.php`, `pytest.ini`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.

Record for each runner you will use: **command**, **file glob**, **how to run one file / one name**.

### 2. Repo test conventions

Skim the same docs plus neighbouring tests for:

- Where tests live and how they are named
- Required setup (auth helpers, factories, fixtures, DB traits, browser context)
- Preferred selectors / assertion style
- Anything marked “do not” for tests (no live network, sandbox rules, etc.)

Follow those conventions when updating tests. Prefer patterns already used in sibling files over inventing new ones.

### 3. Browser / GUI / sandbox runners

If a runner needs a real browser, display server, Docker socket, or similar:

- Prefer the Shell permission level the environment requires (often unrestricted / `all`) so sandbox denials are not mistaken for test failures
- Distinguish **infrastructure** errors (launch/connect/permission) from **assertion** failures — see [REFERENCE.md](REFERENCE.md)
- If infra still fails after the right permissions: stop, ask the user to run the command locally, wait for pasted output

### 4. Scope from the user

If the user scopes (e.g. “Vitest only”, “tests/Feature/Client”), only put matching files in `.test-progress`.

## Workflow

### Checkpoint file

Use `.test-progress` (gitignored if the repo ignores it; do not commit it) to track progress:

```
# One test file (or smallest runnable unit) per line.
# Optional tags from discovery, e.g. [unit], [browser], [e2e]
PASS [unit] path/to/a.test.ts
FAIL path/to/b_test.py
PENDING [browser] path/to/c.spec.ts
```

### 1. Initialize

On first run, build `.test-progress` from discovered globs (sorted). Tag files when a runner needs different permissions or commands.

If `.test-progress` already exists, resume from the first non-PASS line.

### 2. The loop

Progress **one file at a time**, or **one directory at a time**. **Never run the entire suite during the loop.**

For each PENDING/FAIL entry, run the discovered single-file (or single-dir) command.

- Pass → mark PASS, continue
- Fail → mark FAIL, diagnose (step 3)
- Infra error on a browser/GUI runner → ask user to run manually; do not “fix” the test for that

### 3. Diagnose and fix

1. Read the error (name, assertion, expected vs actual, trace)
2. Read the test — what behavior it asserts
3. Read the code under test — execution path
4. Check recent changes — `git diff` / `git log` on relevant paths
5. Classify: code bug → minimal code fix; deliberate stale test → update test; unclear → ask

After a fix, re-run **only** the current file (same runner). Max **3** attempts, then report and skip/ask.

Details and patterns: [REFERENCE.md](REFERENCE.md).

### 4. Parallelization with sub-agents

Optional speed-up. Never launch every directory at once.

1. **Detect** — one directory (or small batch) at a time; collect failures
2. **Fix** — parallel sub-agents only when failures touch **non-overlapping** source areas

Rules:

- Overlapping source files → sequential
- Each sub-agent gets: test path, runner command, error output, relevant sources, recent diff, and: prefer code fix; if ambiguous report back; **do not** write `.test-progress`
- Only the main agent updates `.test-progress` after verifying

### 5. Done

When every line is PASS, delete `.test-progress`.

Final verification once (full scoped suite — the only time bare full-runner commands are allowed for this skill):

- Run each discovered runner the user cared about, with no file filter (or the user’s original scope if narrower)

## Git and tickets

Default: write code + test fixes and run verification only.

**Do not** create a branch, commit, open a PR, or change ticket status unless the user explicitly asks.

## Hard rules

- **Never delete a test** to make the suite green
- **Never weaken an assertion** without clear justification
- **Never mock away the failure** when the test was checking real behavior
- **One fix per iteration** — verify after each
- **Stuck after 3 attempts** on the same test → stop and report
- **When in doubt, ask** (code vs test? which behavior is correct?)
- **Use discovered runners** — pick the command/tag from `.test-progress`, not a guessed stack
- **Never run the entire suite during the loop** — file or directory only; full suite only in step 5
- **Respect repo conventions** discovered above when editing tests
- **Respect slice limits** when failures come from `implement` / `to-issues` work
