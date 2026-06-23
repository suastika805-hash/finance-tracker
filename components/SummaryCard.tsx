'use client'
import { Summary } from '@/lib/types'
import { formatRupiah } from '@/lib/utils'

interface Props { summary: Summary; loading: boolean }

export default function SummaryCard({ summary, loading }: Props) {
  const cards = [
    {
      label: 'Pemasukan',
      value: summary.totalPemasukan,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
      icon: '↑',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pengeluaran',
      value: summary.totalPengeluaran,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
      icon: '↓',
      iconBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Saldo Bersih',
      value: summary.saldo,
      color: summary.saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400',
      bg: summary.saldo >= 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      icon: '≈',
      iconBg: summary.saldo >= 0 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-2xl border p-3 sm:p-5 ${card.bg}`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">{card.label}</span>
            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${card.iconBg}`}>
              {card.icon}
            </span>
          </div>
          {loading ? (
            <div className="h-5 sm:h-7 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-full" />
          ) : (
            <p className={`text-sm sm:text-xl font-bold leading-tight ${card.color}`}>
              {formatRupiah(card.value)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
