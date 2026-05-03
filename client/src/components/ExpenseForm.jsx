function ExpenseForm({
  editingId,
  formData,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}) {
  return (
    <form
      className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {editingId ? 'Edit expense' : 'Add expense'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Track each transaction with amount, category, and date.
          </p>
        </div>
        {editingId ? (
          <button
            type="button"
            className="text-sm font-medium text-slate-300"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Amount</span>
          <input
            required
            min="0.01"
            step="0.01"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={onChange}
            placeholder="125.50"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Category</span>
          <input
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
            type="text"
            name="category"
            value={formData.category}
            onChange={onChange}
            placeholder="Food & Dining"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Description</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Optional details about the expense"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Date</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-amber-300"
            type="date"
            name="date"
            value={formData.date}
            onChange={onChange}
          />
        </label>
        <button
          className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
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
