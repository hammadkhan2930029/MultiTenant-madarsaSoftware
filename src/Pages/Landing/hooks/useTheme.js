import { useEffect, useState } from 'react'

const LANDING_THEME_KEY = 'madarsa_landing_theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'

    return localStorage.getItem(LANDING_THEME_KEY) || 'light'
  })

  useEffect(() => {
    localStorage.setItem(LANDING_THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
