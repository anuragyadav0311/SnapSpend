import { useEffect, useMemo, useState } from 'react'

import { fetchBudgets } from '../services/budgetService.js'
import { fetchExpenses } from '../services/expenseService.js'

function useDashboardData() {
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

  return {
    budgets,
    error,
    expenses,
    isLoading,
    summary,
  }
}

export default useDashboardData
