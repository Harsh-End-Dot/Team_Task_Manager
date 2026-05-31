import { useQuery } from '@tanstack/react-query'

import { fetchLabels } from './api'

export const labelsKey = (workspaceId) => ['labels', workspaceId]

// Workspace labels, keyed by workspace id.
export function useLabels(workspaceId) {
  return useQuery({
    queryKey: labelsKey(workspaceId),
    queryFn: () => fetchLabels(workspaceId),
    enabled: Boolean(workspaceId),
  })
}
