import { motion } from 'framer-motion'

import { useReducedMotion } from './useReducedMotion'

/**
 * Fades/translates a section up once, the first time it enters the viewport.
 * Never re-triggers (viewport once: true).
 */
export function RevealOnScroll({
  children,
  y = 24,
  duration = 0.6,
  amount = 0.25,
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduce ? 0.2 : duration, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
