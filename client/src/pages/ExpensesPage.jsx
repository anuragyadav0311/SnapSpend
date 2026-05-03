import { useEffect, useState } from 'react'

import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  updateExpense,
} from '../services/expenseService.js'

const initialFormState = {
  amount: '',
  category: '',
  description: '',
  date: '',
}

function toPayload(formData) {
  return {
    amount: Number(formData.amount),
    category: formData.category,
    description: formData.description || null,
    date: formData.date ? `${formData.date}T12:00:00` : null,
  }
}

function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadExpenses() {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetchExpenses()
        if (!ignore) {
          setExpenses(response)
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

    loadExpenses()

    return () => {
      ignore = true
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setEditingId(null)
    setFormData(initialFormState)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      if (editingId) {
        const updated = await updateExpense(editingId, toPayload(formData))
        setExpenses((current) =>
          current.map((expense) => (expense.id === editingId ? updated : expense)),
        )
      } else {
        const created = await createExpense(toPayload(formData))
        setExpenses((current) => [created, ...current])
      }
      resetForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(expenseId) {
    setError('')

    try {
      await deleteExpense(expenseId)
      setExpenses((current) => current.filter((expense) => expense.id !== expenseId))
      if (editingId === expenseId) {
        resetForm()
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function handleEdit(expense) {
    setEditingId(expense.id)
    setFormData({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: expense.date ? expense.date.slice(0, 10) : '',
    })
  }

  return (
    <section className="px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Expense Management
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Expenses</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Add, edit, and remove expenses with immediate updates from the API.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Edit expense' : 'Add expense'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Track each transaction with amount, category, and date.
                </p>
              </div>
              {editingId ? (
                <button
                  type="button"
                  className="text-sm font-medium text-slate-300"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Amount</span>
                <input
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="125.50"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Category</span>
                <input
                  required
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Food & Dining"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Description</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional details about the expense"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Date</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </label>
              <button
                className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Saving...'
                  : editingId
                    ? 'Update expense'
                    : 'Add expense'}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Transaction list</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Manage all recorded expenses from one place.
                </p>
              </div>
              {isLoading ? (
                <span className="text-sm text-slate-400">Loading...</span>
              ) : null}
            </div>
            <div className="mt-6 space-y-3">
              {expenses.length ? (
                expenses.map((expense) => (
                  <article
                    key={expense.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">
                          ${expense.amount.toFixed(2)}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {expense.category}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {expense.description || 'No description'}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300"
                          onClick={() => handleEdit(expense)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-300"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-slate-400">
                  No expenses yet. Add your first one from the form.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ExpensesPage
