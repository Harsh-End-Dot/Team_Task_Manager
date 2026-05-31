import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { useReducedMotion } from '@/components/motion'
import { cn } from '@/lib/utils'

// motion.create is the current API; fall back to motion() on older builds.
const createMotion = motion.create ?? motion
const MotionLink = createMotion(Link)
const MotionButton = createMotion('button')

/**
 * Primary call-to-action with the shared micro-interaction: lift + glow on
 * hover, a quick press on click. Routes via <Link> when `to` is provided,
 * otherwise renders a <button>. Animates only transform/opacity (+ shadow).
 */
export function CtaButton({
  to,
  children,
  variant = 'default',
  size = 'lg',
  glow = true,
  className,
  ...props
}) {
  const reduce = useReducedMotion()

  const hover = reduce
    ? {}
    : {
        y: -2,
        boxShadow: glow
          ? '0 14px 44px -10px hsl(var(--primary) / 0.65)'
          : '0 10px 30px -12px rgba(0,0,0,0.5)',
      }
  const tap = reduce ? {} : { y: 0, scale: 0.97 }

  const classes = cn(buttonVariants({ variant, size }), className)
  const motionProps = {
    whileHover: hover,
    whileTap: tap,
    transition: { type: 'spring', stiffness: 400, damping: 22 },
  }

  if (to) {
    return (
      <MotionLink to={to} className={classes} {...motionProps} {...props}>
        {children}
      </MotionLink>
    )
  }

  return (
    <MotionButton type="button" className={classes} {...motionProps} {...props}>
      {children}
    </MotionButton>
  )
}
