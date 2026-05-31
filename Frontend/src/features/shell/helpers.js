/**
 * Up to `max` uppercase initials from a name or email - used for avatar and
 * workspace badges. Falls back to "?" when there's nothing usable.
 */
export function initials(value, max = 2) {
  if (!value) return '?'
  const base = value.includes('@') ? value.split('@')[0] : value
  const parts = base
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  return parts
    .slice(0, max)
    .map((p) => p[0].toUpperCase())
    .join('')
}
