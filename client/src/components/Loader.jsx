function Loader({ label = 'Loading...' }) {
  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-6 text-center text-sm text-[var(--text-secondary)] backdrop-blur">
      {label}
    </div>
  )
}

export default Loader
