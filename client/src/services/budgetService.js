import { api } from './api.js'

async function fetchBudgets() {
  const response = await api.get('/budget')
  return response.data
}

async function saveBudget(payload) {
  const response = await api.post('/budget', payload)
  return response.data
}

export { fetchBudgets, saveBudget }
