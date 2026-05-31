import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PRIORITY_META, STATUS_META, formatDue } from './meta'

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] ?? STATUS_META.TODO
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.MEDIUM
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
        meta.badge,
      )}
    >
      {meta.label}
    </span>
  )
}

/** Top summary stat card (To do / In progress / Done / Total). */
export function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/10 blur-2xl"
      />
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            accent,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight tracking-tight">{value}</p>
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/** A labelled progress bar for one project's % done. */
export function ProjectProgressRow({ item }) {
  const pct = Math.round(item.percent)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
          {item.name}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {item.done_tasks}/{item.total_tasks} · {pct}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={item.name}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-brand-bloom transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** One task row: title + priority + status badge + due date. */
export function TaskRow({ task, overdue = false }) {
  const due = formatDue(task.due_date)
  const meta = STATUS_META[task.status] ?? STATUS_META.TODO
  return (
    <li className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/40">
      <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {task.title}
      </span>
      <PriorityBadge priority={task.priority} />
      <StatusBadge status={task.status} className="hidden sm:inline-flex" />
      {due && (
        <span
          className={cn(
            'shrink-0 text-xs tabular-nums',
            overdue ? 'text-red-400' : 'text-muted-foreground',
          )}
        >
          {due}
        </span>
      )}
    </li>
  )
}

/** Friendly inline empty state for a list/panel. */
export function EmptyHint({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
      {Icon && <Icon className="size-5 text-muted-foreground/60" />}
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

/** Compact "due today / this week" group: a count + a short title list. */
export function DueGroup({ label, tasks }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      {tasks.length ? (
        <ul className="mt-2 space-y-1.5">
          {tasks.slice(0, 4).map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.TODO
            return (
              <li
                key={t.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} />
                <span className="truncate">{t.title}</span>
              </li>
            )
          })}
          {tasks.length > 4 && (
            <li className="pl-3.5 text-xs text-muted-foreground/70">
              +{tasks.length - 4} more
            </li>
          )}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground/70">Nothing due.</p>
      )}
    </div>
  )
}
