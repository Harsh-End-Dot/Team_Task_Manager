// Status/priority display metadata + helpers shared across dashboard components.
// Kept in a plain .js module (no components) so fast-refresh stays happy.

export const STATUS_META = {
  TODO: {
    label: 'To do',
    dot: 'bg-muted-foreground',
    badge: 'border-border bg-secondary/60 text-muted-foreground',
  },
  IN_PROGRESS: {
    label: 'In progress',
    dot: 'bg-primary',
    badge: 'border-primary/30 bg-primary/15 text-primary',
  },
  DONE: {
    label: 'Done',
    dot: 'bg-brand-bloom',
    badge: 'border-brand-bloom/30 bg-brand-bloom/15 text-brand-bloom',
  },
}

export const PRIORITY_META = {
  LOW: { label: 'Low', badge: 'border-border bg-secondary/40 text-muted-foreground' },
  MEDIUM: { label: 'Medium', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  HIGH: { label: 'High', badge: 'border-red-500/30 bg-red-500/10 text-red-300' },
}

/** Format a backend date string ("YYYY-MM-DD") as e.g. "May 30". */
export function formatDue(due) {
  if (!due) return null
  const d = new Date(`${due}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
