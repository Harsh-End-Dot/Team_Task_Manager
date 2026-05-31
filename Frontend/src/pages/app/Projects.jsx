import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, FolderPlus, Plus, RefreshCw, Trash2, FolderKanban } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/apiError'
import { useDashboard } from '@/features/dashboard/hooks'
import {
  useProjects,
  useProjectTrash,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useRestoreProject,
} from '@/features/projects/hooks'
import { ProjectCard } from '@/features/projects/ProjectCard'
import { ProjectFormDialog } from '@/features/projects/ProjectFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Stagger, StaggerItem } from '@/components/motion'

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
      <div className="h-5 w-2/3 animate-pulse rounded bg-secondary/60" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-secondary/60" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-secondary/60" />
      <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-secondary/60" />
      <div className="mt-4 h-3 w-24 animate-pulse rounded bg-secondary/60" />
    </div>
  )
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  )
}

export default function Projects() {
  const { currentWorkspaceId, isAdmin } = useWorkspace()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState('active') // 'active' | 'trash'
  const [formProject, setFormProject] = useState(null) // editing target
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const projectsQuery = useProjects(currentWorkspaceId)
  const dashboardQuery = useDashboard(currentWorkspaceId)
  // Trash is admin-only; only fetch when an admin opens that tab.
  const trashQuery = useProjectTrash(
    currentWorkspaceId,
    isAdmin && tab === 'trash',
  )

  const createMut = useCreateProject(currentWorkspaceId)
  const updateMut = useUpdateProject(currentWorkspaceId)
  const deleteMut = useDeleteProject(currentWorkspaceId)
  const restoreMut = useRestoreProject(currentWorkspaceId)

  // Per-project progress comes from the dashboard's project_progress (one call).
  const progressById = useMemo(() => {
    const map = {}
    for (const p of dashboardQuery.data?.project_progress ?? []) {
      map[p.project_id] = p
    }
    return map
  }, [dashboardQuery.data])

  const projects = projectsQuery.data ?? []

  function openCreate() {
    setFormProject(null)
    setFormOpen(true)
  }
  function openEdit(project) {
    setFormProject(project)
    setFormOpen(true)
  }
  function openBoard(project) {
    navigate(`/app/board?project=${project.id}`)
  }

  async function submitForm(payload) {
    if (formProject) {
      await updateMut.mutateAsync({ projectId: formProject.id, payload })
      toast.success('Project updated.')
    } else {
      await createMut.mutateAsync(payload)
      toast.success('Project created.')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('Project moved to trash.')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the project.'))
    }
  }

  async function restore(project) {
    try {
      await restoreMut.mutateAsync(project.id)
      toast.success('Project restored.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not restore the project.'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Plan and track work across your team’s projects.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreate}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-[0_8px_30px_-12px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-4" />
            New project
          </button>
        )}
      </div>

      {/* Tabs (admin only - members have no trash) */}
      {isAdmin && (
        <div className="flex gap-1 border-b border-border/60">
          <TabButton active={tab === 'active'} onClick={() => setTab('active')}>
            <FolderKanban className="size-4" />
            Active
          </TabButton>
          <TabButton active={tab === 'trash'} onClick={() => setTab('trash')}>
            <Trash2 className="size-4" />
            Trash
          </TabButton>
        </div>
      )}

      {tab === 'active' ? (
        <ActiveView
          query={projectsQuery}
          projects={projects}
          progressById={progressById}
          isAdmin={isAdmin}
          onOpen={openBoard}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onCreate={openCreate}
        />
      ) : (
        <TrashView query={trashQuery} onRestore={restore} />
      )}

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={formProject}
        onSubmit={submitForm}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project?"
        message={
          deleteTarget
            ? `“${deleteTarget.name}” and its tasks will be moved to trash. You can restore it later.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleteMut.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        '-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
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

function ActiveView({
  query,
  projects,
  progressById,
  isAdmin,
  onOpen,
  onEdit,
  onDelete,
  onCreate,
}) {
  if (query.isLoading) {
    return (
      <Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Grid>
    )
  }
  if (query.isError) {
    return (
      <ErrorCard message="Couldn't load projects." onRetry={() => query.refetch()} />
    )
  }
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/30 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground shadow-[0_10px_40px_-12px_hsl(var(--primary))]">
          <FolderPlus className="size-7" />
        </span>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">No projects yet</h2>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">
          {isAdmin
            ? 'Create your first project to start planning work.'
            : 'No projects have been created in this workspace yet.'}
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={onCreate}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <Plus className="size-4" />
            New project
          </button>
        )}
      </div>
    )
  }

  return (
    <Stagger>
      <Grid>
        {projects.map((p) => (
          <StaggerItem key={p.id} className="h-full">
            <ProjectCard
              project={p}
              progress={progressById[p.id]}
              canManage={isAdmin}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </StaggerItem>
        ))}
      </Grid>
    </Stagger>
  )
}

function TrashView({ query, onRestore }) {
  if (query.isLoading) {
    return (
      <Grid>
        {Array.from({ length: 2 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Grid>
    )
  }
  if (query.isError) {
    return (
      <ErrorCard message="Couldn't load trash." onRetry={() => query.refetch()} />
    )
  }
  const trashed = query.data ?? []
  if (trashed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/30 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
          <Trash2 className="size-6" />
        </span>
        <p className="text-sm text-muted-foreground">Trash is empty.</p>
      </div>
    )
  }
  return (
    <Stagger>
      <Grid>
        {trashed.map((p) => (
          <StaggerItem key={p.id} className="h-full">
            <ProjectCard project={p} trashed canManage onRestore={onRestore} />
          </StaggerItem>
        ))}
      </Grid>
    </Stagger>
  )
}
