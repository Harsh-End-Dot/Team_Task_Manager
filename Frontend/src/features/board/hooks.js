import { useMutation, useQuery } from '@tanstack/react-query'

import {
  createTask,
  fetchTasks,
  reorderTask,
  updateTaskStatus,
} from './api'

export const tasksKey = (projectId) => ['tasks', projectId]

// Tasks for a project, keyed by project id (refetches on project change).
export function useTasks(projectId) {
  return useQuery({
    queryKey: tasksKey(projectId),
    queryFn: () => fetchTasks(projectId),
    enabled: Boolean(projectId),
  })
}

// Bare mutations - the board wires optimistic state + onError rollback/toast at
// the call site so drag interactions stay smooth.
export function useCreateTask() {
  return useMutation({ mutationFn: createTask })
}

export function useUpdateTaskStatus() {
  return useMutation({ mutationFn: updateTaskStatus })
}

export function useReorderTask() {
  return useMutation({ mutationFn: reorderTask })
}
