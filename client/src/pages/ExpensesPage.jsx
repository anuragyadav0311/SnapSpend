import { useEffect, useState } from 'react'

import AppShell from '../components/AppShell.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import ExpenseCard from '../components/ExpenseCard.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import Loader from '../components/Loader.jsx'
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
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
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
    </AppShell>
  )
}

export default ExpensesPage
