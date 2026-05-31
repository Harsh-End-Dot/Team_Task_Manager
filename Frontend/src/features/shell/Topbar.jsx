import { Bell, Menu, Search } from 'lucide-react'

import { useWorkspace } from '@/context/WorkspaceContext'
import { RoleBadge } from '@/components/RoleBadge'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { UserMenu } from './UserMenu'

/**
 * Sticky top bar: a mobile menu button, the workspace switcher (+ the caller's
 * role badge for the active workspace), a (placeholder) search field, a
 * notifications bell, and the user avatar menu.
 */
export function Topbar({ onOpenSidebar }) {
  const { currentRole } = useWorkspace()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="-ml-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <WorkspaceSwitcher />
      <RoleBadge role={currentRole} withIcon className="hidden sm:inline-flex" />

      {/* Search placeholder - wired up in a later phase. */}
      <div className="relative ml-auto hidden max-w-xs flex-1 sm:block md:mr-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          disabled
          placeholder="Search…"
          aria-label="Search (coming soon)"
          className="h-9 w-full cursor-not-allowed rounded-lg border border-input bg-background/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
