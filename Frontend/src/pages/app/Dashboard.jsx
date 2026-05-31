import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  FolderPlus,
  Inbox,
  Layers,
  ListChecks,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useDashboard } from '@/features/dashboard/hooks'
import { Stagger, StaggerItem } from '@/components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DueGroup,
  EmptyHint,
  ProjectProgressRow,
  StatCard,
  TaskRow,
} from '@/features/dashboard/components'
import { StatusDonut } from '@/features/dashboard/StatusDonut'
import { DashboardSkeleton } from '@/features/dashboard/DashboardSkeleton'

const LIST_CAP = 6

function Header({ firstName, workspaceName }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome back{firstName ? `, ${firstName}` : ''}
      </h1>
      {workspaceName && (
        <p className="text-sm text-muted-foreground">{workspaceName}</p>
      )}
    </div>
  )
}

/** Card with an icon'd title and arbitrary body. */
function PanelCard({ icon: Icon, title, count, className, children }) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="size-4 text-primary" />}
          {title}
        </CardTitle>
        {count != null && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function TaskList({ tasks, overdue = false, emptyIcon, emptyText }) {
  if (!tasks.length) return <EmptyHint icon={emptyIcon}>{emptyText}</EmptyHint>
  return (
    <>
      <ul className="space-y-0.5">
        {tasks.slice(0, LIST_CAP).map((t) => (
          <TaskRow key={t.id} task={t} overdue={overdue} />
        ))}
      </ul>
      {tasks.length > LIST_CAP && (
        <p className="mt-2 px-2.5 text-xs text-muted-foreground/70">
          +{tasks.length - LIST_CAP} more
        </p>
      )}
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { currentWorkspace, currentWorkspaceId } = useWorkspace()
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDashboard(currentWorkspaceId)

  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : ''
  const workspaceName = currentWorkspace?.name

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header firstName={firstName} workspaceName={workspaceName} />
        <DashboardSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Header firstName={firstName} workspaceName={workspaceName} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <div>
              <p className="font-medium">Couldn&apos;t load your dashboard</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error?.message || 'Something went wrong.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    status_counts: counts,
    overdue,
    my_tasks: myTasks,
    project_progress: projects,
    due_today: dueToday,
    due_this_week: dueThisWeek,
  } = data

  const total = counts.TODO + counts.IN_PROGRESS + counts.DONE
  const isEmpty = total === 0 && projects.length === 0

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <Header firstName={firstName} workspaceName={workspaceName} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground shadow-[0_10px_40px_-12px_hsl(var(--primary))]">
              <FolderPlus className="size-7" />
            </span>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Nothing here yet
            </h2>
            <p className="max-w-sm text-pretty text-sm text-muted-foreground">
              This workspace has no projects or tasks yet. Create your first
              project to start tracking work on your dashboard.
            </p>
            <Link
              to="/app/projects"
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <Plus className="size-4" />
              Create a project
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Stagger className="space-y-5">
      <StaggerItem>
        <Header firstName={firstName} workspaceName={workspaceName} />
      </StaggerItem>

      {/* Summary stats */}
      <StaggerItem>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Circle}
            label="To do"
            value={counts.TODO}
            accent="bg-secondary/70 text-muted-foreground"
          />
          <StatCard
            icon={Clock}
            label="In progress"
            value={counts.IN_PROGRESS}
            accent="bg-primary/15 text-primary"
          />
          <StatCard
            icon={CheckCircle2}
            label="Done"
            value={counts.DONE}
            accent="bg-brand-bloom/15 text-brand-bloom"
          />
          <StatCard
            icon={Layers}
            label="Total tasks"
            value={total}
            accent="bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground"
          />
        </div>
      </StaggerItem>

      {/* Chart + project progress */}
      <StaggerItem>
        <div className="grid gap-5 lg:grid-cols-3">
          <PanelCard icon={PieChartIcon} title="Tasks by status">
            {total ? (
              <StatusDonut counts={counts} />
            ) : (
              <EmptyHint icon={Inbox}>No tasks to chart yet.</EmptyHint>
            )}
          </PanelCard>

          <PanelCard
            icon={FolderKanban}
            title="Project progress"
            className="lg:col-span-2"
          >
            {projects.length ? (
              <div className="space-y-4">
                {projects.map((p) => (
                  <ProjectProgressRow key={p.project_id} item={p} />
                ))}
              </div>
            ) : (
              <EmptyHint icon={FolderPlus}>No projects yet.</EmptyHint>
            )}
          </PanelCard>
        </div>
      </StaggerItem>

      {/* Overdue / My tasks / Due soon */}
      <StaggerItem>
        <div className="grid gap-5 lg:grid-cols-3">
          <PanelCard icon={AlertCircle} title="Overdue" count={overdue.length}>
            <TaskList
              tasks={overdue}
              overdue
              emptyIcon={CheckCircle2}
              emptyText="Nothing overdue. Nice."
            />
          </PanelCard>

          <PanelCard icon={ListChecks} title="My tasks" count={myTasks.length}>
            <TaskList
              tasks={myTasks}
              emptyIcon={Inbox}
              emptyText="No tasks assigned to you."
            />
          </PanelCard>

          <PanelCard icon={Calendar} title="Due soon">
            <div className="space-y-5">
              <DueGroup label="Due today" tasks={dueToday} />
              <div className="h-px bg-border/60" />
              <DueGroup label="This week" tasks={dueThisWeek} />
            </div>
          </PanelCard>
        </div>
      </StaggerItem>

      {isFetching && (
        <p className="text-center text-xs text-muted-foreground/60">Updating…</p>
      )}
    </Stagger>
  )
}
