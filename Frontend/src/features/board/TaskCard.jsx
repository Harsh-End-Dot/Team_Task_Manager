import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, CheckSquare } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PriorityBadge } from '@/features/dashboard/components'
import { formatDue } from '@/features/dashboard/meta'
import { AssigneeAvatar } from './Avatar'
import { LabelChip } from './LabelChip'

const MAX_CHIPS = 3

/** Presentational card - used both inside the column and in the DragOverlay. */
export function TaskCardView({ task, me, directory, dragging = false, overlay = false }) {
  const due = formatDue(task.due_date)
  const subtasks = task.subtasks ?? []
  const doneSubtasks = subtasks.filter((s) => s.is_done).length
  const labels = task.labels ?? []

  return (
    <div
      className={cn(
        'group rounded-xl border border-border/70 bg-card p-3 text-left shadow-sm transition-colors',
        overlay
          ? 'rotate-2 cursor-grabbing border-primary/50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]'
          : 'cursor-grab hover:border-primary/40 active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      {labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {labels.slice(0, MAX_CHIPS).map((l) => (
            <LabelChip key={l.id} label={l} />
          ))}
          {labels.length > MAX_CHIPS && (
            <span className="text-[10px] text-muted-foreground/70">
              +{labels.length - MAX_CHIPS}
            </span>
          )}
        </div>
      )}

      <p className="text-sm font-medium leading-snug text-foreground">
        {task.title}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CheckSquare className="size-3" />
            {doneSubtasks}/{subtasks.length}
          </span>
        )}
        {due && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="size-3" />
            {due}
          </span>
        )}
        <span className="ml-auto">
          <AssigneeAvatar
            assigneeId={task.assignee_id}
            me={me}
            directory={directory}
          />
        </span>
      </div>
    </div>
  )
}

/** Sortable wrapper: draggable in a column, clickable to open the detail view. */
export function SortableTaskCard({ task, me, directory, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen?.(task)
      }}
    >
      <TaskCardView task={task} me={me} directory={directory} dragging={isDragging} />
    </div>
  )
}
