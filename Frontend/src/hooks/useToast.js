import { useContext } from 'react'

import { ToastContext } from '@/context/toast-context'

/**
 * Returns a toast API: toast.error(msg) / toast.success(msg) / toast.info(msg),
 * plus toast.show(msg, type).
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>')
  return ctx
}
