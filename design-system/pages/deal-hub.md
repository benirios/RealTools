# Deal Hub Page — Design Overrides

Inherits from `MASTER.md`. Only deviations listed here.

## Layout

```
┌────────────────────────────────────┐
│ Deal header: name, status, actions │  ← sticky
├────────────────┬───────────────────┤
│ Main (2/3)     │ Sidebar (1/3)     │
│ ─ Property info│ ─ Investors       │
│ ─ Notes        │ ─ Files           │
│ ─ Activity log │ ─ OM links        │
└────────────────┴───────────────────┘
```

## Deal Header (Sticky)

- Background: `bg-card/95 backdrop-blur-sm border-b`
- Left: deal name (`text-xl font-semibold`) + status badge
- Right: action buttons — "Add Note", "Generate OM", "Update Status"
- Status change: `AlertDialog` confirmation for terminal states (Fechado/Perdido)

## Notes Section

- Chronological list, newest first
- Each note: avatar/initials + author + time-ago + body
- Body: `whitespace-pre-wrap text-sm` — preserve line breaks
- Add note: inline textarea (not modal) that expands on focus

## Activity Log

- Timeline visual: left border line + dot per event
- Dot color matches event type (note=blue, status=teal, file=gray, OM=amber)
- Compact: author + action phrase + object + timestamp

## Investor Sidebar

- Ranked match list with score pill
- "Send OM" button per investor → triggers email flow
- "Track opens" badge if OM sent: shows open count + last opened time
