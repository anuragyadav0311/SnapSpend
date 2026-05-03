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

function useExpenses() {
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

  return {
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
  }
}

export default useExpenses
