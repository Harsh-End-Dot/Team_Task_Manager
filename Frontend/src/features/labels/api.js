import { api } from '@/lib/api'

// GET /workspaces/{id}/labels → LabelResponse[]: { id, workspace_id, name, color }
export async function fetchLabels(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/labels`)
  return data
}
