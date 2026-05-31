import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * Single source of truth for reduced-motion gating across the app.
 * Wraps Framer Motion's hook so every motion primitive can opt out of
 * movement when the user prefers reduced motion. Returns a boolean.
 */
export function useReducedMotion() {
  return useFramerReducedMotion() ?? false
}
