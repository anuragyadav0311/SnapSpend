function ChartCard({ children, description, title }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </article>
  )
}

export default ChartCard
