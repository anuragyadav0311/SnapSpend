import { NavLink } from 'react-router-dom'

import useAuth from '../hooks/useAuth.js'
import ThemeToggle from './ThemeToggle.jsx'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
]

function AppShell({ children, description, title }) {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-[var(--border-color)] bg-[var(--surface-primary)] px-6 py-8 backdrop-blur lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-6 shadow-[0_20px_60px_var(--shadow-color)]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-color)]">
                Expense Tracker
              </p>
              <h1 className="mt-4 text-2xl font-semibold">Personal finance hub</h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Track spending, manage budgets, and review trends from one
                interface.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition',
                    isActive
                      ? 'bg-[var(--accent-color)] text-[var(--accent-contrast)]'
                      : 'border border-[var(--border-color)] bg-[var(--surface-panel)] text-[var(--text-primary)] hover:border-[var(--accent-color)]',
                  ].join(' ')
                }
              >
                <span>{item.label}</span>
                <span className="text-xs uppercase tracking-[0.2em]">View</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
              Signed in as
            </p>
            <p className="mt-3 break-all font-medium text-[var(--text-primary)]">
              {user?.email ?? 'Unknown user'}
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--danger-color)] hover:text-[var(--danger-color)]"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
          <header className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-8 shadow-[0_20px_60px_var(--shadow-color)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--success-color)]">
              Workspace
            </p>
            <h2 className="mt-4 text-3xl font-semibold">{title}</h2>
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
              {description}
            </p>
          </header>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
