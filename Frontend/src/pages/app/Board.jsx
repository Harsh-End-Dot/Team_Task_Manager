import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { AlertCircle, FolderPlus, Plus, RefreshCw } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/apiError'
import { useProjects } from '@/features/projects/hooks'
import { useMembers } from '@/features/workspace/hooks'
import { useLabels } from '@/features/labels/hooks'
import {
  tasksKey,
  useReorderTask,
  useTasks,
  useUpdateTaskStatus,
} from '@/features/board/hooks'
import { COLUMN_ORDER, findContainer, groupByStatus } from '@/features/board/constants'
import { Column } from '@/features/board/Column'
import { TaskCardView } from '@/features/board/TaskCard'
import { BoardSkeleton } from '@/features/board/BoardSkeleton'
import { ProjectSelector } from '@/features/board/ProjectSelector'
import { CreateTaskDialog } from '@/features/board/CreateTaskDialog'
// The task detail panel is a sizable piece; load it on demand (first time a card
// is opened) as its own chunk.
const TaskDetailDialog = lazy(() =>
  import('@/features/board/TaskDetailDialog').then((m) => ({
    default: m.TaskDetailDialog,
  })),
)

const EMPTY_COLUMNS = { TODO: [], IN_PROGRESS: [], DONE: [] }

function findTaskById(columns, id) {
  for (const key of COLUMN_ORDER) {
    const found = columns[key].find((t) => t.id === id)
    if (found) return found
  }
  return null
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-16 text-center">
      <AlertCircle className="size-7 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  )
}

export default function Board() {
  const { user: me } = useAuth()
  const { currentWorkspaceId, isAdmin } = useWorkspace()
  const queryClient = useQueryClient()
  const toast = useToast()

  const projectsQuery = useProjects(currentWorkspaceId)
  const { data: members } = useMembers(currentWorkspaceId)
  const { data: labels = [] } = useLabels(currentWorkspaceId)

  // userId -> { name, email } so cards can show the assignee's name, not an id.
  const directory = useMemo(() => {
    const map = {}
    for (const m of members ?? []) if (m.user) map[m.user_id] = m.user
    return map
  }, [members])

  const projects = projectsQuery.data ?? []
  // Deep link from the Projects page: /app/board?project=<id> preselects it.
  const [searchParams] = useSearchParams()
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const requestedId = selectedProjectId ?? searchParams.get('project')
  const currentProjectId =
    projects.find((p) => p.id === requestedId)?.id ?? projects[0]?.id ?? null

  const tasksQuery = useTasks(currentProjectId)
  const statusMut = useUpdateTaskStatus()
  const reorderMut = useReorderTask()

  const [columns, setColumns] = useState(EMPTY_COLUMNS)
  const [activeId, setActiveId] = useState(null)
  const activeSnapshot = useRef(null)
  const [createStatus, setCreateStatus] = useState(null) // null = closed
  const [detailTask, setDetailTask] = useState(null)

  // Reconcile local board state with the server during render whenever the task
  // list identity changes (React's "adjust state when input changes" pattern -
  // no effect). We never refetch mid-drag, so this can't clobber a drag.
  const [syncedData, setSyncedData] = useState(null)
  if (tasksQuery.data && tasksQuery.data !== syncedData) {
    setSyncedData(tasksQuery.data)
    setColumns(groupByStatus(tasksQuery.data))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const rollback = (err, fallback) => {
    toast.error(getErrorMessage(err, fallback))
    queryClient.invalidateQueries({ queryKey: tasksKey(currentProjectId) })
  }

  function handleDragStart(event) {
    const id = event.active.id
    setActiveId(id)
    activeSnapshot.current = findTaskById(columns, id)
  }

  function handleDragOver(event) {
    const { active, over } = event
    if (!over) return
    const activeC = findContainer(columns, active.id)
    const overC = findContainer(columns, over.id)
    if (!activeC || !overC || activeC === overC) return

    setColumns((prev) => {
      const activeItems = prev[activeC]
      const overItems = prev[overC]
      const activeIndex = activeItems.findIndex((t) => t.id === active.id)
      if (activeIndex < 0) return prev
      const moved = activeItems[activeIndex]
      let overIndex
      if (COLUMN_ORDER.includes(over.id)) {
        overIndex = overItems.length
      } else {
        const idx = overItems.findIndex((t) => t.id === over.id)
        overIndex = idx >= 0 ? idx : overItems.length
      }
      return {
        ...prev,
        [activeC]: activeItems.filter((t) => t.id !== active.id),
        [overC]: [
          ...overItems.slice(0, overIndex),
          { ...moved, status: overC },
          ...overItems.slice(overIndex),
        ],
      }
    })
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    const snapshot = activeSnapshot.current
    activeSnapshot.current = null
    if (!over || !snapshot) return

    const activeC = findContainer(columns, active.id)
    const overC = findContainer(columns, over.id)
    if (!activeC || !overC) return

    // Cross-column → status change (assignee/admin only; 403 rolls back).
    if (overC !== snapshot.status) {
      setColumns((prev) => ({
        ...prev,
        [overC]: prev[overC].map((t) =>
          t.id === active.id ? { ...t, status: overC } : t,
        ),
      }))
      statusMut.mutate(
        { taskId: active.id, status: overC },
        { onError: (err) => rollback(err, 'Could not move task.') },
      )
      return
    }

    // Same column → reorder by position.
    const items = columns[activeC]
    const oldIndex = items.findIndex((t) => t.id === active.id)
    let newIndex = COLUMN_ORDER.includes(over.id)
      ? items.length - 1
      : items.findIndex((t) => t.id === over.id)
    if (newIndex < 0) newIndex = items.length - 1
    if (oldIndex === newIndex) return

    setColumns((prev) => ({ ...prev, [activeC]: arrayMove(items, oldIndex, newIndex) }))
    reorderMut.mutate(
      { taskId: active.id, position: newIndex },
      { onError: (err) => rollback(err, 'Could not reorder task.') },
    )
  }

  // Create controls are hidden for non-admins (below); this stays defensive.
  function openCreate(status) {
    if (!isAdmin) return
    setCreateStatus(status)
  }

  // --- render gates ---
  if (projectsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Board</h1>
        <BoardSkeleton />
      </div>
    )
  }

  if (projectsQuery.isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Board</h1>
        <ErrorCard
          message="Couldn't load projects."
          onRetry={() => projectsQuery.refetch()}
        />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Board</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/30 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground shadow-[0_10px_40px_-12px_hsl(var(--primary))]">
            <FolderPlus className="size-7" />
          </span>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">No projects yet</h2>
          <p className="max-w-sm text-pretty text-sm text-muted-foreground">
            Create a project to start planning work on the board.
          </p>
          <Link
            to="/app/projects"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-4" />
            Go to projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Board</h1>
        <div className="ml-auto flex items-center gap-2">
          <ProjectSelector
            projects={projects}
            currentId={currentProjectId}
            onSelect={setSelectedProjectId}
          />
          {isAdmin && (
            <button
              type="button"
              onClick={() => openCreate('TODO')}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_30px_-12px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5"
            >
              <Plus className="size-4" />
              New task
            </button>
          )}
        </div>
      </div>

      {/* Board body */}
      {tasksQuery.isLoading ? (
        <BoardSkeleton />
      ) : tasksQuery.isError ? (
        <ErrorCard
          message="Couldn't load tasks for this project."
          onRetry={() => tasksQuery.refetch()}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null)
            activeSnapshot.current = null
          }}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMN_ORDER.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={columns[status]}
                me={me}
                directory={directory}
                canAdd={isAdmin}
                onOpenTask={setDetailTask}
                onAddTask={openCreate}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <TaskCardView
                task={findTaskById(columns, activeId)}
                me={me}
                directory={directory}
                overlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateTaskDialog
        open={createStatus !== null}
        onOpenChange={(v) => setCreateStatus(v ? createStatus : null)}
        projectId={currentProjectId}
        initialStatus={createStatus ?? 'TODO'}
        members={members ?? []}
        me={me}
        labels={labels}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: tasksKey(currentProjectId) })
        }
      />

      {detailTask && (
        <Suspense fallback={null}>
          <TaskDetailDialog
            open
            task={detailTask}
            labels={labels}
            onOpenChange={(v) => {
              if (!v) setDetailTask(null)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
