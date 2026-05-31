import { LogOut } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { DropdownMenu } from '@/components/DropdownMenu'
import { RoleBadge } from '@/components/RoleBadge'
import { initials } from './helpers'

/**
 * Avatar button with a dropdown showing the signed-in user, their role in the
 * current workspace, and a logout action. After logout the auth state flips to
 * unauthenticated and ProtectedRoute sends the user back to /login.
 */
export function UserMenu() {
  const { user, logout } = useAuth()
  const { currentWorkspace, currentRole } = useWorkspace()
  const display = user?.name || user?.email

  return (
    <DropdownMenu
      align="end"
      className="min-w-[14rem]"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Account menu"
          className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-bloom text-sm font-semibold text-primary-foreground ring-1 ring-white/15 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {initials(display)}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-bloom text-sm font-semibold text-primary-foreground">
              {initials(display)}
            </span>
            <div className="min-w-0">
              {user?.name && (
                <p className="truncate text-sm font-medium">{user.name}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          {currentWorkspace && currentRole && (
            <>
              <div className="my-1 h-px bg-border/60" />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="min-w-0 truncate text-xs text-muted-foreground">
                  {currentWorkspace.name}
                </span>
                <RoleBadge role={currentRole} withIcon />
              </div>
            </>
          )}

          <div className="my-1 h-px bg-border/60" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close()
              logout()
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </>
      )}
    </DropdownMenu>
  )
}
