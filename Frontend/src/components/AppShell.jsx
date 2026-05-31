import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

import { useWorkspace } from '@/context/WorkspaceContext'
import { useWorkspaceRealtime } from '@/features/realtime/useWorkspaceRealtime'
import { Sidebar } from '@/features/shell/Sidebar'
import { Topbar } from '@/features/shell/Topbar'
import { WorkspaceEmptyState } from '@/features/shell/WorkspaceEmptyState'

/**
 * Authenticated product layout: a fixed sidebar (drawer on mobile) and a sticky
 * top bar wrapping the routed page (<Outlet />). Resolves the workspace state
 * first - loader while fetching, an error retry, or the create-workspace empty
 * state when the user has none.
 */
export function AppShell() {
  const { isLoading, isError, hasWorkspaces, refetch, currentWorkspaceId } =
    useWorkspace()
  const [mobileOpen, setMobileOpen] = useState(false)
  const reduce = useReducedMotion()

  // Live updates for the active workspace (board / dashboard / open task detail).
  // Reconnects on workspace change, cleans up on unmount; best-effort - a down
  // socket never throws into React. Safe no-op while no workspace is selected.
  useWorkspaceRealtime(currentWorkspaceId)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-muted-foreground">
          We couldn&apos;t load your workspaces.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!hasWorkspaces) return <WorkspaceEmptyState />

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card/30 backdrop-blur-xl lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-border/60 bg-card shadow-2xl"
              initial={reduce ? { opacity: 0 } : { x: -288 }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: -288 }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-5 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
