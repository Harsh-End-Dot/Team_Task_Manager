import { Link, NavLink } from 'react-router-dom'
import { Zap } from 'lucide-react'

import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './navItems'

/**
 * Sidebar contents: the TaskFlow mark plus the primary nav with active-state
 * highlighting. Rendered both in the fixed desktop rail and the mobile drawer;
 * `onNavigate` lets the drawer close itself after a link is tapped.
 */
export function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col gap-2 px-3 py-5">
      <Link
        to="/app"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2 px-3"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary))]">
          <Zap className="size-4" fill="currentColor" />
        </span>
        <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon
                  className={cn(
                    'size-[18px] shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <p className="px-3 text-xs text-muted-foreground/60">TaskFlow · v0.1</p>
    </div>
  )
}
