/**
 * Turn an axios error from the FastAPI backend into a human-readable string.
 *
 * The backend raises HTTPException with a string `detail` (e.g. "Email already
 * registered", "Incorrect email or password"), while Pydantic validation
 * failures (422) return `detail` as an array of { loc, msg, type } objects.
 */
export function getErrorMessage(
  error,
  fallback = 'Something went wrong. Please try again.',
) {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) return detail

  if (Array.isArray(detail) && detail.length) {
    const first = detail[0]
    if (first?.msg) {
      // Pydantic v2 prefixes custom errors with "Value error, " - strip it.
      return first.msg.replace(/^Value error,\s*/i, '')
    }
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Make sure the backend is running on :8000.'
  }

  return fallback
}
