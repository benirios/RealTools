# Dashboard Page — Design Overrides

Inherits from `MASTER.md`. Only deviations listed here.

## Layout Override

4-column metric strip at top, then 2-column split (pipeline + activity).

```
┌──────┬──────┬──────┬──────┐
│ Deals│ Pipe │Score │Opens │  ← metric cards
└──────┴──────┴──────┴──────┘
┌─────────────┬──────────────┐
│ Deal pipeline│ Recent activity│
└─────────────┴──────────────┘
```

## Metric Cards

- Large number: `text-3xl font-bold`
- Delta badge: green up / red down arrow with `text-xs`
- Icon: 20px Lucide, `text-muted-foreground`, top-right of card

## Pipeline Column

- Kanban-style grouped by status OR compact table — broker's choice via toggle
- Each row: deal name, property address, stage badge, value (BRL), last activity date
- Row click → navigate to `/deals/[id]`

## Activity Feed

- Reverse chronological, max 20 items
- Actor + action + target + time-ago
- Icons per action type (note, status change, file upload, OM sent, open tracked)
