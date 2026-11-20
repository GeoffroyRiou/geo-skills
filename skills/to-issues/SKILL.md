---
name: to-issues
description: >-
  Turn a validated ARCHITECTURE.md (produced by to-architecture) into
  vertical-slice tickets (Linear, GitHub Issues, or markdown) that lock the
  architecture and technical decisions, so a smaller model implements them
  without drifting. Use when the user asks to create issues, tickets, or
  slices, typically with the path printed by to-architecture.
---

# to-issues

Create tickets only. Do not implement, do not design.

You are the **coordinator**: you file the epic, then parallel writer sub-agents write and file one ticket each, following [WRITER.md](WRITER.md).

## Input

The path to an `ARCHITECTURE.md` produced and validated by `to-architecture`. Its annex holds everything: grill decisions, slice plan, module interfaces, shared research facts. If no such file is given, stop and tell the user to run `/to-architecture` first.

## Core principle

Tickets are executed by a **less capable implementer agent** (e.g. Sonnet). A ticket locks the architecture and the technical decisions (paths, contracts, layers, rules, rejected options, test cases) and does not describe the code inside modules: the implementer writes it, and asks before any divergence from what is locked. The user does not read tickets beyond their Summary. An architecture or decision breach on a faithfully implemented ticket is a planning bug.

The architecture is settled: never re-decide, re-slice, or re-research it, and do not explore the codebase yourself. Writers research only their own slice.

## Token economy

- Give sub-agents paths, never pasted content.
- An agent's cost is its number of turns times its context size. Writers verify in a few batched reads, never one grep per turn (see `WRITER.md`).
- Drafts live in `/tmp/geo-skills/<feature-slug>/`, next to `ARCHITECTURE.md`. Each ticket is published once from its draft, never created then re-read and updated.
- Chat output: links only.

## Destination

1. If the user names Linear, GitHub, or Markdown, use that.
2. Else prefer the tracker the repo already uses.
3. If unclear: Linear, then GitHub, then Markdown.

**Linear team / GitHub repo:** prompt override, else current GitHub repo / sole Linear team, else ask once if multiple Linear teams.

**Labels (Linear/GitHub):** parent `epic`, children `slice`, plus any labels from the prompt. Markdown: no labels.

**Structure:** Linear / GitHub: one parent epic + child issues, plain-text `Blocked by: <exact upstream titles>` on dependents. Markdown: ordered files `S<n>-<slug>.md` under `docs/slices/<feature-slug>/` (prompt may override path), blockers stated in each file, no epic file.

**Titles:** `[Feature] S<n>: <slice title>` (epic = feature name).

**Epic body:** the summary paragraph of `ARCHITECTURE.md` (in plain language), then the slices in order with their blockers. No architecture, no decisions: they live in the tickets.

## Workflow

1. Read `ARCHITECTURE.md` once. Resolve destination and team/repo.
2. Create the epic (Linear/GitHub) to get its id; Markdown: create the folder.
3. Spawn **one writer sub-agent per slice, all in one message** (general-purpose, `model: "sonnet"`: the design is locked, writers transcribe and verify it). Give each only:
   - the absolute path of `WRITER.md` (next to this file) and of `ARCHITECTURE.md`;
   - its slice id;
   - the destination: tracker, team/repo, epic id, labels, exact title, Blocked by line, and for Markdown the final file path;
   - its draft path: `/tmp/geo-skills/<feature-slug>/S<n>.md`.

   With a single slice, follow `WRITER.md` yourself instead.
4. **Cross-slice check**, from the writers' returns only (never re-read the tickets):
   - `CONTRACT` and `REUSES_UPSTREAM` match the annex; every downstream Reuse matches an upstream Create exactly.
   - `CONTRACT_ISSUE`: the architecture is wrong on that point. Stop and tell the user in 2 or 3 lines what is wrong and the fix you propose. After approval: targeted edit of `ARCHITECTURE.md`, re-spawn that writer, and for each already-filed ticket referencing the changed symbol, a writer that makes a targeted edit to its draft and republishes it (continue the original writer if possible: it keeps its context).
   - `UNVERIFIED`: check each listed symbol with one targeted `codegraph_explore` (your only code reading). Wrong: handle it as a `CONTRACT_ISSUE`.
   - Any other mismatch: same targeted draft edit and republish for the affected ticket.
5. GitHub only: one edit of the epic body to turn slice titles into issue links (Linear lists sub-issues natively).
6. Stop. Report only the URLs or file paths (epic first).
