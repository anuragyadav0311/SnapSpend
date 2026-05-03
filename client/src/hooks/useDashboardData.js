import { useEffect, useMemo, useState } from 'react'

import { fetchBudgets, saveBudget } from '../services/budgetService.js'
import { fetchExpenses } from '../services/expenseService.js'

const initialBudgetForm = {
  month: new Date().toISOString().slice(0, 7),
  monthly_limit: '',
}

function useDashboardData() {
  const [expenses, setExpenses] = useState([])
  const [budgets, setBudgets] = useState([])
  const [budgetForm, setBudgetForm] = useState(initialBudgetForm)
  const [error, setError] = useState('')
  const [isSavingBudget, setIsSavingBudget] = useState(false)
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
          if (budgetsResponse[0]) {
            setBudgetForm({
              month: budgetsResponse[0].month,
              monthly_limit: String(budgetsResponse[0].monthly_limit),
            })
          }
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

  function handleBudgetChange(event) {
    const { name, value } = event.target
    setBudgetForm((current) => ({ ...current, [name]: value }))
  }

  async function handleBudgetSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSavingBudget(true)

    try {
      const savedBudget = await saveBudget({
        month: budgetForm.month,
        monthly_limit: Number(budgetForm.monthly_limit),
      })

      setBudgets((current) => {
        const withoutCurrentMonth = current.filter(
          (budget) => budget.month !== savedBudget.month,
        )
        return [savedBudget, ...withoutCurrentMonth]
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSavingBudget(false)
    }
  }

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
    budgetForm,
    budgets,
    error,
    expenses,
    handleBudgetChange,
    handleBudgetSubmit,
    isLoading,
    isSavingBudget,
    summary,
  }
}

export default useDashboardData
