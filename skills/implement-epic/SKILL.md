---
name: implement-epic
description: >-
  Orchestrate the full implementation of an epic: extract slices from an epic
  ticket (URL or file), detect dependencies, parallelize independent slices, and
  drive each through a dev→review→fix loop until review passes (or 3 iterations).
  Dev agents use /implement + /caveman; review agents use /slice-review.
  Commits per slice when clean. Fail fast if any slice exceeds 3 iterations.
  Use when the user wants to implement a full epic.
---

# implement-epic

Implement all slices of an epic. Architecture: **master** (this skill) → **dev / review / fix agents** (spawned directly, no intermediate layer).

## Input validation

Argument must be a URL or a file path that can be fetched/read. If the argument is free text with no resolvable pointer, stop immediately:

> Error: cannot resolve epic. Provide a URL or file path.

## State file

Create `/tmp/implement-epic-<sanitized-epic-title>.json` (outside the repo). Update after every status change. This is a crash-recovery file only — not a coordination mechanism.

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
      "files": [],
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

## Master loop

Repeat until all slices are `done` or `failed`:

1. Find all **ready** slices (deps satisfied, status `pending`).
2. Group them: slices sharing files must be **sequenced** (only the first in each overlapping group is ready this round). Slices with disjoint file sets can run **in parallel**.
   - File overlap detection uses the `files` field populated after the first dev run. On the first round, assume no overlaps and run all ready slices in parallel.
3. Mark selected slices `in-progress` in the state file.
4. Spawn one **dev agent** per selected slice, all in background simultaneously (one Agent call per slice, all in a single response).
5. Wait for all dev notifications. For each:
   - Record `files` from the `FILES:` marker in the state file.
   - Spawn a **review agent** for that slice in background (passing the files list).
6. Wait for all review notifications. For each:
   - If `CLEAN: true` → commit the slice, mark `done`.
   - If `CLEAN: false` → increment `iterations`. If `iterations >= 3` → **fail fast**: stop the entire epic, report findings, exit.
   - Otherwise → spawn a **fix agent** for that slice in background (passing filtered findings).
7. Wait for all fix notifications. For each, spawn a new **review agent** (step 5 review logic).
8. Update state file. Go to step 1.

## Agent prompts

### Dev agent

Spawn as background Agent. Prompt:

---
Activate /caveman, then run /implement on slice [source]. Do not commit.

When done, output exactly:
FILES: [comma-separated list of files you created or modified]
---

### Review agent

Spawn as background Agent. Prompt:

---
Run /slice-review on the current WIP (uncommitted changes) for slice [source].
Scope your review strictly to these files: [files list from dev agent].
Do not flag issues in other files. Review in WIP mode (no fixed point).

When done, output exactly:
CLEAN: true
or
CLEAN: false
FINDINGS:
Hard: [list of hard findings with file:line and detail]
Judgment: [list of judgment findings with file:line and detail — only include if they clearly improve optimization, clarity, or maintainability]
---

### Fix agent

Spawn as background Agent. Prompt:

---
Activate /caveman. Fix the following findings on slice [source]. Do not commit.

[filtered finding list — Hard findings always included; Judgment findings only if explicitly noted as improving optimization, clarity, or maintainability]

When done, output exactly:
FILES: [comma-separated list of files you modified]
---

## Fail fast

If any slice reaches 3 iterations without a clean review:

1. Stop the master loop immediately.
2. Do not commit any in-progress work.
3. Report:

```
FAILED: slice [id] — [title]
Reason: did not converge after 3 iterations.
Remaining findings after iteration 3:
[full finding list with file:line and detail]

implement-epic stopped. No further slices will be processed.
Completed before failure:
✓ slice-1 — title (2 iter)
✓ slice-2 — title (1 iter)
```

## Commit

When a slice passes review, commit only its files:

```
git add <files from FILES: marker>
git commit -m "feat([id]): [title]"
```

## Final output

If all slices complete successfully:

```
implement-epic complete. [N] slices done.

✓ slice-1 — title (1 iter)
✓ slice-2 — title (2 iter)
```
