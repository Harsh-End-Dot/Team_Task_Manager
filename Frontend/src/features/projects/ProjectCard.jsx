import { CalendarDays, MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDue } from '@/features/dashboard/meta'
import { DropdownMenu } from '@/components/DropdownMenu'

/**
 * One project card. `progress` is the dashboard's per-project item
 * ({ total_tasks, done_tasks, percent }) or undefined while it loads.
 * `trashed` switches the card to the restore-only variant.
 */
export function ProjectCard({
  project,
  progress,
  canManage = false,
  trashed = false,
  onOpen,
  onEdit,
  onDelete,
  onRestore,
}) {
  const due = formatDue(project.due_date)
  const pct = progress ? Math.round(progress.percent) : 0

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm transition-colors',
        !trashed && 'cursor-pointer hover:border-primary/40',
        trashed && 'opacity-90',
      )}
      onClick={!trashed ? () => onOpen?.(project) : undefined}
      role={!trashed ? 'button' : undefined}
      tabIndex={!trashed ? 0 : undefined}
      onKeyDown={
        !trashed
          ? (e) => {
              if (e.key === 'Enter') onOpen?.(project)
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
          {project.name}
        </h3>

        {canManage && !trashed && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              align="end"
              className="min-w-[10rem]"
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Project actions"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  <MoreVertical className="size-4" />
                </button>
              )}
            >
              {({ close }) => (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close()
                      onEdit?.(project)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/70"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close()
                      onDelete?.(project)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </>
              )}
            </DropdownMenu>
          </div>
        )}

        {canManage && trashed && (
          <button
            type="button"
            onClick={() => onRestore?.(project)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/60"
          >
            <RotateCcw className="size-3.5" />
            Restore
          </button>
        )}
      </div>

      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
        {project.description || 'No description.'}
      </p>

      {!trashed && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="tabular-nums text-muted-foreground">
              {progress ? `${progress.done_tasks}/${progress.total_tasks} · ` : ''}
              {pct}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-brand-bloom transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        {due ? (
          <>
            <CalendarDays className="size-3.5" />
            <span>Due {due}</span>
          </>
        ) : (
          <span className="text-muted-foreground/60">No due date</span>
        )}
      </div>
    </div>
  )
}
