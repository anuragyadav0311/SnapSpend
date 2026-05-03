import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import ThemeToggle from '../components/ThemeToggle.jsx'
import { registerUser } from '../services/authService.js'
import { validateRegisterForm } from '../utils/validation.js'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const nextErrors = validateRegisterForm(formData)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setIsSubmitting(true)

    try {
      await registerUser(formData)
      navigate('/login', {
        replace: true,
        state: { notice: 'Registration successful. Please log in.' },
      })
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
        <h1 className="mt-4 text-3xl font-semibold">Register</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Create an account to start tracking your personal spending.
        </p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--text-secondary)]">
              Name
            </span>
            <input
              required
              minLength={2}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-color)]"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
            />
            {fieldErrors.name ? (
              <p className="mt-2 text-sm text-[var(--danger-color)]">
                {fieldErrors.name}
              </p>
            ) : null}
          </label>
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
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link className="font-semibold text-[var(--accent-color)]" to="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  )
}

export default RegisterPage
