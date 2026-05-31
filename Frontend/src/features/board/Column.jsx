import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { STATUS_META } from '@/features/dashboard/meta'
import { SortableTaskCard } from './TaskCard'

/** One Kanban column: a droppable container wrapping a sortable task list. */
export function Column({ status, tasks, me, canAdd = false, onOpenTask, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = STATUS_META[status] ?? STATUS_META.TODO

  return (
    <div className="flex w-72 shrink-0 flex-col sm:w-80">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn('size-2 rounded-full', meta.dot)} />
        <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
        {canAdd && (
          <button
            type="button"
            onClick={() => onAddTask(status)}
            aria-label={`Add task to ${meta.label}`}
            className="ml-auto rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[8rem] flex-1 flex-col gap-2 rounded-xl border border-border/50 bg-secondary/20 p-2 transition-colors',
          isOver && 'border-primary/50 bg-primary/5',
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              me={me}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 &&
          (canAdd ? (
            <button
              type="button"
              onClick={() => onAddTask(status)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-8 text-xs text-muted-foreground/70 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Add task
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/40 py-8 text-xs text-muted-foreground/50">
              No tasks
            </div>
          ))}
      </div>
    </div>
  )
}
