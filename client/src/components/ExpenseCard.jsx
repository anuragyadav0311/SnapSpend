function ExpenseCard({ expense, onDelete, onEdit }) {
  return (
    <article className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">${expense.amount.toFixed(2)}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{expense.category}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {expense.description || 'No description'}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {new Date(expense.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--warning-color)]"
            onClick={() => onEdit(expense)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full border border-[color:color-mix(in_srgb,var(--danger-color)_20%,transparent)] px-4 py-2 text-sm text-[var(--danger-color)] transition hover:border-[var(--danger-color)]"
            onClick={() => onDelete(expense.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default ExpenseCard
