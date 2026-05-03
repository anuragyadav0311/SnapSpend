import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function MonthlySpendingChart({ expenses }) {
  const grouped = expenses.reduce((accumulator, expense) => {
    const date = new Date(expense.date)
    const month = date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    })
    accumulator[month] = (accumulator[month] ?? 0) + expense.amount
    return accumulator
  }, {})

  const data = Object.entries(grouped).map(([month, total]) => ({
    month,
    total: Number(total.toFixed(2)),
  }))

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
        Monthly spending will appear after you record expenses.
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spent']}
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#020617',
            }}
          />
          <Bar dataKey="total" fill="#22d3ee" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlySpendingChart
