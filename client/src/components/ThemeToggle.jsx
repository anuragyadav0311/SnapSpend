import useTheme from '../hooks/useTheme.js'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="rounded-full border border-[var(--border-color)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-color)]"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}

export default ThemeToggle
