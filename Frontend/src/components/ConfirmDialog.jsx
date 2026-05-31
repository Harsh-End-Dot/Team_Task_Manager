import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { Button } from '@/components/ui/button'

// Generic confirm modal matching the app's dialog styling. `danger` styles the
// confirm action as destructive. `busy` disables the buttons while a mutation
// is in flight.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onClose,
}) {
  const prefersReduced = useReducedMotion()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={busy ? undefined : onClose}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={prefersReduced ? { duration: 0 } : undefined}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <button
              onClick={onClose}
              disabled={busy}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            {danger && (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            {message && (
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={busy}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={danger ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? 'Working…' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
