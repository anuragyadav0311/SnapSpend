import AppShell from '../components/AppShell.jsx'
import CategoryPieChart from '../components/CategoryPieChart.jsx'
import ChartCard from '../components/ChartCard.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import Loader from '../components/Loader.jsx'
import MonthlySpendingChart from '../components/MonthlySpendingChart.jsx'
import useDashboardData from '../hooks/useDashboardData.js'

function DashboardPage() {
  const {
    budgetForm,
    error,
    expenses,
    handleBudgetChange,
    handleBudgetSubmit,
    isLoading,
    isSavingBudget,
    summary,
  } = useDashboardData()

  return (
    <AppShell
      title="Dashboard"
      description="Your latest spending, budget status, and summary metrics all in one place."
    >
      <ErrorMessage message={error} />

      {isLoading ? <Loader label="Loading dashboard data..." /> : null}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-card)] p-6">
            <p className="text-sm text-[var(--text-muted)]">Total spending</p>
            <h2 className="mt-3 text-3xl font-semibold">
              ${summary.total.toFixed(2)}
            </h2>
          </article>
          <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-card)] p-6">
            <p className="text-sm text-[var(--text-muted)]">Transactions</p>
            <h2 className="mt-3 text-3xl font-semibold">
              {summary.transactionCount}
            </h2>
          </article>
          <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-card)] p-6">
            <p className="text-sm text-[var(--text-muted)]">Current budget</p>
            <h2 className="mt-3 text-3xl font-semibold">
              {summary.activeBudget
                ? `$${summary.activeBudget.monthly_limit.toFixed(2)}`
                : 'Not set'}
            </h2>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ChartCard
            title="Recent transactions"
            description="Latest activity from your account."
          >
            <div className="flex items-center justify-between">
              {isLoading ? (
                <span className="text-sm text-[var(--text-muted)]">Loading...</span>
              ) : null}
            </div>
            <div className="mt-6 space-y-3">
              {summary.recent.length ? (
                summary.recent.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{expense.category}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {expense.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border-color)] px-4 py-8 text-center text-[var(--text-muted)]">
                  No expenses recorded yet.
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Category distribution"
            description="See where most of your money is going."
          >
            <CategoryPieChart expenses={expenses} />
          </ChartCard>
        </div>

        <div className="grid gap-6">
          <ChartCard
            title="Monthly spending"
            description="Track spending patterns across months."
          >
            <MonthlySpendingChart expenses={expenses} />
          </ChartCard>
        </div>

        <ChartCard
          title="Budget control"
          description="Update the monthly spending ceiling for the selected month."
        >
          <form
            className="grid gap-4 md:grid-cols-[0.8fr_1fr_auto]"
            onSubmit={handleBudgetSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-secondary)]">
                Month
              </span>
              <input
                required
                type="month"
                name="month"
                value={budgetForm.month}
                onChange={handleBudgetChange}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-color)]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-[var(--text-secondary)]">
                Monthly limit
              </span>
              <input
                required
                min="1"
                step="0.01"
                type="number"
                name="monthly_limit"
                value={budgetForm.monthly_limit}
                onChange={handleBudgetChange}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-color)]"
                placeholder="5000"
              />
            </label>
            <button
              type="submit"
              disabled={isSavingBudget}
              className="mt-7 rounded-2xl bg-[var(--accent-color)] px-5 py-3 font-semibold text-[var(--accent-contrast)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingBudget ? 'Saving...' : 'Save budget'}
            </button>
          </form>
        </ChartCard>
      </div>
    </AppShell>
  )
}

export default DashboardPage
