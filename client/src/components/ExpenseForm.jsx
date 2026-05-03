function ExpenseForm({
  editingId,
  fieldErrors,
  formData,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}) {
  return (
    <form
      className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface-panel)] p-6 shadow-[0_18px_50px_var(--shadow-color)] backdrop-blur"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {editingId ? 'Edit expense' : 'Add expense'}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Track each transaction with amount, category, and date.
          </p>
        </div>
        {editingId ? (
          <button
            type="button"
            className="text-sm font-medium text-[var(--text-secondary)]"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-[var(--text-secondary)]">
            Amount
          </span>
          <input
            required
            min="0.01"
            step="0.01"
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--warning-color)]"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={onChange}
            placeholder="125.50"
          />
          {fieldErrors.amount ? (
            <p className="mt-2 text-sm text-[var(--danger-color)]">
              {fieldErrors.amount}
            </p>
          ) : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-[var(--text-secondary)]">
            Category
          </span>
          <input
            required
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--warning-color)]"
            type="text"
            name="category"
            value={formData.category}
            onChange={onChange}
            placeholder="Food & Dining"
          />
          {fieldErrors.category ? (
            <p className="mt-2 text-sm text-[var(--danger-color)]">
              {fieldErrors.category}
            </p>
          ) : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-[var(--text-secondary)]">
            Description
          </span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--warning-color)]"
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Optional details about the expense"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-[var(--text-secondary)]">
            Date
          </span>
          <input
            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--warning-color)]"
            type="date"
            name="date"
            value={formData.date}
            onChange={onChange}
          />
        </label>
        <button
          className="w-full rounded-2xl bg-[var(--warning-color)] px-4 py-3 font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : editingId ? 'Update expense' : 'Add expense'}
        </button>
      </div>
    </form>
  )
}

export default ExpenseForm
