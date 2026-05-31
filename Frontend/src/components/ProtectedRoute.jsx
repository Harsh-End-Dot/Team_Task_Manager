import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

/**
 * Gates a route on authentication. While the session is being restored it shows
 * a loader; once resolved, unauthenticated users are sent to /login with the
 * attempted location remembered in `state.from` so login can return them there.
 */
export function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
