'use client'
import { Transaction } from '@/lib/types'
import { formatRupiah, formatDate } from '@/lib/utils'

interface Props {
  transactions: Transaction[]
  loading: boolean
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
}

export default function TransactionList({ transactions, loading, onEdit, onDelete }: Props) {
  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />
      ))}
    </div>
  )

  if (transactions.length === 0) return (
    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-sm">Belum ada transaksi. Tambahkan transaksi pertamamu!</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div key={t.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-3 sm:px-4 sm:py-3.5 hover:border-gray-200 dark:hover:border-gray-500 transition-all gap-3"
        >
          {/* Left: icon + info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg shrink-0 ${t.type === 'pemasukan' ? 'bg-emerald-50 dark:bg-emerald-900/40' : 'bg-rose-50 dark:bg-rose-900/40'}`}>
              {t.categories?.icon || (t.type === 'pemasukan' ? '💰' : '💸')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                <span className="truncate">{t.categories?.name || 'Tanpa Kategori'}</span>
                {t.is_recurring && (
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full shrink-0 font-medium">🔄 Rutin</span>
                )}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {formatDate(t.date)}{t.note ? ` · ${t.note}` : ''}
              </p>
            </div>
          </div>

          {/* Right: amount + actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-50 dark:border-gray-600/30 pt-2 sm:pt-0 shrink-0">
            <span className={`text-sm sm:text-base font-bold whitespace-nowrap ${t.type === 'pemasukan' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {t.type === 'pemasukan' ? '+' : '-'}{formatRupiah(t.amount)}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onEdit(t)}
                className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs flex items-center justify-center transition-colors"
                title="Edit"
              >✏️</button>
              <button
                onClick={() => { if (confirm('Hapus transaksi ini?')) onDelete(t.id) }}
                className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 text-xs flex items-center justify-center transition-colors"
                title="Hapus"
              >🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
