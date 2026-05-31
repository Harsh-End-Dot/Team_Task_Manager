import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { membersKey } from '@/features/workspace/hooks'
import {
  createInvitation,
  fetchInvitations,
  removeMember,
  revokeInvitation,
  updateMemberRole,
} from './api'

export const invitationsKey = (id) => ['workspaces', id, 'invitations']

// --- Members ---

// Optimistically patches a member's role in the cached members list, rolling
// back if the request fails. The component surfaces the error via a toast.
export function useUpdateMemberRole(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }) =>
      updateMemberRole(workspaceId, userId, role),
    onMutate: async ({ userId, role }) => {
      await qc.cancelQueries({ queryKey: membersKey(workspaceId) })
      const previous = qc.getQueryData(membersKey(workspaceId))
      qc.setQueryData(membersKey(workspaceId), (old) =>
        (old ?? []).map((m) => (m.user_id === userId ? { ...m, role } : m)),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(membersKey(workspaceId), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: membersKey(workspaceId) })
    },
  })
}

export function useRemoveMember(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }) => removeMember(workspaceId, userId),
    onMutate: async ({ userId }) => {
      await qc.cancelQueries({ queryKey: membersKey(workspaceId) })
      const previous = qc.getQueryData(membersKey(workspaceId))
      qc.setQueryData(membersKey(workspaceId), (old) =>
        (old ?? []).filter((m) => m.user_id !== userId),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(membersKey(workspaceId), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: membersKey(workspaceId) })
    },
  })
}

// --- Invitations ---

export function useInvitations(workspaceId, enabled = true) {
  return useQuery({
    queryKey: invitationsKey(workspaceId),
    queryFn: () => fetchInvitations(workspaceId),
    enabled: Boolean(workspaceId) && enabled,
  })
}

export function useCreateInvitation(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => createInvitation(workspaceId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invitationsKey(workspaceId) })
    },
  })
}

export function useRevokeInvitation(workspaceId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invitationId }) =>
      revokeInvitation(workspaceId, invitationId),
    onMutate: async ({ invitationId }) => {
      await qc.cancelQueries({ queryKey: invitationsKey(workspaceId) })
      const previous = qc.getQueryData(invitationsKey(workspaceId))
      qc.setQueryData(invitationsKey(workspaceId), (old) =>
        (old ?? []).filter((i) => i.id !== invitationId),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(invitationsKey(workspaceId), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: invitationsKey(workspaceId) })
    },
  })
}
