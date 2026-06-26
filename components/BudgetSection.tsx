'use client'
import { useState, useEffect } from 'react'
import { Budget, Category } from '@/lib/types'
import { formatRupiah } from '@/lib/utils'

interface Props { userId: string; month: string }

export default function BudgetSection({ userId, month }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category_id: '', limit_amount: 0 })
  const [loading, setLoading] = useState(false)

  const fetchBudgets = async () => {
    const res = await fetch(`/api/budgets?user_id=${userId}&month=${month}`)
    const data = await res.json()
    setBudgets(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data =>
      setCategories(data.filter((c: Category) => c.type === 'pengeluaran'))
    )
    fetchBudgets()
  }, [month])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, user_id: userId, month }),
    })
    setForm({ category_id: '', limit_amount: 0 })
    setShowForm(false)
    fetchBudgets()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus budget ini?')) return
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
    fetchBudgets()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🎯 Budget Limit</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          {showForm ? 'Batal' : '+ Tambah Budget'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
              <select required value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="">Pilih kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Limit (Rp)</label>
              <input type="text" inputMode="numeric" required value={form.limit_amount ? form.limit_amount.toLocaleString('id-ID') : ''}
                onChange={e => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  setForm(f => ({ ...f, limit_amount: rawValue ? Number(rawValue) : 0 }))
                }}
                placeholder="Contoh: 500.000"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
            {loading ? 'Menyimpan...' : 'Simpan Budget'}
          </button>
        </form>
      )}

      {/* Budget List */}
      <div className="p-4 sm:p-5 space-y-4">
        {budgets.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
            Belum ada budget. Tambahkan untuk memantau pengeluaran!
          </p>
        ) : budgets.map((b) => {
          const spent = b.spent || 0
          const pct = Math.min((spent / b.limit_amount) * 100, 100)
          const isWarning = pct >= 80
          const isOver = spent > b.limit_amount
          return (
            <div key={b.id} className="space-y-2">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg shrink-0">{b.categories?.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{b.categories?.name}</span>
                  {isOver && (
                    <span className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full shrink-0">⚠️ Melebihi!</span>
                  )}
                  {!isOver && isWarning && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">Hampir penuh</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatRupiah(spent)} / {formatRupiah(b.limit_amount)}</span>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-500 dark:hover:text-rose-400 text-xs flex items-center justify-center transition-colors"
                  >✕</button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>{pct.toFixed(0)}% terpakai</span>
                <span>Sisa: {formatRupiah(Math.max(0, b.limit_amount - spent))}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
