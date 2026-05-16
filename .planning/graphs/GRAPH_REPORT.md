# Graph Report - RealTools  (2026-05-16)

## Corpus Check
- 149 files · ~232,284 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 596 nodes · 948 edges · 25 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 160 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 94|Community 94]]

## God Nodes (most connected - your core abstractions)
1. `createSupabaseServerClient()` - 39 edges
2. `GET()` - 29 edges
3. `calculateStrategyFitScore()` - 21 edges
4. `calculateInvestorMatchScore()` - 14 edges
5. `computeScore()` - 13 edges
6. `POST()` - 12 edges
7. `resolveLocationIntelligence()` - 12 edges
8. `enrichScoreAndMatchListing()` - 11 edges
9. `geocodeLocation()` - 11 edges
10. `scrapeOlxListings()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/layout.tsx → lib/supabase/server.ts
- `ListingImportPage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/listings/import/page.tsx → lib/supabase/server.ts
- `InteligenciaLocalPage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/inteligencia-local/page.tsx → lib/supabase/server.ts
- `ProfilePage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/profile/page.tsx → lib/supabase/server.ts
- `DecisionSurfacePage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/decision-surface/page.tsx → lib/supabase/server.ts

## Hyperedges (group relationships)
- **RealTools Technology Stack** — claude_nextjs, claude_typescript, claude_supabase, claude_tailwindcss, claude_shadcn_ui, claude_resend, claude_vercel [EXTRACTED 1.00]
- **RealTools State Management Pattern** — claude_server_components, claude_server_actions, claude_revalidatepath [EXTRACTED 1.00]
- **OM Tracking Signals** — claude_url_tracking, claude_pixel_tracking, claude_om_tracking [EXTRACTED 1.00]
- **RealTools Auth Critical Rules** — claude_getuser, claude_getsession, claude_supabase_ssr, claude_supabase_auth_helpers, claude_middleware_matcher [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (40): loginAction(), signUpAction(), handleSubmit(), createSupabaseBrowserClient(), createDealAction(), deleteDealAction(), updateDealAction(), handleDelete() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (22): buildEphemeralLocationInsight(), buildListingLocationInput(), createStandaloneLocationInsight(), enrichListingLocationInsight(), getListingLocationInsightByListingId(), getLocationInsightById(), loadListingForUser(), normalizeCreateLocationInsightInput() (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (28): buildBrazilLocationQuery(), clampConfidence(), compactLocationText(), normalizeLocationText(), buildMockDemographicEstimate(), buildNominatimSearchUrl(), buildSidraDemographicEstimate(), buildSidraUrl() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (27): createInvestor(), deleteInvestor(), emptyToNull(), toInvestorInsert(), toInvestorUpdate(), updateInvestor(), createInvestorAction(), deleteInvestorAction() (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (23): regenerateAiDealSummaryAction(), createDealSummaryProvider(), createGeminiProvider(), getDealSummaryProviderConfig(), parseSummaryJson(), parseTemperature(), stripJsonFences(), buildDealSummaryInput() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (29): /api/track/* route, CRE Deal Management SaaS, Deal Hub, Middleware Matcher, Next.js 15 (App Router), Offering Memorandum (OM), /om/* route, OM Tracking (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (21): completeImportRun(), failImportRun(), startImportRun(), toListingInsert(), toListingTargetInsert(), upsertListing(), upsertListingImportTarget(), getErrorMessage() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (9): chooseMapFrame(), clamp(), fitTags(), getBounds(), jsonStrings(), latLngToWorld(), mapPointStyle(), summarySnippet() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (20): enrichListingFields(), inferListingTags(), inferPropertyType(), normalize(), parseBrazilianPrice(), buildOlxSearchUrl(), compactText(), isCloudflareBlock() (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (20): addReason(), asNumber(), calculateStrategyFitScore(), categoryMatches(), clamp(), competitionBalanceScore(), confidenceFor(), countNearby() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.26
Nodes (21): calculateInvestorDealMatch(), calculateInvestorMatchScore(), clamp(), confidenceFor(), generateScoreExplanation(), getStrategyFitScore(), hasAnyPreference(), localIntelligenceScore() (+13 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (12): getScore(), getScoreHistory(), getStrategyFitScores(), upsertScore(), upsertStrategyFitScore(), getListingLocationInsight(), loadListingForScoring(), scoreListingService() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.3
Nodes (14): categoryMatches(), clamp(), computeScore(), deriveFitLabel(), RuleBasedScoringEngine, scoreCompetition(), scoreDemographics(), scoreInvestorFit() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (11): ScoreRing(), asArray(), asBreakdown(), asRisks(), asSignals(), clampScore(), getCategoryRows(), getFitLabelText() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (8): applyListingFilters(), firstParam(), formatDate(), getFilters(), parseMoneyParam(), parsePercentParam(), sanitizeFilterValue(), statusVariant()

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (7): DecisionSurfacePage(), isBrazilCoordinate(), latestByListing(), matchesByListing(), normalizeBrazilCoordinates(), numberOrNull(), scoreByListing()

### Community 16 - "Community 16"
Cohesion: 0.35
Nodes (11): compactText(), escapeRegex(), extractContacts(), extractDetails(), extractReferences(), paragraphize(), removeFirstMatch(), removeOlxChrome() (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.36
Nodes (7): applySessionCookies(), createAdminClient(), ensureAuthenticatedScoreCardState(), makeInsight(), makeListing(), makeScore(), seedScoreCardFixtures()

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (2): activityDescription(), metadataValue()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (2): addTag(), handleKeyDown()

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (2): jsonArray(), scoreFromRow()

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (2): formatDistance(), formatNumber()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (3): GSD Planning Workflow, .planning/ directory, .planning/STATE.md

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (3): getSession() (BANNED), getUser(), Rationale: getUser over getSession

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (1): RealTools CLAUDE.md

## Knowledge Gaps
- **12 isolated node(s):** `RealTools CLAUDE.md`, `Deal Hub`, `TypeScript`, `@supabase/auth-helpers-nextjs (BANNED)`, `TailwindCSS` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 21`** (5 nodes): `activityDescription()`, `activityIcon()`, `formatTimestamp()`, `metadataValue()`, `activity-log-section.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `tag-input.tsx`, `addTag()`, `handleKeyDown()`, `removeTag()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (4 nodes): `strategy-fit-card.tsx`, `handleRecalculate()`, `jsonArray()`, `scoreFromRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (4 nodes): `location-insight-card.tsx`, `formatCurrency()`, `formatDistance()`, `formatNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `RealTools CLAUDE.md`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseServerClient()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 15`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 0` to `Community 1`, `Community 3`, `Community 6`, `Community 11`, `Community 15`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `enrichScoreAndMatchListing()` connect `Community 6` to `Community 0`, `Community 1`, `Community 11`, `Community 4`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `createSupabaseServerClient()` (e.g. with `AppLayout()` and `ListingImportPage()`) actually correct?**
  _`createSupabaseServerClient()` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `GET()` (e.g. with `scoreByListing()` and `latestByListing()`) actually correct?**
  _`GET()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RealTools CLAUDE.md`, `Deal Hub`, `TypeScript` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._