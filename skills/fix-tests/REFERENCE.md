# fix-tests — Reference

Read when diagnosing a failure. Keep SKILL.md workflow; use this for patterns.

## Diagnosis patterns

### Pattern 1: Signature / route / API changed

**Symptom:** undefined method/function, wrong arity, route/URL not found, 404 on a formerly valid path

**Diagnosis:**
```bash
git log --oneline -5 -- path/to/changed/file
git diff HEAD~3 -- path/to/changed/file
```

**Fix:** Update the test call site to the new signature/route. Keep the same behavioral intent.

### Pattern 2: Response or return shape changed

**Symptom:** missing keys, assertion mismatch on body/JSON/HTML, deep-equal failures

**Diagnosis:** Compare what the test expects with what the code now returns (serializer, view, mapper, DTO).

**Fix:** Update expected values only if the new shape is intentional. Keep asserting the same business rule.

### Pattern 3: Schema / fixture / factory changed

**Symptom:** missing column/field, constraint violation, fixture build errors

**Diagnosis:** Recent migrations, schema files, factories, or fixture builders.

**Fix:** Align setup data with the new schema. Required new fields need defaults in factories/fixtures.

### Pattern 4: Auth / middleware / permissions added

**Symptom:** 401/403, redirect to login, forbidden in UI/API tests

**Diagnosis:** New middleware, policy, guard, or permission check on the path under test.

**Fix:** Use the repo’s existing auth/setup helpers (same style as sibling tests). Do not disable security to green the suite.

### Pattern 5: Deliberate business-logic change

**Symptom:** Assertion fails because behavior changed on purpose

**Diagnosis:** Commit message, PR description, or `git log` on the production path.

**Fix:** Rewrite the assertion for the new correct behavior. Comment only if non-obvious.

### Pattern 6: Infrastructure / environment failure

**Symptom:** browser failed to launch, `ECONNREFUSED`, `EPERM`/`spawn`, missing binary, display/Docker/socket errors, sandbox denials

**Diagnosis:** Not a logic failure. Check whether the Shell ran with the permissions the runner needs.

**Fix:**
1. Re-run with the required permissions if they were missing
2. If it still fails → ask the user to run the same command locally and paste output
3. Never change test or product code to “fix” an infra error

### Pattern 7: Order / shared-state flake

**Symptom:** Passes alone, fails in suite, or intermittent

**Diagnosis:** Shared DB/files/statics/caches; missing isolation hooks the repo normally uses.

**Fix:** Match sibling tests’ isolation pattern (transaction reset, fresh fixtures, per-test setup). Make the test order-independent.

### Pattern 8: Type or fixture shape drift (typed frontends)

**Symptom:** Compile/type errors in the test file, or deep-equal missing/extra keys after a type change

**Diagnosis:** Diff the source module and local fixture helpers.

**Fix:** Extend fixture defaults for new required fields; update assertions only when the mapping/behavior change was deliberate.

### Pattern 9: Import / alias / path drift

**Symptom:** Cannot find module, failed to resolve import, wrong package path after a move

**Diagnosis:** File moved/renamed; check bundler/test alias config and imports in source + test.

**Fix:** Update imports; keep co-located tests moving with their module when that is the repo convention.

### Pattern 10: Contract drift between layers

**Symptom:** Mapper/client/adapter tests fail after the other side’s payload shape changed

**Diagnosis:** Confirm which side is source of truth for this change (API, schema, shared types).

**Fix:** Update the adapter **and** its test together when the contract change is correct; fix the wrong side if only one drifted.

## When to change code vs test

| Signal | Action |
|--------|--------|
| Commit/PR says refactor, rename, or intentional behavior change | Update test |
| No recent change to code under test | Fix the code — something else broke it |
| Tests were green before *your* current edits | Fix your code |
| Many tests fail on the same path | Likely code bug |
| Single test fails and assertion looks wrong | Dig deeper before deciding |
| Test asserts mocks/internals, not behavior | Prefer asserting observable behavior (per repo norms) |

## Git archaeology

```bash
git log --oneline -10 -- path/to/file
git diff HEAD~5 -- path/to/file
git blame path/to/file
git log --oneline --all -- path/to/test-file
git diff main -- path/to/code
```

## Convention checklist (per repo)

Before editing tests, confirm from docs + siblings:

- Naming and location of tests
- How auth, DB, and time are set up
- Assertion helpers the suite prefers
- Whether browser tests use a dedicated directory or tags
- Whether parallel runs need extra flags or env vars

## Regression check

After fixing test N:

1. Test N passes
2. Rest of that file passes
3. Related same-area tests still pass (same package/directory)

Only then run the full scoped suite as final confirmation (SKILL.md step 5).
