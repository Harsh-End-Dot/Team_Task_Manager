import { createContext } from 'react'

// Holds { theme, setTheme, toggleTheme }. Kept in its own module (no component
// export) so fast-refresh stays clean across the provider and the hook.
export const ThemeContext = createContext(null)
