import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'

import { useWorkspace } from '@/context/WorkspaceContext'
import { useAuth } from '@/context/AuthContext'
import { useMembers } from '@/features/workspace/hooks'
import { useUpdateMemberRole, useRemoveMember } from '@/features/team/hooks'
import { MemberCard } from '@/features/team/MemberCard'
import { InviteMemberDialog } from '@/features/team/InviteMemberDialog'
import { PendingInvitations } from '@/features/team/PendingInvitations'
import { AdminOnly } from '@/components/AdminOnly'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { Stagger, StaggerItem } from '@/components/motion'
import { useReducedMotion } from '@/components/motion/useReducedMotion'

const SkeletonCard = () => (
  <div className="rounded-2xl border border-border bg-card/60 p-5">
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  </div>
)

export default function Team() {
  const { currentWorkspaceId, currentWorkspace, isAdmin } = useWorkspace()
  const { user } = useAuth()
  const prefersReduced = useReducedMotion()
  const toast = useToast()

  const { data: members = [], isLoading, isError, refetch } = useMembers(
    currentWorkspaceId,
  )

  const updateRole = useUpdateMemberRole(currentWorkspaceId)
  const removeMember = useRemoveMember(currentWorkspaceId)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const adminCount = useMemo(
    () => members.filter((m) => m.role === 'ADMIN').length,
    [members],
  )

  const sorted = useMemo(() => {
    // You first, then admins, then by join order (created_at).
    return [...members].sort((a, b) => {
      if (a.user_id === user?.id) return -1
      if (b.user_id === user?.id) return 1
      if (a.role !== b.role) return a.role === 'ADMIN' ? -1 : 1
      return new Date(a.created_at) - new Date(b.created_at)
    })
  }, [members, user?.id])

  async function handleRoleChange(member, newRole) {
    if (newRole === member.role) return
    if (member.role === 'ADMIN' && newRole === 'MEMBER' && adminCount <= 1) {
      toast.error('Promote another member before demoting the last admin.')
      return
    }
    try {
      await updateRole.mutateAsync({ userId: member.user_id, role: newRole })
      toast.success(
        `${member.user?.name || 'Member'} is now ${
          newRole === 'ADMIN' ? 'an admin' : 'a member'
        }`,
      )
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not update role')
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return
    const member = removeTarget
    try {
      await removeMember.mutateAsync({ userId: member.user_id })
      toast.success(`${member.user?.name || 'Member'} removed`)
      setRemoveTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not remove member')
    }
  }

  if (!currentWorkspaceId) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Select a workspace to see its team.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header
          count={null}
          workspaceName={currentWorkspace?.name}
          isAdmin={isAdmin}
          onInvite={() => setInviteOpen(true)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-muted-foreground">Couldn&apos;t load the team.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <Header
          count={members.length}
          workspaceName={currentWorkspace?.name}
          isAdmin={isAdmin}
          onInvite={() => setInviteOpen(true)}
        />
        <Stagger
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          disabled={prefersReduced}
        >
          {sorted.map((m) => {
            const isYou = m.user_id === user?.id
            return (
              <StaggerItem key={m.user_id}>
                <MemberCard
                  member={m}
                  isYou={isYou}
                  canManage={isAdmin && !isYou}
                  isLastAdmin={m.role === 'ADMIN' && adminCount <= 1}
                  onRoleChange={(newRole) => handleRoleChange(m, newRole)}
                  onRemove={() => setRemoveTarget(m)}
                />
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>

      <AdminOnly>
        <PendingInvitations workspaceId={currentWorkspaceId} />
      </AdminOnly>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        workspaceId={currentWorkspaceId}
      />
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove member"
        message={
          removeTarget
            ? `Remove ${
                removeTarget.user?.name || removeTarget.user?.email || 'this member'
              } from ${currentWorkspace?.name}? They'll lose access to this workspace.`
            : ''
        }
        confirmLabel="Remove"
        danger
        busy={removeMember.isPending}
        onConfirm={handleConfirmRemove}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  )
}

function Header({ count, workspaceName, isAdmin, onInvite }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          {workspaceName ? `${workspaceName} · ` : ''}
          {count == null
            ? 'Loading members…'
            : `${count} member${count === 1 ? '' : 's'}`}
        </p>
      </div>
      {isAdmin && (
        <Button onClick={onInvite} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite member
        </Button>
      )}
    </div>
  )
}
