import { useContext } from 'react'

import { ThemeContext } from '@/context/theme-context'

/** Returns { theme: 'dark'|'light', setTheme, toggleTheme }. */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>')
  return ctx
}
