function ExpenseCard({ expense, onDelete, onEdit }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">${expense.amount.toFixed(2)}</p>
          <p className="mt-1 text-sm text-slate-300">{expense.category}</p>
          <p className="mt-2 text-sm text-slate-400">
            {expense.description || 'No description'}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            {new Date(expense.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300"
            onClick={() => onEdit(expense)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-300"
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
