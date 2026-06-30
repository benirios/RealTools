# RealTools Manual Testing Checklist

**Last Updated:** 2026-06-24  
**App URL:** http://localhost:3000  
**Test DB:** Supabase dev  

---

## AUTH & ACCOUNT

### Login/Signup (Clerk)
- [x] Load `/auth/login` → redirects from `/` if not authenticated
- [x] Load `/auth/signup` → signup page displays
- [x] Create new account via Clerk signup
- [x] Sign in with existing account
- [x] After login, user redirects to `/dashboard`
- [x] Clerk user profile sync to userId (Supabase queries filter by userId)
- [x] Logout button in app shell → redirects to `/auth/login`
- [x] Accessing protected routes without auth redirects to `/auth/login`

### Profile/Account
- [x] `/app/profile` page loads (if exists)
- [ ] User info displays correctly
- [ ] Profile updates persist

---

## DASHBOARD — Deal Hub

### Page Load & List
- [x] `/dashboard` loads with split panel layout (left: list, right: detail)
- [x] Deal list shows all user's deals sorted by created_at (newest first)
- [x] Deal count reflects total deals in DB
- [ ] Each deal card shows: title, address, price, status, created_at

### Deal List Interactions
- [x] Click deal in list → right panel loads deal detail
- [x] Status filter dropdown filters deals by status (active/closed/pending)
- [x] Selected deal stays highlighted when switching filters
- [x] URL query param `?selected=[id]` persists selected deal

### Deal Detail Panel
- [x] Right panel shows selected deal full info: title, address, price, status, description
- [x] Deal form opens when editing (modal or inline)
- [x] Submit edit → deal updates, list refreshes
- [x] Files section shows uploaded files with signed URLs
- [x] Notes section shows all notes (newest first)
- [x] Activity log shows all activities (om_sent, om_opened, note_added, file_uploaded)

### Create Deal
- [x] "New Deal" / "Create" button opens form modal
- [x] Form validates: title (required), address (required), price (required), status, description
- [x] Submit valid form → deal created, appears in list
- [x] Submit empty form → validation errors show
- [x] Submit form with invalid data → error toast
- [x] After create, dashboard revalidates

### Update Deal
- [x] Click edit deal → form pre-fills with current data
- [x] Change any field → submit
- [x] Deal updates in DB, list refreshes
- [x] Dashboard and deal detail URLs revalidate

### Delete Deal
- [x] Delete button opens confirmation dialog
- [x] Confirm delete → deal removed from list
- [x] All associated files deleted from Storage (deal-files bucket)
- [x] All associated notes/activities/files rows cascade-deleted
- [x] Deleted deal no longer appears in list

### Notes Section
- [x] Note textarea visible in detail panel
- [x] Type note + submit → note added, appears at top of notes list
- [x] Timestamp shows when note created
- [x] Activity log logs note_added event
- [x] Older notes display below newest

### Files Section
- [ ] File upload button visible
- [ ] Upload file → file added to deal_files table
- [ ] Signed URL generated for download link
- [ ] File appears in files list with download link
- [ ] File download works (signed URL valid for 1 hour)
- [ ] Delete file button → removes from Storage + deletes row
- [ ] Activity log logs file_uploaded event

### Activity Log
- [ ] Activity log shows all activities chronologically (newest first)
- [ ] Activities include: om_sent, om_opened, note_added, file_uploaded, etc.
- [ ] Each activity shows timestamp, type, relevant metadata

---

## LISTINGS / IMOVEIS

### Listings Grid (`/imoveis`)
- [x] `/imoveis` loads with grid of all user's listings
- [x] Grid shows listing card: image, title, address, price, status badge
- [x] Click listing card → navigates to `/imoveis/[id]`
- [x] List sorted by created_at (newest first)
- [x] Total count displayed

### Listing Detail Page (`/imoveis/[id]`)
- [x] Page loads with listing info: title, price, address, OLX link (if exists)
- [x] Images carousel/gallery displays listing images
- [x] Back button navigates back

### Location Insight Card
- [x] Card displays location data: neighborhood, demographic info, foot traffic, competition
- [ ] **If source is "mock" or "demo":** nearby businesses section hidden (only show real provider data)
- [ ] **If source is real (Google, etc.):** nearby businesses list displays
- [x] Buttons visible: "Enriquecer" (enrich), "Criar Demo" (seed demo)
- [x] Loading state shows while enriching

### Enrich Location Action
- [x] Click "Enriquecer" button → triggers location enrichment API call
- [x] Success toast: "Localização enriquecida, pontuação recalculada e matches atualizados."
- [x] Page revalidates: imoveis, detail, decision-surface, investors
- [x] Location insights populate (if API returns data)
- [x] Opportunity score recalculates

### Seed Demo Location Insights
- [ ] Click "Criar Demo" button → creates demo location data
- [ ] Success toast: "Dados de demonstração criados com sucesso."
- [ ] Location insight card updates with demo data
- [ ] Opportunity scores populate with demo data
- [ ] Investor matches calculate with demo data

### Strategy Selector
- [x] Dropdown shows all strategies: Café, Logística, Farmácia, Varejo, Serviços, Qualquer
- [ ] Select strategy → triggers scoreListingAction
- [x] Loading state shows while scoring
- [x] Score card updates after scoring completes

### Opportunity Score Card
- [x] Shows when score exists (after strategy selected + enrichment)
- [x] Displays: total score, fit label (Forte/Moderado/Fraco), color band (green ≥70, yellow ≥50, orange ≥40, red <40)
- [x] Category breakdown shows: Demografia, Qualidade da Localização, Tráfego de Pés, Competição, Risco, Aderência ao Investidor
- [x] Each category shows bar + percentage
- [x] Top signals section shows top 3-5 green signals (positive)
- [x] Risks section shows top 3 red/orange signals (negative)
- [ ] Empty state (no location insight): "Enriqueça a localização antes de calcular a pontuação"
- [ ] Empty state (no score): "Calcular pontuação" CTA

### Strategy Fit Card
- [ ] Shows when strategy-specific scoring completes
- [ ] Displays fit scores for selected strategies
- [ ] Updates when location or scoring changes

### Investor Matches
- [ ] Shows matching investors (from investor_listing_matches)
- [ ] Each match displays: investor name, match score, fit label, explanation
- [ ] Match score updates when listing enriched or scores recalculated
- [ ] Investor match cards clickable (if exists)

### AI Deal Summary Card
- [ ] Shows when AI summary is generated
- [ ] Displays headline, investor angle, key insights
- [ ] Card design professional/clear
- [ ] Summary updates when listing enriched

---

## INVESTORS / CLIENTES

### Investors Page (`/investors`)
- [x] `/investors` loads with investors table
- [x] Table shows: name, email, phone, budget range, property types, strategy, risk level, tags
- [x] Total investor count displayed

### Create Investor
- [x] "Add Investor" / "Novo Cliente" button opens form modal
- [x] Form fields: name (req), email, phone, budgetMin, budgetMax, preferredNeighborhoods, propertyTypes, strategy, riskLevel, desiredYield, tags, notes
- [x] Submit valid form → investor created
- [x] Investor appears in table immediately
- [x] Matches recalculate for new investor after creation
- [x] Toast shows success

### Update Investor
- [x] Click edit investor → form pre-fills with current data
- [x] Change any field → submit
- [x] Investor updates in DB, table refreshes
- [x] Matches recalculate for updated investor
- [x] Toast shows success

### Delete Investor
- [x] Delete button → confirmation dialog
- [x] Confirm → investor removed from table
- [x] Investor rows deleted from DB (cascades to matches, om_sends)
- [x] Revalidates /investors page

### Recalculate Investor Matches
- [x] "Recalculate" button on investor row → triggers recalculateMatchesForInvestor
- [x] Toast shows: "X matches recalculados para este investidor."
- [x] Matches update in DB

### Recalculate All Matches
- [x] "Recalculate All" button (top right) → triggers recalculateAllMatches
- [x] Toast shows: "X matches totais recalculados."
- [x] All investor/listing matches recompute
- [x] Decision surface & investor pages revalidate

### Seed Demo Investors
- [x] "Seed Demo" button creates 5+ demo investors (DEMO_INVESTORS)
- [x] Toast shows: "X clientes demo criados."
- [x] Demo investors appear in table
- [x] Matches auto-calculate for all listings

---

## LOCATION INTELLIGENCE

### Inteligência Local Page (`/inteligencia-local`)
- [x] `/inteligencia-local` loads
- [x] "Address Demographic Search" component visible

### Search by Address
- [x] Enter address (e.g., "Av. Paulista, São Paulo")
- [x] Submit search → calls location enrichment API
- [x] Loading state shows
- [x] Results display: neighborhood, demographics (age, income, education), nearby businesses
- [x] Results show business name, category, distance in meters
- [x] Businesses from "mock" or "demo" sources don't display (only real providers)
- [x] Error handling if address not found

---

## OPPORTUNITY MEMORANDUM (OM)

### Listing Detail: OM Recipients Card
- [ ] Card displays on listing detail page
- [ ] Shows table of OM sends: investor name, email, om_sent_at, om_opened_at, status badge
- [ ] "Send OM" button visible

### Send OM Action
- [ ] Click "Send OM" button → investor selector (multi-select or checkbox list)
- [ ] Select one or more investors → submit
- [ ] For each investor:
  - New row created in `investor_om_sends` table
  - Unique `tracking_token` generated
  - Email sent via Resend to investor email
  - om_sent_at timestamp recorded
- [ ] Toast shows: "X OMs enviados." or error if no valid emails
- [ ] OM Recipients card revalidates and shows new sends

### Email Delivery
- [ ] Email arrives in investor inbox with subject: "Memorando de Oportunidade: [Listing Title]"
- [ ] Email contains: investor name, listing title, address, price, OM link, pixel tracking link
- [ ] OM link format: `{SITE_URL}/om/listing/{listingId}?ref={tracking_token}`
- [ ] Pixel link format: `{SITE_URL}/api/track/{tracking_token}`

### OM Tracking (Public, No Auth)
- [ ] `/api/track/[token]` route records pixel hit
- [ ] Pixel hit updates `om_opened_at` in investor_om_sends row
- [ ] `/om/listing/[id]?ref=[token]` shows OM page without login
- [ ] Page displays listing title, price, address, description, images
- [ ] Pixel loads in background (tracks page open)

### OM History
- [ ] OM Recipients card shows all sends for listing
- [ ] Click investor name → navigates to `/investors/[id]`
- [ ] Investor page shows all OM sends to that investor

---

## DECISION SURFACE

### Page Load (`/decision-surface`)
- [x] `/decision-surface` loads with table of all listings + matches
- [x] Displays: listing title, address, opportunity score, best strategies, matching investors
- [-] Map displays listings with coordinates (if available)
- [x] Listings sorted by opportunity score (descending)

### Filtering & Sorting
- [x] Filter by strategy (dropdown)
- [x] Filter by investor match (dropdown)
- [x] Sort by score, created_at, etc.
- [x] Filters persist in URL params

### Listing Row Actions
- [x] Click listing → navigates to `/imoveis/[id]`
- [x] Inline actions: view score, view matches, send OM

---

## LISTING IMPORT

### Import Page (`/listings/import`)
- [x] Page loads with OLX search form
- [x] Summary stats display: total listings, active targets, last run status, failed runs

### OLX Search & Import
- [x] Enter search terms: city, neighborhood, address
- [x] Click "Search" → API calls OLX scraper
- [x] Loading state shows
- [x] Results display: listing title, address, price, images, source link
- [x] Click "Save" on result → saves to listings table
- [x] Toast shows success
- [x] Saved listing appears in listings grid

### Import Targets
- [-] "Import Targets" table shows saved search targets
- [-] Each target: source, country, state, city, search_term, is_active, actions
- [-] Toggle active/inactive
- [-] Delete target → removes from DB

### Import Runs
- [ ] "Import Runs" table shows recent import executions (last 12)
- [ ] Each run: source, status, created_count, updated_count, skipped_count, failed_count, timestamps
- [ ] Run status: pending, running, completed, partial, failed
- [ ] Status badge colors: green (completed), yellow (partial), red (failed)

### Seed Default Targets
- [ ] "Seed Targets" button creates default import targets (major Brazil cities)
- [ ] Toast shows: "X targets criados."
- [ ] Targets appear in Import Targets table

### Clear Import Runs
- [x] "Clear Runs" button → confirmation dialog
- [x] Confirm → deletes old import runs (keeps recent)
- [x] Toast shows success

---

## API ROUTES

### Scoring API
- **GET `/api/listings/[id]/score?strategy=cafe`**
  - [X] Returns saved opportunity score for listing + strategy
  - [X] Returns null if no score exists

- **POST `/api/listings/[id]/score`**
  - [x] Body: `{ strategySlug: "cafe" }`
  - [x] Computes and saves score
  - [X] Returns score object with totalScore, fitLabel, categories, signals, risks

### Location Insights API
- **GET `/api/listings/[id]/location-insight`**
  - [X] Returns saved location insights for listing
  - [X] Includes demographics, foot traffic, competition, nearby businesses

- **POST `/api/listings/[id]/enrich-location`**
  - [X] Calls location enrichment providers (Google Places, etc.)
  - [X] Saves insights to location_insights table
  - [X] Returns success/error message

### Investors API
- **GET `/api/investors`**
  - [X] Returns all investors for user
  - [X] Filters by user_id

- **POST `/api/investors`**
  - [x] Creates new investor
  - [x] Validates form data

- **GET `/api/investors/[id]`**
  - [x] Returns single investor
  - [x] Includes related data (matches, OM sends)

- **PATCH `/api/investors/[id]`**
  - [x] Updates investor
  - [x] Recalculates matches

- **DELETE `/api/investors/[id]`**
  - [x] Deletes investor
  - [x] Cascades to matches & OM sends

- **GET `/api/investors/[id]/matches`**
  - [x] Returns all matches for investor
  - [x] Includes listing + match score data

### OM Tracking API
- **GET `/api/track/[token]`**
  - [x] Public route (no auth)
  - [x] Records pixel hit
  - [x] Updates om_opened_at in investor_om_sends
  - [x] Returns 1x1 pixel image

### Proxy Image API
- **GET `/api/proxy-image?url=[encoded_url]`**
  - [x] Public route (no auth)
  - [x] Proxies image from external URL
  - [x] Returns image with proper headers

---

## SERVER ACTIONS

### Scoring Actions
- [ ] `scoreListingAction(listingId, strategySlug)` → computes & saves score
- [ ] `getBestFitAction(listingId)` → scores all best-fit strategies (café, logistics, pharmacy)
- [ ] Returns score object + top strategies with fit labels

### Investor Actions
- [ ] `createInvestorAction(formData)` → creates investor, recalculates matches
- [ ] `updateInvestorAction(formData)` → updates investor, recalculates matches
- [ ] `deleteInvestorAction(investorId)` → deletes investor
- [ ] `seedDemoInvestorsAction()` → creates demo investors, recalculates all matches
- [ ] `recalculateInvestorMatchesAction(investorId)` → recomputes matches for one investor
- [ ] `recalculateAllMatchesAction()` → recomputes all investor/listing matches

### Deal Actions
- [ ] `createDealAction(formData)` → creates deal
- [ ] `updateDealAction(formData)` → updates deal
- [ ] `deleteDealAction(dealId)` → deletes deal + cascade files

### Location Intelligence Actions
- [ ] `enrichListingLocationAction(listingId)` → enriches location, recalculates scores + matches
- [ ] `seedDemoLocationInsightsAction(listingId)` → creates demo location data
- [ ] `recalculateListingMatchesAction(listingId)` → recomputes matches for listing
- [ ] `recalculateListingStrategyScoresAction(listingId)` → recalculates strategy fit scores

### Note Actions
- [ ] `createNoteAction(dealId, content)` → creates note, logs activity
- [ ] `deleteNoteAction(noteId)` → deletes note

### File Actions
- [ ] `uploadDealFileAction(dealId, file)` → uploads file to Storage, creates row
- [ ] `deleteDealFileAction(fileId)` → deletes file from Storage + row
- [ ] `generateSignedUrlAction(fileId)` → returns signed download URL

### OM Actions
- [ ] `sendOmAction(listingId, investorIds[])` → sends OMs to investors
- [ ] `getOmSendsForInvestorAction(investorId)` → loads all OMs sent to investor
- [ ] `getOmSendsForListingAction(listingId)` → loads all OMs sent for listing

### Listing Import Actions
- [ ] `olxSearchAction(query)` → searches OLX, returns listings
- [ ] `saveListingAction(data)` → saves listing to DB
- [ ] `createImportTargetAction(formData)` → creates import target
- [ ] `deleteImportTargetAction(targetId)` → deletes import target
- [ ] `toggleImportTargetAction(targetId)` → toggles is_active
- [ ] `seedDefaultImportTargetsAction()` → creates default targets
- [ ] `clearImportRunsAction()` → deletes old import runs

### Client Opportunity Actions
- [ ] `createClientOpportunityAction(investorId, listingId, status)` → links investor to listing
- [ ] `updateClientOpportunityStatusAction(opportunityId, status)` → updates workflow status
- [ ] `deleteClientOpportunityAction(opportunityId)` → removes link

### AI Summary Actions
- [ ] `generateAiSummaryAction(listingId)` → triggers AI deal summary generation
- [ ] Returns AiDealSummary object with headline, investor_angle, key_insights

---

## UI COMPONENTS & INTERACTIONS

### Navigation & Layout
- [ ] App shell (header + sidebar) visible on all protected pages
- [ ] Sidebar navigation links: Dashboard, Listings, Investors, Location Intelligence, Decision Surface, Import
- [ ] Active nav item highlighted
- [ ] Logout button visible in header/profile menu
- [ ] Theme toggle (if implemented)

### Forms
- [ ] All form inputs validate on submit
- [ ] Validation errors display inline or toast
- [ ] Submit buttons disabled while loading
- [ ] Success/error toasts show after action
- [ ] Form resets after successful submit

### Modals
- [ ] Modal opens on button click
- [ ] Modal closes on cancel or successful submit
- [ ] Backdrop click closes modal (if configured)
- [ ] Modal content scrollable if too tall

### Tables
- [ ] All tables display data correctly
- [ ] Responsive on mobile (stack columns or horizontal scroll)
- [ ] Sort by column (if implemented)
- [ ] Pagination (if implemented)
- [ ] Empty state shows when no data

### Cards & Displays
- [ ] All cards display correct data
- [ ] Cards responsive on mobile
- [ ] Placeholder/skeleton loading state (if implemented)
- [ ] Color coding correct (score bands: green/yellow/orange/red)

### Error Handling
- [ ] Invalid routes show 404 or redirect
- [ ] API errors show user-friendly toast messages
- [ ] Network errors handled gracefully
- [ ] Unauthorized access redirects to login

---

## EDGE CASES & DATA INTEGRITY

### Multi-User Isolation
- [ ] User A's data not visible to User B
- [ ] All queries filtered by userId
- [ ] Investor delete cascades to matches but not visible to other users
- [ ] OM sends scoped to user's investors + listings

### Empty States
- [ ] Dashboard with no deals shows empty state
- [ ] Investors page with no investors shows empty state + seed button
- [ ] Listings with no imports shows empty state
- [ ] Score card without location insight shows error state

### Permission/Auth Guards
- [ ] All protected routes check auth (userId)
- [ ] All API routes check auth + userId scope
- [ ] Deleting other user's data returns error
- [ ] Unauthenticated requests redirect to login

### Data Cascades
- [ ] Delete deal → cascade delete notes, files, activities
- [ ] Delete investor → cascade delete matches, OM sends
- [ ] Delete listing → cascade delete scores, matches, summaries, insights

### Status Transitions
- [ ] Deal status transitions: active → closed → pending (if valid)
- [ ] Investor match status updates when scores recompute
- [ ] OM send status tracks: sent → opened (on pixel hit)

---

## PERFORMANCE & LOADING

### Page Load Times
- [ ] Dashboard loads within 2s (with 20+ deals)
- [ ] Listings grid loads within 2s (with 100+ listings)
- [ ] Investors table loads within 1s (with 50+ investors)
- [ ] Decision surface loads within 3s

### Action Latency
- [ ] Scoring action completes within 3s
- [ ] Location enrichment completes within 5s (depends on API)
- [ ] Match recalculation completes within 5s
- [ ] Sending 10 OMs completes within 5s

### Lazy Loading & Pagination
- [ ] Tables load first 20 rows (if pagination implemented)
- [ ] Images load with blur placeholder (if implemented)
- [ ] Infinity scroll works (if implemented)

---

## ACCESSIBILITY & MOBILE

### Responsive Design
- [ ] Page scales correctly on mobile (320px+)
- [ ] Sidebar collapses to hamburger on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Forms stack vertically on mobile
- [ ] Touch targets ≥44px on mobile

### Keyboard Navigation
- [ ] Tab through form fields in logical order
- [ ] Buttons accessible via Enter/Space
- [ ] Modals trap focus (if implemented)
- [ ] Escape closes modals

### Accessibility
- [ ] Form labels associated with inputs (for/id)
- [ ] Error messages associated with fields (aria-describedby)
- [ ] Images have alt text (if applicable)
- [ ] Color not sole indicator of status (use text + icons)

---

## DATABASE STATE CHECKS

- [ ] deals table: user_id, title, address, price, status, description, timestamps
- [ ] notes table: deal_id, content, user_id, created_at
- [ ] deal_files table: deal_id, storage_path, signed URLs valid
- [ ] investors table: user_id, name, email, phone, budget, strategy, tags
- [ ] investor_listing_matches table: match scores, sub-scores
- [ ] opportunity_scores table: listing_id, strategy_slug, user_id, score data, UNIQUE constraint on (user_id, listing_id, strategy_slug)
- [ ] strategy_fit_scores table: scores for retail, warehouse, rental, food, pharmacy, gym
- [ ] listing_ai_summaries table: headline, investor_angle, key_insights
- [ ] location_insights table: demographics, foot traffic, competition, nearby businesses
- [ ] investor_om_sends table: tracking_token, om_sent_at, om_opened_at (updates on pixel hit)

---

## NOTES FOR TESTER

1. **Test Data:** Use seed buttons (demo investors, demo locations) to quickly populate DB
2. **OLX Integration:** Requires active OLX API key; test with saved mock listings first
3. **Resend Email:** Check email inbox for OM emails; spam folder if not seen
4. **Location Enrichment:** Requires active Google Places API key; mock data works offline
5. **Scoring:** Always enrich location first, then select strategy to trigger scoring
6. **Matches:** Investors must have strategy + budget + property_type set for good matches
7. **OM Tracking:** Open OM email link in new tab; pixel fires in background
8. **Decision Surface:** Requires ≥1 listing with location insight + strategy scores
9. **Storage:** Check Supabase Storage for deal-files and om-images buckets
10. **Clerk Integration:** User data syncs via Clerk webhooks; check Clerk dashboard if sync fails

