import { Link } from 'react-router-dom'

function RegisterPage() {
  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Expense Tracker
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Register</h1>
        <p className="mt-3 text-sm text-slate-300">
          Account creation form will be wired in the next step.
        </p>
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-400">
          Public route placeholder
        </div>
        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{' '}
          <Link className="font-semibold text-cyan-300" to="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  )
}

export default RegisterPage
