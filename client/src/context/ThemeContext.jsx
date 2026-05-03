import { createContext, useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'expense-tracker-theme'
const ThemeContext = createContext(null)

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { ThemeContext, ThemeProvider }
