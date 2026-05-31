import { api } from '@/lib/api'

// GET /workspaces → [{ id, name, created_at }] - the workspaces the caller belongs to.
export async function fetchWorkspaces() {
  const { data } = await api.get('/workspaces')
  return data
}

// POST /workspaces { name } → { id, name, created_at } (201). Creator becomes ADMIN.
export async function createWorkspace({ name }) {
  const { data } = await api.post('/workspaces', { name })
  return data
}

// GET /workspaces/{id}/members → MembershipResponse[]:
//   { id, workspace_id, user_id, role, created_at }
// NOTE: the backend does not expose member names/emails here yet (Phase 9 / team).
export async function fetchMembers(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/members`)
  return data
}
