import { api } from './api.js'

async function fetchExpenses() {
  const response = await api.get('/expenses')
  return response.data
}

async function createExpense(payload) {
  const response = await api.post('/expenses', payload)
  return response.data
}

async function updateExpense(expenseId, payload) {
  const response = await api.put(`/expenses/${expenseId}`, payload)
  return response.data
}

async function deleteExpense(expenseId) {
  await api.delete(`/expenses/${expenseId}`)
}

export { createExpense, deleteExpense, fetchExpenses, updateExpense }
