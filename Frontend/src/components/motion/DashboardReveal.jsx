import { motion } from 'framer-motion'

import { useReducedMotion } from './useReducedMotion'

/**
 * The highest-value entrance: a product preview fades/slides up while scaling
 * from ~0.96, with a settling shadow. Used for the hero dashboard preview.
 * Collapses to a quiet fade under prefers-reduced-motion.
 */
export function DashboardReveal({
  children,
  delay = 0.5,
  duration = 0.9,
  y = 48,
  fromScale = 0.96,
  className,
  ...props
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              y,
              scale: fromScale,
              boxShadow: '0 0 0 rgba(0,0,0,0)',
            }
      }
      animate={
        reduce
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: '0 40px 120px -32px rgba(0,0,0,0.7)',
            }
      }
      transition={{
        duration: reduce ? 0.25 : duration,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
