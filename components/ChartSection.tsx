'use client'
import { Transaction } from '@/lib/types'
import { formatRupiah, CHART_COLORS } from '@/lib/utils'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

interface Props {
  transactions: Transaction[]
  monthlyData: { month: string; pemasukan: number; pengeluaran: number }[]
}

export default function ChartSection({ transactions, monthlyData }: Props) {
  // Pie chart: pengeluaran per kategori
  const pengeluaran = transactions.filter(t => t.type === 'pengeluaran')
  const categoryMap: Record<string, { name: string; value: number; icon: string }> = {}
  pengeluaran.forEach(t => {
    const key = t.category_id || 'lainnya'
    const name = t.categories?.name || 'Lainnya'
    const icon = t.categories?.icon || '💸'
    if (!categoryMap[key]) categoryMap[key] = { name, value: 0, icon }
    categoryMap[key].value += t.amount
  })
  const pieData = Object.values(categoryMap).sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 shadow-lg text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-200">{payload[0].name}</p>
          <p className="text-gray-500 dark:text-gray-400">{formatRupiah(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 shadow-lg text-sm space-y-1">
          <p className="font-medium text-gray-700 dark:text-gray-200">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} style={{ color: p.fill }} className="text-xs">
              {p.name}: {formatRupiah(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">🍩 Pengeluaran per Kategori</h3>
        {pieData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Belum ada data pengeluaran</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {pieData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{item.icon} {item.name}</span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0 ml-2">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">📊 Tren 6 Bulan Terakhir</h3>
        {monthlyData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Belum ada data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} width={45} />
              <Tooltip content={<BarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#6b7280' }} />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
