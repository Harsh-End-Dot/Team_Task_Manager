import { api } from '@/lib/api'

// GET /workspaces/{id}/dashboard → DashboardResponse:
//   { status_counts: { TODO, IN_PROGRESS, DONE },
//     overdue: TaskSummary[], my_tasks: TaskSummary[],
//     project_progress: { project_id, name, total_tasks, done_tasks, percent }[],
//     due_today: TaskSummary[], due_this_week: TaskSummary[] }
// TaskSummary = { id, project_id, title, status, priority, due_date, assignee_id }
export async function fetchDashboard(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/dashboard`)
  return data
}
