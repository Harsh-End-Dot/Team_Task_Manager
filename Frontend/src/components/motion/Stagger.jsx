import { motion } from 'framer-motion'

import { useReducedMotion } from './useReducedMotion'

/**
 * Sequences children with a small delay between each (headline -> subhead ->
 * CTAs -> social proof). Pair <Stagger> with <StaggerItem> children.
 */
export function Stagger({
  children,
  stagger = 0.07,
  delayChildren = 0.05,
  className,
  ...props
}) {
  const reduce = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : stagger,
        delayChildren: reduce ? 0 : delayChildren,
      },
    },
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, y = 14, className, as = 'div', ...props }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <MotionTag className={className} variants={item} {...props}>
      {children}
    </MotionTag>
  )
}
