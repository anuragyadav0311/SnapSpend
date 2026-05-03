import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import ThemeToggle from '../components/ThemeToggle.jsx'
import useAuth from '../hooks/useAuth.js'
import { loginUser } from '../services/authService.js'
import { validateLoginForm } from '../utils/validation.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const notice = location.state?.notice

  function handleChange(event) {
    const { name, value } = event.target
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const nextErrors = validateLoginForm(formData)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await loginUser(formData)
      login(response.access_token)
      const nextPath = location.state?.from?.pathname ?? '/dashboard'
      navigate(nextPath, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[var(--app-background)] px-6 py-16 text-[var(--text-primary)]">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-8 shadow-[0_24px_80px_var(--shadow-color)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-color)]">
            Expense Tracker
          </p>
          <ThemeToggle />
        </div>
        <h1 className="mt-4 text-3xl font-semibold">Login</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Access your expenses, monthly trends, and budget controls.
        </p>
        {notice ? (
          <p className="mt-6 rounded-2xl border border-[color:color-mix(in_srgb,var(--success-color)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--success-color)_12%,transparent)] px-4 py-3 text-sm text-[var(--success-color)]">
            {notice}
          </p>
        ) : null}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">
              Email
            </span>
            <input
              required
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-color)]"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {fieldErrors.email ? (
              <p className="mt-2 text-sm text-[var(--danger-color)]">
                {fieldErrors.email}
              </p>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">
              Password
            </span>
            <input
              required
              minLength={8}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-color)]"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
            />
            {fieldErrors.password ? (
              <p className="mt-2 text-sm text-[var(--danger-color)]">
                {fieldErrors.password}
              </p>
            ) : null}
          </label>
          {error ? (
            <p className="rounded-2xl border border-[color:color-mix(in_srgb,var(--danger-color)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--danger-color)_14%,transparent)] px-4 py-3 text-sm text-[var(--danger-color)]">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-2xl bg-[var(--accent-color)] px-4 py-3 font-semibold text-[var(--accent-contrast)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--text-secondary)]">
          Need an account?{' '}
          <Link className="font-semibold text-[var(--accent-color)]" to="/register">
            Register
          </Link>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
