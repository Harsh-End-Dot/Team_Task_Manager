import { api } from '@/lib/api'

// All endpoints live under /workspaces/{id}/projects. ProjectResponse:
//   { id, workspace_id, name, description, due_date, deleted_at, created_at }

// GET /workspaces/{id}/projects → ProjectResponse[] (non-deleted).
export async function fetchProjects(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/projects`)
  return data
}

// GET /workspaces/{id}/projects/trash → ProjectResponse[] (soft-deleted, admin).
export async function fetchProjectTrash(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/projects/trash`)
  return data
}

// POST /workspaces/{id}/projects (admin) → ProjectResponse (201).
// payload: { name, description?, due_date? }
export async function createProject(workspaceId, payload) {
  const { data } = await api.post(`/workspaces/${workspaceId}/projects`, payload)
  return data
}

// PATCH /workspaces/{id}/projects/{pid} (admin) → ProjectResponse.
export async function updateProject(workspaceId, projectId, payload) {
  const { data } = await api.patch(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    payload,
  )
  return data
}

// DELETE /workspaces/{id}/projects/{pid} (admin) → 204 (soft delete).
export async function deleteProject(workspaceId, projectId) {
  await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`)
}

// POST /workspaces/{id}/projects/{pid}/restore (admin) → ProjectResponse.
export async function restoreProject(workspaceId, projectId) {
  const { data } = await api.post(
    `/workspaces/${workspaceId}/projects/${projectId}/restore`,
  )
  return data
}
