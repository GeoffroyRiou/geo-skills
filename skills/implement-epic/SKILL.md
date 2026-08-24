---
name: implement-epic
description: >-
  Orchestrate the full implementation of an epic: extract slices from an epic
  ticket (URL or file), detect dependencies, parallelize independent slices, and
  drive each through a dev→review→fix loop until review passes (or 3 iterations).
  Dev agents use /implement + /caveman; review agents use /slice-review.
  Commits per slice when clean. Use when the user wants to implement a full epic.
---

# implement-epic

Implement all slices of an epic. Architecture: **master** (this skill) → **sub-master** (one per slice) → **dev + reviewer**.

## Input validation

Argument must be a URL or a file path that can be fetched/read. If the argument is free text with no resolvable pointer, stop immediately:

> Error: cannot resolve epic. Provide a URL or file path.

## State file

Create `/tmp/implement-epic-<sanitized-epic-title>.json` (outside the repo). Update after every status change.

```json
{
  "epic": "<title>",
  "source": "<url-or-path>",
  "slices": [
    {
      "id": "<slice-id>",
      "title": "<slice-title>",
      "source": "<url-or-path>",
      "blockedBy": ["<slice-id>"],
      "status": "pending|in-progress|done|failed",
      "iterations": 0,
      "failReason": null
    }
  ]
}
```

## Load the epic

Fetch or read the epic at the provided URL/path. Extract:

- Epic title (used for state file name)
- Ordered list of sub-tickets/slices with: id, title, source pointer, explicit blockers

If the source yields no parseable slice list, stop:

> Error: could not extract slices from epic. Check the source format.

## Detect dependencies

For each slice, in order:

1. **Explicit blockers first** — use the `Blocked by` / `blocks` / dependency field from the ticket if present.
2. **Content inference** — if no explicit field, scan slice titles and descriptions for clear cross-references ("uses function created in slice X", "requires X to be completed"). Mark inferred dependencies conservatively.

Build a DAG. Slices with all dependencies satisfied are **ready**.

## Detect file zone overlaps

Inspect the `Create` / `Touch` / file fields of each ready slice. Slices that share files must be **sequenced** (later one waits for earlier commit). Slices with disjoint file sets can run **in parallel**.

Skip this step if file information is unavailable in slice bodies — fall back to dependency ordering only.

## Master loop

Repeat until all slices are `done` or `failed`:

1. Find all **ready** slices (deps satisfied, status `pending`).
2. Split ready slices into parallel-safe groups (no shared files) and sequenced groups.
3. Mark them `in-progress` in the state file.
4. Spawn sub-master agents for all parallel-safe ready slices **simultaneously** (one Agent call per slice, all in a single response).
5. When each sub-master returns, update state (`done` or `failed`), then go to step 1 to unlock newly ready slices.

## Sub-master agent

When launching a sub-master for a slice, pass this prompt:

---
You are the sub-master for slice **[id]: [title]**.

Slice source: [source]

Run the dev→review cycle up to **3 times**. Keep a running list of findings to fix across iterations.

**Each iteration:**

1. **Dev** — spawn a sub-agent with this instruction:
   > Activate /caveman, then run /implement on slice [source]. Do not commit.

2. **Review** — once the dev agent completes, spawn a separate sub-agent:
   > Run /slice-review on the current WIP (uncommitted changes) for slice [source]. Review in WIP mode (no fixed point). Return findings split as: **Hard:** [...] / **Judgment:** [...].

3. **Filter findings:**
   - **Hard** → always fix.
   - **Judgment** → fix only if the reviewer explicitly notes it improves optimization, clarity, or maintainability.
   - No actionable findings remaining → cycle complete. Commit and report done (see below).

4. **If actionable findings remain**, pass them to a new dev sub-agent:
   > Activate /caveman. Fix these findings on slice [source]: [filtered finding list]. Do not commit.
   Then go to step 2.

**If 3 iterations pass without a clean review:**

Stop. Do not commit. Report:
```
FAILED: slice [id] — [title]
Reason: did not converge after 3 iterations.
Remaining findings after iteration 3:
[full finding list with file/line and detail]
```

**On success (clean review or no actionable findings):**

Commit all changes for this slice:
```
git add <files touched by this slice>
git commit -m "feat([id]): [title]"
```

Report: `DONE: slice [id] — [title]. [N] iteration(s). Files: [list].`

---

## Final output

After all slices complete, print a succinct summary:

```
implement-epic: [N] done, [M] failed.

✓ slice-1 — title (2 iter)
✓ slice-2 — title (1 iter)
✗ slice-3 — title
  Stopped at iteration 3. Remaining findings:
  - [Hard] src/foo.ts:42 — missing null check (risk: runtime crash on empty input)
  - [Judgment] src/bar.ts:18 — shallow module (callers know internal state)
```

If all succeeded: single line is enough.

```
implement-epic complete. [N] slices done.
```
