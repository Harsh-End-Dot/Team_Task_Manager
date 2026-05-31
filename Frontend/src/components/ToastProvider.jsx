import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ToastContext } from '@/context/toast-context'

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info }
const STYLES = {
  error: 'border-destructive/40 bg-destructive/15 text-destructive',
  success: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  info: 'border-border bg-card text-foreground',
}

/** App-wide toast host. Stacks transient messages bottom-right; auto-dismiss. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const reduce = useReducedMotion()
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (message, type = 'info') => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 4500)
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      show: (message, type) => pushToast(message, type),
      error: (m) => pushToast(m, 'error'),
      success: (m) => pushToast(m, 'success'),
      info: (m) => pushToast(m, 'info'),
    }),
    [pushToast],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] ?? Info
            return (
              <motion.div
                key={t.id}
                layout
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                role="status"
                className={cn(
                  'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl',
                  STYLES[t.type] ?? STYLES.info,
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" />
                <span className="flex-1 leading-snug">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="-mr-1 rounded p-0.5 text-current/70 transition-opacity hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
