import { useCallback, useEffect, useMemo, useState } from 'react'

import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'ttm_theme'

function readStored() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

/**
 * App theme. The design tokens (index.css) already define both palettes; this
 * toggles the `dark` class on <html> and persists the choice in localStorage
 * ("ttm_theme"). Defaults to dark (matches the static class in index.html), so
 * there's no flash before hydration.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStored() ?? 'dark')

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* storage unavailable - theme stays in memory only */
    }
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next === 'light' ? 'light' : 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
