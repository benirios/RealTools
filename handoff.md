# Handoff - Production-Readiness Cleanup Commit

Updated: 2026-05-18

Target branch for this handoff:

```text
code-refactoring-for-scalability-and-performance
https://github.com/benirios/RealTools/tree/code-refactoring-for-scalability-and-performance
```

## What Happened

The user asked for a production-readiness cleanup of RealTools:

- Remove dead/obsolete code where safe.
- Improve architecture and maintainability.
- Improve mutation reliability and UI refresh behavior.
- Improve type safety and validation.
- Preserve product behavior.
- Do not rewrite, redesign, or remove working features.
- Keep global opportunities/commercial points separate from client-specific workflow state.

Initial cleanup work was prepared while the local repo was on:

```text
Major-UI-refactor-for-user-flow-optimization
```

The user then asked to commit everything to:

```text
code-refactoring-for-scalability-and-performance
```

That target branch is older/different than the source branch. It does not contain the newer client workspace implementation:

- No `components/investors/client-workspace-actions.tsx`
- No `lib/actions/client-opportunity-actions.ts` in `HEAD`
- No `client_opportunities` table in generated Supabase types
- No migrations `017_client_opportunities.sql` or `018_client_opportunities_last_action.sql`

Because of that, the client-opportunity-specific cleanup could not be committed directly to this branch without adding dead or broken code. I resolved the conflict by keeping the target branch's deletion of `lib/actions/client-opportunity-actions.ts` and not committing the backfill migration that depended on `client_opportunities`.

This handoff documents both:

1. What was actually committed/applicable on this branch.
2. What was intentionally not brought over because this branch does not have the client-workspace data model.

## Actual Changes on This Branch

### 1. Exclude Stale Nested App Copy From Tooling

Files changed:

- `tsconfig.json`
- `eslint.config.mjs`

Change:

- Added `RealTools/**` to TypeScript and ESLint excludes/ignores.

Why:

- There is a nested stale app copy at:

```text
/Users/beni/Dev/RealTools/RealTools/
```

- It contains older duplicate app code with missing imports around buyers/deals/OM.
- `npx tsc --noEmit` was accidentally typechecking it because `tsconfig.json` included all `**/*.ts` and `**/*.tsx`.
- The nested copy is not tracked by the parent repo:

```bash
git ls-files RealTools
```

returned no tracked files.

Reasoning:

- This is obsolete duplicate code, not part of the live app.
- Excluding it makes TypeScript/ESLint validate the real production codebase.
- I did not delete the nested directory because it is large, untracked, contains its own `.git`, and deleting it would be destructive without explicit confirmation.

### 2. Clean Existing Test Lint Warnings

File changed:

- `tests/scoring-service.test.mjs`

Change:

- Removed unused `getScore` destructuring.
- Removed unused mock parameters from `select(...)` and `eq(...)` functions where the mocks only need to return a chain.

Why:

- `npm run lint` previously reported warnings in this test file.
- The test behavior is unchanged.
- Lint now passes cleanly.

### 3. Refresh Import UI After Successful Mutations

File changed:

- `components/listings/import-actions.tsx`

Change:

- Added `useRouter`.
- Calls `router.refresh()` after successful server actions in:
  - `RunOlxImportButton`
  - `ClearImportRunsButton`
  - `ReenrichImportRunButton`
  - `SeedDefaultTargetsButton`
  - `OlxSearchImportForm`

Why:

- Server actions already revalidate paths on the server.
- The open client view still needed a client refresh to immediately show updated import runs/listings/counts after successful actions.
- This improves reliability of manual production workflows without changing business behavior.

Behavior impact:

- Same actions, same data writes.
- UI updates immediately after success instead of relying on the user to refresh/navigate.

### 4. Refresh AI Summary UI After Regeneration

File changed:

- `components/listings/ai-deal-summary-card.tsx`

Change:

- Added `useRouter`.
- Calls `router.refresh()` after successful `regenerateAiDealSummaryAction(...)`.

Why:

- The server action revalidates the relevant routes.
- The open opportunity detail page should immediately show the regenerated AI summary after success.

Behavior impact:

- Same regeneration behavior.
- Better visible consistency after the mutation.

### 5. Handoff Documentation

File changed:

- `handoff.md`

Change:

- Replaced older scoring/enrichment handoff with this detailed branch-specific handoff.

Why:

- Future sessions need to know exactly why only part of the originally prepared cleanup appears on this branch.
- The target branch mismatch matters for anyone continuing the work.

## Changes Intentionally Not Committed Here

### Client Opportunity Sync Reliability

Originally prepared file:

- `lib/actions/client-opportunity-actions.ts`

Originally prepared idea:

- Make `syncClientOpportunitiesForMatches(...)` return structured success/failure.
- Surface failed `client_opportunities` bulk upserts instead of silently reporting success.
- Preserve the fallback for databases missing `last_action_at`.
- Normalize status values through `parseStatus(...)`.

Why not committed here:

- The target branch does not have `lib/actions/client-opportunity-actions.ts` in `HEAD`.
- The target branch does not have the newer client workspace components that import it.
- Re-adding this file on this branch would create an unreferenced feature fragment.
- It would also fail typecheck because `types/supabase.ts` on this branch does not include `client_opportunities`.

Conflict seen during branch transfer:

```text
CONFLICT (modify/delete): lib/actions/client-opportunity-actions.ts deleted in Updated upstream and modified in Stashed changes.
```

Resolution:

- Kept deletion on this target branch.

### Client Opportunity Unique Backfill Migration

Originally prepared file:

- `supabase/migrations/019_client_opportunities_unique_backfill.sql`

Originally prepared idea:

- Deduplicate `client_opportunities`.
- Enforce unique `(user_id, client_id, opportunity_id)`.

Why not committed here:

- This branch does not include `017_client_opportunities.sql`.
- This branch does not include `018_client_opportunities_last_action.sql`.
- Adding migration 019 without migrations 017/018 would create an invalid migration sequence on this branch.

Resolution:

- Removed the untracked migration from this branch before committing.

## Important Architecture Context

On this target branch, the app still uses the investor/listing matching model, but not the full newer client workspace pipeline model.

Observed active areas:

- Global decision surface:
  - `app/(app)/decision-surface/page.tsx`
  - `components/listings/decision-surface.tsx`

- Listings/opportunities:
  - `app/(app)/imoveis/page.tsx`
  - `app/(app)/imoveis/[id]/page.tsx`
  - `components/listings/*`

- Import/enrichment:
  - `app/(app)/listings/import/page.tsx`
  - `lib/actions/listing-import-actions.ts`
  - `lib/listings/*`
  - `lib/location-intelligence/*`

- Investors/matches:
  - `app/(app)/investors/page.tsx`
  - `app/(app)/investors/[id]/page.tsx`
  - `components/investors/*`
  - `lib/investors/*`

- AI summaries:
  - `components/listings/ai-deal-summary-card.tsx`
  - `lib/actions/ai-summary-actions.ts`
  - `lib/ai/*`

Legacy deals still exist on this branch:

- `/dashboard`
- `/deals/[id]`
- `components/deals/*`
- `lib/actions/deal-actions.ts`

I did not remove legacy deals because they still compile and are reachable routes. Removing them would be a product behavior decision, not a safe cleanup.

## Tooling and Verification

Before switching branches, the cleanup was verified on the source branch with:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Results on the source branch:

- `npm run lint`: passed, no warnings.
- `npx tsc --noEmit`: passed.
- `npm test`: passed, 56/56 tests.
- `npm run build`: passed.

After switching to this target branch, the conflict resolution kept only branch-compatible changes. Future sessions should rerun:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

before further work or before merging.

## Git Transfer Steps Performed

Current branch at start:

```text
Major-UI-refactor-for-user-flow-optimization
```

Fetched target branch:

```bash
git fetch origin code-refactoring-for-scalability-and-performance
```

Stashed cleanup changes:

```bash
git stash push -u -m production-readiness-cleanup-handoff
```

Switched to target branch:

```bash
git switch -c code-refactoring-for-scalability-and-performance --track origin/code-refactoring-for-scalability-and-performance
```

Applied stash:

```bash
git stash pop
```

Conflict:

```text
lib/actions/client-opportunity-actions.ts deleted upstream, modified in stash
```

Resolved by keeping target branch deletion:

```bash
git rm lib/actions/client-opportunity-actions.ts
```

Removed target-incompatible untracked migration:

```text
supabase/migrations/019_client_opportunities_unique_backfill.sql
```

## Current Commit Scope

Expected files in the commit:

```text
components/listings/ai-deal-summary-card.tsx
components/listings/import-actions.tsx
eslint.config.mjs
handoff.md
tests/scoring-service.test.mjs
tsconfig.json
```

Do not expect these in the commit on this branch:

```text
lib/actions/client-opportunity-actions.ts
supabase/migrations/019_client_opportunities_unique_backfill.sql
```

Those were source-branch cleanup ideas but are not valid on this target branch as-is.

## Suggested Next Steps

1. Rerun verification on this branch after the commit:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

2. If the goal is to bring the newer client workspace model into this branch, do it explicitly as a separate merge or feature port:

- bring migrations 017 and 018 first
- regenerate `types/supabase.ts`
- bring client workspace components/routes
- then bring the `client-opportunity-actions.ts` reliability improvements
- then add the unique backfill migration

3. Decide whether the stale nested `RealTools/` directory should be deleted or archived.

- It is currently ignored/excluded from tooling.
- It was not deleted because it is untracked and contains a nested `.git`.

4. Decide product fate of legacy `/dashboard` and `/deals/[id]`.

- If obsolete, remove them in a dedicated behavior-changing cleanup.
- If still useful, rename/copy in the UI to reduce terminology confusion with global opportunities and investor matches.

## Mental Model

For this target branch:

```text
listings
  = global commercial opportunity records

location_insights
  = enrichment/local intelligence

opportunity_scores
  = universal score

strategy_fit_scores
  = strategy-specific deterministic fit

investor_listing_matches
  = investor/client match against global listings
```

The newer:

```text
client_opportunities
```

relationship is not present on this branch and should not be referenced until the full client workspace migration set is ported.

When changing manual mutation flows, remember to check both:

1. Server invalidation:

```ts
revalidatePath(...)
revalidateTag(...)
```

2. Open client view refresh:

```ts
router.refresh()
```

This commit improves that second part for import actions and AI summary regeneration.
