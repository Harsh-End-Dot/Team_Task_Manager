import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dashboardKey } from '@/features/dashboard/hooks'
import {
  createProject,
  deleteProject,
  fetchProjectTrash,
  fetchProjects,
  restoreProject,
  updateProject,
} from './api'

export const projectsKey = (workspaceId) => ['projects', workspaceId]
export const projectTrashKey = (workspaceId) => ['projects', workspaceId, 'trash']

// Non-deleted projects in a workspace, keyed by workspace id.
export function useProjects(workspaceId) {
  return useQuery({
    queryKey: projectsKey(workspaceId),
    queryFn: () => fetchProjects(workspaceId),
    enabled: Boolean(workspaceId),
  })
}

// Soft-deleted projects (admin only). `enabled` lets the page defer the call
// until the Trash tab is opened.
export function useProjectTrash(workspaceId, enabled = true) {
  return useQuery({
    queryKey: projectTrashKey(workspaceId),
    queryFn: () => fetchProjectTrash(workspaceId),
    enabled: Boolean(workspaceId) && enabled,
  })
}

// After any mutation, refresh the active list, the trash list, and the
// dashboard (its per-project progress + counts depend on the project set).
function invalidateProjectViews(qc, workspaceId) {
  qc.invalidateQueries({ queryKey: projectsKey(workspaceId) })
  qc.invalidateQueries({ queryKey: projectTrashKey(workspaceId) })
  qc.invalidateQueries({ queryKey: dashboardKey(workspaceId) })
}

export function useCreateProject(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => createProject(workspaceId, payload),
    onSuccess: () => invalidateProjectViews(qc, workspaceId),
  })
}

export function useUpdateProject(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      updateProject(workspaceId, projectId, payload),
    onSuccess: () => invalidateProjectViews(qc, workspaceId),
  })
}

export function useDeleteProject(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId) => deleteProject(workspaceId, projectId),
    onSuccess: () => invalidateProjectViews(qc, workspaceId),
  })
}

export function useRestoreProject(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId) => restoreProject(workspaceId, projectId),
    onSuccess: () => invalidateProjectViews(qc, workspaceId),
  })
}
