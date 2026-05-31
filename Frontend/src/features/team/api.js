import { api } from '@/lib/api'

// --- Member management (admin only) ---
export async function updateMemberRole(workspaceId, userId, role) {
  const { data } = await api.patch(
    `/workspaces/${workspaceId}/members/${userId}`,
    { role },
  )
  return data
}

export async function removeMember(workspaceId, userId) {
  await api.delete(`/workspaces/${workspaceId}/members/${userId}`)
}

// --- Invitations (admin only) ---
export async function fetchInvitations(workspaceId) {
  const { data } = await api.get(`/workspaces/${workspaceId}/invitations`)
  return data
}

export async function createInvitation(workspaceId, { email, role }) {
  const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, {
    email,
    role,
  })
  return data
}

export async function revokeInvitation(workspaceId, invitationId) {
  await api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`)
}
