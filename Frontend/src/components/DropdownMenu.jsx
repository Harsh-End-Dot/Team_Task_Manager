import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

/**
 * Lightweight popover menu (no extra UI dependency). Renders a `trigger`
 * (a function given { open, toggle, close }) and the menu `children` (a node, or
 * a function given { close }). Closes on outside-click and Escape, and respects
 * reduced motion.
 */
export function DropdownMenu({ trigger, children, align = 'start', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const reduce = useReducedMotion()

  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v), close })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-2 min-w-[12rem] origin-top overflow-hidden rounded-xl border border-border/70 bg-popover/95 p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl',
              align === 'end' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
