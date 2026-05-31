import { motion } from 'framer-motion'

import { useReducedMotion } from './useReducedMotion'

/**
 * Entrance: fades in while translating up a few px.
 * Animates only opacity/transform. Collapses to a plain fade (no movement)
 * under prefers-reduced-motion.
 */
export function FadeUp({
  children,
  delay = 0,
  duration = 0.5,
  y = 16,
  className,
  as = 'div',
  ...props
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0.2 : duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
