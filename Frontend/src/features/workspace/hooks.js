import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createWorkspace, fetchMembers, fetchWorkspaces } from './api'

export const workspacesKey = ['workspaces']
export const membersKey = (workspaceId) => ['members', workspaceId]

// All workspaces the current user is a member of.
export function useWorkspaces() {
  return useQuery({ queryKey: workspacesKey, queryFn: fetchWorkspaces })
}

// Memberships of a workspace (user_id + role), keyed by workspace id.
export function useMembers(workspaceId) {
  return useQuery({
    queryKey: membersKey(workspaceId),
    queryFn: () => fetchMembers(workspaceId),
    enabled: Boolean(workspaceId),
  })
}

// Create a workspace and optimistically append it to the cached list so the
// switcher reflects it immediately (the caller can then select it).
export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => {
      queryClient.setQueryData(workspacesKey, (prev) =>
        prev ? [...prev, workspace] : [workspace],
      )
    },
  })
}
