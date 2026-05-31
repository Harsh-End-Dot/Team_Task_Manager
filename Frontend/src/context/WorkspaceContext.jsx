import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useQueries } from '@tanstack/react-query'

import { useAuth } from '@/context/AuthContext'
import { fetchMembers } from '@/features/workspace/api'
import { membersKey, useWorkspaces } from '@/features/workspace/hooks'

const WorkspaceContext = createContext(null)

const STORAGE_KEY = 'ttm_workspace'

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(id) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable - selection stays in memory only */
  }
}

/**
 * Owns the "current workspace" for the authenticated product. Loads the user's
 * workspaces via TanStack Query and tracks the active selection (persisted in
 * localStorage "ttm_workspace"). The active workspace is derived during render:
 * the explicit choice if it's still valid, otherwise the first workspace - so a
 * stale stored id self-heals with no effects, and `hasWorkspaces` drives the
 * empty state.
 *
 * Also resolves the caller's ROLE in each workspace. `GET /workspaces` carries no
 * role, so we fetch each workspace's members (any member may list their own
 * workspace's members) and match our user id. Exposes `currentRole` / `isAdmin`
 * for the active workspace plus `rolesByWorkspace` for the switcher. Roles are
 * UI hints only - the backend still enforces 403 on every request.
 */
export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const {
    data: workspaces = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useWorkspaces()

  const [selectedId, setSelectedId] = useState(() => readStored())

  const currentWorkspace =
    workspaces.find((w) => w.id === selectedId) ?? workspaces[0] ?? null
  const currentWorkspaceId = currentWorkspace?.id ?? null

  const selectWorkspace = useCallback((id) => {
    setSelectedId(id)
    writeStored(id)
  }, [])

  // One members query per workspace; shares cache with useMembers (same key).
  const memberQueries = useQueries({
    queries: workspaces.map((ws) => ({
      queryKey: membersKey(ws.id),
      queryFn: () => fetchMembers(ws.id),
      enabled: Boolean(user?.id),
      staleTime: 60 * 1000,
    })),
  })

  // Stable signature of resolved roles so the memo below only recomputes when a
  // role actually changes (memberQueries is a fresh array every render).
  const roleSig = workspaces
    .map((ws, i) => {
      const rows = memberQueries[i]?.data
      const role =
        rows && user?.id
          ? rows.find((m) => m.user_id === user.id)?.role ?? 'none'
          : '?'
      return `${ws.id}:${role}`
    })
    .join('|')

  const rolesByWorkspace = useMemo(() => {
    const map = {}
    workspaces.forEach((ws, i) => {
      const rows = memberQueries[i]?.data
      map[ws.id] =
        rows && user?.id
          ? rows.find((m) => m.user_id === user.id)?.role ?? null
          : undefined // undefined = still loading / unknown
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleSig])

  const currentRole = currentWorkspaceId
    ? rolesByWorkspace[currentWorkspaceId] ?? null
    : null
  const isAdmin = currentRole === 'ADMIN'
  const currentIdx = workspaces.findIndex((w) => w.id === currentWorkspaceId)
  const roleLoading =
    currentIdx >= 0 ? Boolean(memberQueries[currentIdx]?.isLoading) : false

  const value = useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      hasWorkspaces: workspaces.length > 0,
      isLoading,
      isError,
      error,
      refetch,
      selectWorkspace,
      // role-awareness
      rolesByWorkspace,
      currentRole,
      isAdmin,
      roleLoading,
    }),
    [
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      isLoading,
      isError,
      error,
      refetch,
      selectWorkspace,
      rolesByWorkspace,
      currentRole,
      isAdmin,
      roleLoading,
    ],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a <WorkspaceProvider>')
  }
  return ctx
}
