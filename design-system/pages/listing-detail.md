# Listing Detail Page — Design Overrides

Inherits from `MASTER.md`. Only deviations listed here.

## Layout

```
┌─────────────────────────────────┐
│ Image gallery (hero, max 400px) │
├───────────────────┬─────────────┤
│ Listing info      │ Score card  │
│ Address/specs     │ Strategy    │
│ Location insight  │ breakdown   │
└───────────────────┴─────────────┘
```

## Score Card

- Strategy tabs: Café / Logística / Farmácia / Varejo / Serviços
- Active tab highlights selected strategy
- Score ring or progress bar: large number + colored bar per MASTER.md thresholds
- Breakdown: labeled rows with individual sub-scores (0–100 each)
- "Create Deal" CTA button at bottom of score card

## Location Insight

- Demographics chip strip: pop density, income level, foot traffic
- Nearby businesses: grouped by category, count badges
- Map thumbnail if available (placeholder if not)
- Computed insight date: `text-xs text-muted-foreground` — "Updated X days ago"

## Image Gallery

- Horizontal scroll strip on mobile
- Grid (3-col) on desktop with lightbox on click
- Fallback: placeholder with building icon if no images
- `next/image` with `fill` + `object-cover`, lazy loading
