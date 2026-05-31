import {
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'

// Primary product navigation. `end` marks an exact-match route (the index) so it
// isn't highlighted while a nested route is active.
export const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/board', label: 'Board', icon: KanbanSquare },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]
