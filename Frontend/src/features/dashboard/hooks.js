import { useQuery } from '@tanstack/react-query'

import { fetchDashboard } from './api'

export const dashboardKey = (workspaceId) => ['dashboard', workspaceId]

// Keyed by workspace id so switching workspaces refetches automatically.
export function useDashboard(workspaceId) {
  return useQuery({
    queryKey: dashboardKey(workspaceId),
    queryFn: () => fetchDashboard(workspaceId),
    enabled: Boolean(workspaceId),
  })
}
