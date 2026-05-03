import AppShell from '../components/AppShell.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import ExpenseCard from '../components/ExpenseCard.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import Loader from '../components/Loader.jsx'
import useExpenses from '../hooks/useExpenses.js'

function ExpensesPage() {
  const {
    editingId,
    error,
    expenses,
    formData,
    handleChange,
    handleDelete,
    handleEdit,
    handleSubmit,
    isLoading,
    isSaving,
    resetForm,
  } = useExpenses()

  return (
    <AppShell
      title="Expenses"
      description="Add, edit, and remove expenses with immediate updates from the API."
    >
      <ErrorMessage message={error} />
      {isLoading ? <Loader label="Loading expenses..." /> : null}

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <ExpenseForm
            editingId={editingId}
            formData={formData}
            isSaving={isSaving}
            onCancel={resetForm}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />

          <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-6 shadow-[0_18px_50px_var(--shadow-color)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Transaction list</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Manage all recorded expenses from one place.
                </p>
              </div>
              {isLoading ? (
                <span className="text-sm text-[var(--text-muted)]">Loading...</span>
              ) : null}
            </div>
            <div className="mt-6 space-y-3">
              {expenses.length ? (
                expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border-color)] px-4 py-8 text-center text-[var(--text-muted)]">
                  No expenses yet. Add your first one from the form.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default ExpensesPage
