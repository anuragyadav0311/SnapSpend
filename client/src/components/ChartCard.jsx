function ChartCard({ children, description, title }) {
  return (
    <article className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-6 shadow-[0_18px_50px_var(--shadow-color)] backdrop-blur">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </article>
  )
}

export default ChartCard
