import { useState } from 'react'
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useWorkspace } from '@/context/WorkspaceContext'
import { DropdownMenu } from '@/components/DropdownMenu'
import { RoleBadge } from '@/components/RoleBadge'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'
import { initials } from './helpers'

/**
 * Top-bar workspace switcher: shows the current workspace and a dropdown to
 * change it or create a new one. The selection is owned by WorkspaceContext.
 * Each row carries the caller's role badge in that workspace.
 */
export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, selectWorkspace, rolesByWorkspace } =
    useWorkspace()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <DropdownMenu
        align="start"
        className="min-w-[15rem]"
        trigger={({ toggle, open }) => (
          <button
            type="button"
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex max-w-[11rem] items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/70 sm:max-w-[16rem]"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-brand-bloom text-[11px] font-semibold text-primary-foreground">
              {currentWorkspace ? (
                initials(currentWorkspace.name)
              ) : (
                <Building2 className="size-3.5" />
              )}
            </span>
            <span className="truncate">
              {currentWorkspace?.name ?? 'Select workspace'}
            </span>
            <ChevronsUpDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-colors',
                open && 'text-foreground',
              )}
            />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Workspaces
            </p>
            <div className="max-h-64 overflow-y-auto">
              {workspaces.map((ws) => {
                const active = ws.id === currentWorkspace?.id
                return (
                  <button
                    key={ws.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      selectWorkspace(ws.id)
                      close()
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/70"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-brand-bloom text-[11px] font-semibold text-primary-foreground">
                      {initials(ws.name)}
                    </span>
                    <span className="flex-1 truncate">{ws.name}</span>
                    <RoleBadge role={rolesByWorkspace[ws.id]} />
                    {active && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                )
              })}
            </div>

            <div className="my-1 h-px bg-border/60" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                setCreating(true)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
                <Plus className="size-3.5" />
              </span>
              Create workspace
            </button>
          </>
        )}
      </DropdownMenu>

      <CreateWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
