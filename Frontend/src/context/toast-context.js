import { createContext } from 'react'

// Holds `pushToast(message, type)`. Kept in its own module (no component export)
// so fast-refresh stays clean across the provider and the hook.
export const ToastContext = createContext(null)
