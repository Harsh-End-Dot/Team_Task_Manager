import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

import { useReducedMotion } from './useReducedMotion'

/**
 * Faux-3D tilt toward the mouse using CSS perspective only - no 3D engine.
 * Disabled (renders a plain div) under prefers-reduced-motion.
 */
export function TiltCard({
  children,
  className,
  max = 8,
  scale = 1.01,
  ...props
}) {
  const reduce = useReducedMotion()
  const ref = useRef(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { stiffness: 200, damping: 18, mass: 0.4 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [max, -max]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-max, max]), springConfig)

  if (reduce) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    )
  }

  const handleMouseMove = (event) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((event.clientX - rect.left) / rect.width - 0.5)
    y.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      whileHover={{ scale }}
      transition={{ scale: { duration: 0.2 } }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
