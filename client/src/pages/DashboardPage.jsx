import { useEffect, useMemo, useState } from 'react'

import { fetchBudgets } from '../services/budgetService.js'
import { fetchExpenses } from '../services/expenseService.js'

function DashboardPage() {
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      setIsLoading(true)
      setError('')

      try {
        const [expensesResponse, budgetsResponse] = await Promise.all([
          fetchExpenses(),
          fetchBudgets(),
        ])

        if (!ignore) {
          setExpenses(expensesResponse)
          setBudgets(budgetsResponse)
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [])

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0)
    const recent = [...expenses]
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 5)
    const activeBudget = budgets[0] ?? null

    return {
      total,
      recent,
      activeBudget,
      transactionCount: expenses.length,
    }
  }, [budgets, expenses])

  return (
    <section className="px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Overview
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Your latest spending, budget status, and summary metrics all in one
            place.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-sm text-slate-400">Total spending</p>
            <h2 className="mt-3 text-3xl font-semibold">
              ${summary.total.toFixed(2)}
            </h2>
          </article>
          <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-sm text-slate-400">Transactions</p>
            <h2 className="mt-3 text-3xl font-semibold">
              {summary.transactionCount}
            </h2>
          </article>
          <article className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-sm text-slate-400">Current budget</p>
            <h2 className="mt-3 text-3xl font-semibold">
              {summary.activeBudget
                ? `$${summary.activeBudget.monthly_limit.toFixed(2)}`
                : 'Not set'}
            </h2>
          </article>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recent transactions</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Latest activity from your account.
                </p>
              </div>
              {isLoading ? (
                <span className="text-sm text-slate-400">Loading...</span>
              ) : null}
            </div>
            <div className="mt-6 space-y-3">
              {summary.recent.length ? (
                summary.recent.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-slate-400">
                        {expense.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-slate-400">
                  No expenses recorded yet.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-xl font-semibold">Budget snapshot</h2>
            <p className="mt-2 text-sm text-slate-400">
              Budget and chart modules will be expanded in the upcoming steps.
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
              Chart placeholder
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
