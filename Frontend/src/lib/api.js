import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const TOKEN_STORAGE_KEY = 'ttm_token'

// In-memory copy so we don't hit storage on every request. Initialised from
// localStorage ("remember me") or sessionStorage (this session only).
let accessToken = (() => {
  try {
    return (
      window.localStorage.getItem(TOKEN_STORAGE_KEY) ||
      window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
      null
    )
  } catch {
    return null
  }
})()

export function getToken() {
  return accessToken
}

/**
 * Store (or clear) the access token.
 * `persist: true`  → localStorage (survives browser restarts - "Remember me").
 * `persist: false` → sessionStorage (cleared when the tab closes).
 * Passing a falsy token clears it from both stores.
 */
export function setToken(token, { persist = true } = {}) {
  accessToken = token || null
  try {
    // Always clear both first so we never leave a stale copy behind.
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    if (token) {
      const store = persist ? window.localStorage : window.sessionStorage
      store.setItem(TOKEN_STORAGE_KEY, token)
    }
  } catch {
    /* storage unavailable - keep in-memory token only */
  }
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear the token and bounce to /login - except for calls that opt out
// via `skipAuthRedirect` (the auth flows: login/signup/bootstrap handle their
// own UX and shouldn't force a global navigation on an expected 401).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const skip = error?.config?.skipAuthRedirect
    if (error?.response?.status === 401 && !skip) {
      setToken(null)
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
