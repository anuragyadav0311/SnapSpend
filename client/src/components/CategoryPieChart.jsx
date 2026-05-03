import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const CHART_COLORS = [
  '#22d3ee',
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#a78bfa',
]

function CategoryPieChart({ expenses }) {
  const categoryMap = expenses.reduce((accumulator, expense) => {
    accumulator[expense.category] =
      (accumulator[expense.category] ?? 0) + expense.amount
    return accumulator
  }, {})

  const data = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }))

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
        Add some expenses to see category distribution.
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Spent']}
            contentStyle={{
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#020617',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryPieChart
