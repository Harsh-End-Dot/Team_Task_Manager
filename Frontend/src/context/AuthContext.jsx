import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { getToken, setToken } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import {
  fetchMe,
  loginRequest,
  signupRequest,
  updateProfile as updateProfileRequest,
} from '@/features/auth/api'

const AuthContext = createContext(null)

/**
 * Owns the auth session: the current user + the persisted JWT (localStorage key
 * "ttm_token", managed by lib/api.js). On mount it restores the session by
 * calling /auth/me when a token exists. Exposes login / signup / logout.
 *
 * `status` is one of: 'loading' (bootstrapping), 'authenticated', 'unauthenticated'.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  // Bootstrap: load the current user if a token is already stored.
  useEffect(() => {
    let active = true
    async function bootstrap() {
      if (!getToken()) {
        if (active) setStatus('unauthenticated')
        return
      }
      try {
        const me = await fetchMe()
        if (!active) return
        setUser(me)
        setStatus('authenticated')
      } catch {
        // Stale / invalid token - drop it and stay public.
        if (!active) return
        setToken(null)
        setUser(null)
        setStatus('unauthenticated')
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async ({ email, password, remember = true }) => {
    const { access_token: accessToken } = await loginRequest({ email, password })
    // "Remember me" → persist in localStorage; otherwise session-only.
    setToken(accessToken, { persist: remember })
    const me = await fetchMe()
    setUser(me)
    setStatus('authenticated')
    return me
  }, [])

  const signup = useCallback(
    async ({ name, email, password }) => {
      // Backend returns the created user (no token) - log in to obtain one.
      await signupRequest({ name, email, password })
      return login({ email, password })
    },
    [login],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }, [])

  // Update the caller's own profile (name/email) and sync the session user.
  const updateProfile = useCallback(async (changes) => {
    const updated = await updateProfileRequest(changes)
    setUser(updated)
    return updated
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      login,
      signup,
      logout,
      updateProfile,
    }),
    [user, status, login, signup, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
