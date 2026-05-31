import { Mail, X } from 'lucide-react'

import { RoleBadge } from '@/components/RoleBadge'
import { useToast } from '@/hooks/useToast'
import { useInvitations, useRevokeInvitation } from './hooks'

function formatExpiry(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Admin-only list of unaccepted invitations with a revoke action. Rendered only
// for admins (the page wraps it in <AdminOnly>) so the query stays admin-scoped.
export function PendingInvitations({ workspaceId }) {
  const toast = useToast()
  const {
    data: invitations = [],
    isLoading,
    isError,
    refetch,
  } = useInvitations(workspaceId)
  const revoke = useRevokeInvitation(workspaceId)

  async function handleRevoke(invitation) {
    try {
      await revoke.mutateAsync({ invitationId: invitation.id })
      toast.success('Invitation revoked')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not revoke invitation')
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Pending invitations
        </h2>
        <p className="text-sm text-muted-foreground">
          People who&apos;ve been invited but haven&apos;t joined yet.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-border bg-card/60"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          Couldn&apos;t load invitations.{' '}
          <button
            onClick={() => refetch()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && invitations.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          No pending invitations. Invite a teammate to get started.
        </div>
      )}

      {!isLoading && !isError && invitations.length > 0 && (
        <ul className="space-y-2">
          {invitations.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/70 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {formatExpiry(inv.expires_at)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RoleBadge role={inv.role} />
                <button
                  onClick={() => handleRevoke(inv)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-destructive"
                  title="Revoke invitation"
                >
                  <X className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
