# Graph Report - RealTools  (2026-05-18)

## Corpus Check
- 215 files · ~295,317 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 715 nodes · 1109 edges · 48 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 190 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 114|Community 114]]

## God Nodes (most connected - your core abstractions)
1. `createSupabaseServerClient()` - 50 edges
2. `GET()` - 36 edges
3. `calculateStrategyFitScore()` - 21 edges
4. `calculateInvestorMatchScore()` - 14 edges
5. `computeScore()` - 13 edges
6. `POST()` - 12 edges
7. `resolveLocationIntelligence()` - 12 edges
8. `runClientOlxSearchImportAction()` - 12 edges
9. `enrichScoreAndMatchListing()` - 11 edges
10. `scrapeOlxListings()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `buildPipelineItems()` --calls--> `loadDeals()`  [INFERRED]
  app/(app)/investors/[id]/page.tsx → lib/investors/match-processing.ts
- `ListingImportPage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/listings/import/page.tsx → lib/supabase/server.ts
- `InteligenciaLocalPage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/inteligencia-local/page.tsx → lib/supabase/server.ts
- `DecisionSurfacePage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/decision-surface/page.tsx → lib/supabase/server.ts
- `InvestorsPage()` --calls--> `createSupabaseServerClient()`  [INFERRED]
  app/(app)/investors/page.tsx → lib/supabase/server.ts

## Hyperedges (group relationships)
- **RealTools Technology Stack** — claude_nextjs, claude_typescript, claude_supabase, claude_tailwindcss, claude_shadcn_ui, claude_resend, claude_vercel [EXTRACTED 1.00]
- **RealTools State Management Pattern** — claude_server_components, claude_server_actions, claude_revalidatepath [EXTRACTED 1.00]
- **OM Tracking Signals** — claude_url_tracking, claude_pixel_tracking, claude_om_tracking [EXTRACTED 1.00]
- **RealTools Auth Critical Rules** — claude_getuser, claude_getsession, claude_supabase_ssr, claude_supabase_auth_helpers, claude_middleware_matcher [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (37): createBuyerAction(), deleteBuyerAction(), updateBuyerAction(), removeClientOpportunityAction(), createDealAction(), deleteDealAction(), updateDealAction(), handleDelete() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (23): loginAction(), signUpAction(), handleSubmit(), getScore(), getScoreHistory(), getStrategyFitScores(), upsertScore(), upsertStrategyFitScore() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (19): addressForDeal(), addressForMatch(), applyListingFilters(), buildPipelineItems(), coordinateForMatch(), firstParam(), fitReasons(), formatDate() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (31): getErrorMessage(), getExistingClientOpportunity(), getMatchScore(), parseStatus(), recalculateClientWorkspaceMatchesAction(), runClientOlxSearchImportAction(), syncClientOpportunitiesForMatches(), updateClientOpportunityNotesAction() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (28): buildBrazilLocationQuery(), clampConfidence(), compactLocationText(), normalizeLocationText(), buildMockDemographicEstimate(), buildNominatimSearchUrl(), buildSidraDemographicEstimate(), buildSidraUrl() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (24): regenerateAiDealSummaryAction(), createDealSummaryProvider(), createGeminiProvider(), getDealSummaryProviderConfig(), parseSummaryJson(), parseTemperature(), stripJsonFences(), buildDealSummaryInput() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (27): createInvestor(), deleteInvestor(), emptyToNull(), toInvestorInsert(), toInvestorUpdate(), updateInvestor(), createInvestorAction(), deleteInvestorAction() (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (29): /api/track/* route, CRE Deal Management SaaS, Deal Hub, Middleware Matcher, Next.js 15 (App Router), Offering Memorandum (OM), /om/* route, OM Tracking (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (15): buildEphemeralLocationInsight(), buildListingLocationInput(), createStandaloneLocationInsight(), enrichListingLocationInsight(), getListingLocationInsightByListingId(), getLocationInsightById(), loadListingForUser(), normalizeCreateLocationInsightInput() (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (20): enrichListingFields(), inferListingTags(), inferPropertyType(), normalize(), parseBrazilianPrice(), buildOlxSearchUrl(), compactText(), isCloudflareBlock() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (20): addReason(), asNumber(), calculateStrategyFitScore(), categoryMatches(), clamp(), competitionBalanceScore(), confidenceFor(), countNearby() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.26
Nodes (21): calculateInvestorDealMatch(), calculateInvestorMatchScore(), clamp(), confidenceFor(), generateScoreExplanation(), getStrategyFitScore(), hasAnyPreference(), localIntelligenceScore() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (4): fitTags(), jsonStrings(), summarySnippet(), uniqueSorted()

### Community 13 - "Community 13"
Cohesion: 0.3
Nodes (14): categoryMatches(), clamp(), computeScore(), deriveFitLabel(), RuleBasedScoringEngine, scoreCompetition(), scoreDemographics(), scoreInvestorFit() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (11): ScoreRing(), asArray(), asBreakdown(), asRisks(), asSignals(), clampScore(), getCategoryRows(), getFitLabelText() (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (6): createSupabaseBrowserClient(), deleteDealFileAction(), insertDealFileAction(), handleDelete(), handleFileChange(), now()

### Community 16 - "Community 16"
Cohesion: 0.34
Nodes (10): buildDemoInputFromListing(), createDemoLocationInsightsForListing(), createLocationInsight(), getListingLocationInsight(), getLocationInsight(), isReliableNearbyBusiness(), mapRowToInsight(), reliableNearbyBusinesses() (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.35
Nodes (11): compactText(), escapeRegex(), extractContacts(), extractDetails(), extractReferences(), paragraphize(), removeFirstMatch(), removeOlxChrome() (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.36
Nodes (7): applySessionCookies(), createAdminClient(), ensureAuthenticatedScoreCardState(), makeInsight(), makeListing(), makeScore(), seedScoreCardFixtures()

### Community 20 - "Community 20"
Cohesion: 0.53
Nodes (4): AlertDialogAction(), AlertDialogHeader(), AlertDialogOverlay(), cn()

### Community 21 - "Community 21"
Cohesion: 0.6
Nodes (4): activityDescription(), activityIcon(), formatTimestamp(), metadataValue()

### Community 22 - "Community 22"
Cohesion: 0.7
Nodes (3): addTag(), handleKeyDown(), removeTag()

### Community 23 - "Community 23"
Cohesion: 0.6
Nodes (3): cn(), DialogHeader(), DialogOverlay()

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (3): FormControl(), FormDescription(), FormMessage()

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (2): jsonArray(), scoreFromRow()

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (2): formatDistance(), formatNumber()

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (2): DealCard(), StatusBadge()

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (2): CardAction(), cn()

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (2): buildOmEmailHtml(), escapeHtml()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (1): middleware()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (1): RootLayout()

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (1): Home()

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (1): SignUpPage()

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (1): LoginPage()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (1): LogoutButton()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (1): Sidebar()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (1): Label()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (1): Badge()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (1): Separator()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (1): cn()

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (1): Checkbox()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): SelectTrigger()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): cn()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (1): Input()

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (1): cn()

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (3): GSD Planning Workflow, .planning/ directory, .planning/STATE.md

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (3): getSession() (BANNED), getUser(), Rationale: getUser over getSession

### Community 114 - "Community 114"
Cohesion: 1.0
Nodes (1): RealTools CLAUDE.md

## Knowledge Gaps
- **12 isolated node(s):** `RealTools CLAUDE.md`, `Deal Hub`, `TypeScript`, `@supabase/auth-helpers-nextjs (BANNED)`, `TailwindCSS` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 26`** (4 nodes): `strategy-fit-card.tsx`, `handleRecalculate()`, `jsonArray()`, `scoreFromRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (4 nodes): `location-insight-card.tsx`, `formatCurrency()`, `formatDistance()`, `formatNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (4 nodes): `deal-card.tsx`, `DealCard()`, `StatusBadge()`, `deal-card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (4 nodes): `CardAction()`, `cn()`, `card.tsx`, `card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (4 nodes): `buildOmEmailHtml()`, `buildOmEmailText()`, `escapeHtml()`, `om-email.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `middleware()`, `middleware.ts`, `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `layout.tsx`, `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (3 nodes): `page.tsx`, `Home()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (3 nodes): `page.tsx`, `SignUpPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (3 nodes): `page.tsx`, `LoginPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (3 nodes): `logout-button.tsx`, `LogoutButton()`, `logout-button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (3 nodes): `sidebar.tsx`, `sidebar.tsx`, `Sidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (3 nodes): `label.tsx`, `Label()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `Badge()`, `badge.tsx`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (3 nodes): `separator.tsx`, `separator.tsx`, `Separator()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (3 nodes): `cn()`, `button.tsx`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `Checkbox()`, `checkbox.tsx`, `checkbox.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `select.tsx`, `select.tsx`, `SelectTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `textarea.tsx`, `textarea.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `input.tsx`, `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `utils.ts`, `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `RealTools CLAUDE.md`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createSupabaseServerClient()` connect `Community 0` to `Community 1`, `Community 3`, `Community 5`, `Community 6`, `Community 8`, `Community 15`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 1` to `Community 8`, `Community 0`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `loadDeals()` connect `Community 6` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 48 inferred relationships involving `createSupabaseServerClient()` (e.g. with `AppLayout()` and `ListingImportPage()`) actually correct?**
  _`createSupabaseServerClient()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 25 inferred relationships involving `GET()` (e.g. with `scoreByListing()` and `latestByListing()`) actually correct?**
  _`GET()` has 25 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RealTools CLAUDE.md`, `Deal Hub`, `TypeScript` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._