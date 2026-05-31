import { Check, ChevronsUpDown, FolderKanban } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DropdownMenu } from '@/components/DropdownMenu'

/** Dropdown to pick which project's board to view. */
export function ProjectSelector({ projects, currentId, onSelect }) {
  const current = projects.find((p) => p.id === currentId)

  return (
    <DropdownMenu
      align="start"
      className="min-w-[15rem]"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex max-w-[16rem] items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70"
        >
          <FolderKanban className="size-4 shrink-0 text-primary" />
          <span className="truncate">{current?.name ?? 'Select project'}</span>
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
        <div className="max-h-72 overflow-y-auto">
          {projects.map((p) => {
            const active = p.id === currentId
            return (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelect(p.id)
                  close()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-secondary/70"
              >
                <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{p.name}</span>
                {active && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </DropdownMenu>
  )
}
