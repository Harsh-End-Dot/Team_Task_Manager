import { api } from '@/lib/api'

// Auth-flow calls opt out of the global 401 → redirect interceptor: a bad
// login or an invalid bootstrap token should surface as an inline error /
// be handled locally, not bounce the whole app to /login.
const AUTH_CFG = { skipAuthRedirect: true }

// POST /auth/login → { access_token, token_type }
export async function loginRequest({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password }, AUTH_CFG)
  return data
}

// POST /auth/signup → UserResponse (no token; caller logs in afterwards)
export async function signupRequest({ name, email, password }) {
  const { data } = await api.post('/auth/signup', { name, email, password }, AUTH_CFG)
  return data
}

// GET /auth/me → UserResponse
export async function fetchMe(config = {}) {
  const { data } = await api.get('/auth/me', { ...AUTH_CFG, ...config })
  return data
}

// PATCH /auth/me { name?, email? } → UserResponse | 409 (email taken)
export async function updateProfile({ name, email }) {
  const { data } = await api.patch('/auth/me', { name, email })
  return data
}

// POST /auth/password-reset/request → { message } (always 200, anti-enumeration)
export async function requestPasswordReset({ email }) {
  const { data } = await api.post('/auth/password-reset/request', { email })
  return data
}

// POST /auth/password-reset/confirm → { message } | 400 invalid/expired
export async function confirmPasswordReset({ token, new_password }) {
  const { data } = await api.post('/auth/password-reset/confirm', {
    token,
    new_password,
  })
  return data
}

// POST /invitations/accept → MembershipResponse (requires auth)
export async function acceptInvitation({ token }) {
  const { data } = await api.post('/invitations/accept', { token })
  return data
}
