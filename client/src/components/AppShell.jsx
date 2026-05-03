import { NavLink } from 'react-router-dom'

import useAuth from '../hooks/useAuth.js'

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
]

function AppShell({ children, description, title }) {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-slate-950/85 px-6 py-8 backdrop-blur lg:w-80 lg:border-b-0 lg:border-r">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Expense Tracker
            </p>
            <h1 className="mt-4 text-2xl font-semibold">Personal finance hub</h1>
            <p className="mt-3 text-sm text-slate-300">
              Track spending, manage budgets, and review trends from one
              interface.
            </p>
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
                      ? 'bg-cyan-300 text-slate-950'
                      : 'border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/40',
                  ].join(' ')
                }
              >
                <span>{item.label}</span>
                <span className="text-xs uppercase tracking-[0.2em]">View</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Signed in as
            </p>
            <p className="mt-3 break-all font-medium text-slate-100">
              {user?.email ?? 'Unknown user'}
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
          <header className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Workspace
            </p>
            <h2 className="mt-4 text-3xl font-semibold">{title}</h2>
            <p className="mt-3 max-w-2xl text-slate-300">{description}</p>
          </header>
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
