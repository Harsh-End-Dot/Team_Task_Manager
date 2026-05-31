import { useWorkspace } from '@/context/WorkspaceContext'

/**
 * Renders `children` only when the current user is an ADMIN of the active
 * workspace; otherwise renders `fallback` (default: nothing). UI convenience
 * only - the backend still enforces permissions with a 403. While the role is
 * still loading the user is treated as non-admin, so admin controls appear once
 * the role resolves rather than flashing for everyone.
 */
export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = useWorkspace()
  return isAdmin ? children : fallback
}
