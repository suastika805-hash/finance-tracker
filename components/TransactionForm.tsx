'use client'
import { useState, useEffect } from 'react'
import { Category, Transaction, TransactionFormData, TransactionType } from '@/lib/types'

interface Props {
  editData?: Transaction | null
  userId: string
  onSuccess: () => void
  onCancel?: () => void
}

const defaultForm: TransactionFormData = {
  type: 'pengeluaran', amount: 0, category_id: '', note: '',
  date: new Date().toISOString().split('T')[0], is_recurring: false, recurring_day: 1,
}

export default function TransactionForm({ editData, userId, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<TransactionFormData>(defaultForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetch('/api/categories').then(r => r.json()).then(setCategories) }, [])

  useEffect(() => {
    if (editData) {
      setForm({
        type: editData.type, amount: editData.amount, category_id: editData.category_id || '',
        note: editData.note || '', date: editData.date,
        is_recurring: editData.is_recurring || false, recurring_day: editData.recurring_day || 1,
      })
    } else { setForm(defaultForm) }
  }, [editData])

  const filteredCategories = categories.filter(c => c.type === form.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    if (!form.amount || form.amount <= 0) { setError('Nominal harus lebih dari 0'); setLoading(false); return }

    const url = editData ? `/api/transactions/${editData.id}` : '/api/transactions'
    const method = editData ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, user_id: userId }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Gagal menyimpan') }
    else { setForm(defaultForm); onSuccess() }
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4 sm:mb-5">
        {editData ? '✏️ Edit Transaksi' : '＋ Tambah Transaksi'}
      </h2>
      {error && (
        <div className="mb-4 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipe */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tipe</label>
          <div className="flex gap-2 sm:gap-3">
            {(['pemasukan', 'pengeluaran'] as TransactionType[]).map((t) => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.type === t
                    ? t === 'pemasukan' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}>
                {t === 'pemasukan' ? '↑ Pemasukan' : '↓ Pengeluaran'}
              </button>
            ))}
          </div>
        </div>

        {/* Nominal */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nominal (Rp)</label>
          <input type="text" inputMode="numeric" required value={form.amount ? form.amount.toLocaleString('id-ID') : ''}
            onChange={e => {
              const rawValue = e.target.value.replace(/[^0-9]/g, '');
              setForm(f => ({ ...f, amount: rawValue ? Number(rawValue) : 0 }))
            }}
            placeholder="Contoh: 500.000"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Kategori</label>
          <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-white">
            <option value="">-- Pilih Kategori --</option>
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Tanggal */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tanggal</label>
          <input type="date" required value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Recurring */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="recurring" checked={form.is_recurring}
              onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
              className="w-4 h-4 accent-blue-600" />
            <label htmlFor="recurring" className="text-sm text-gray-600 dark:text-gray-300">Transaksi Rutin Bulanan</label>
          </div>
          {form.is_recurring && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500 dark:text-gray-400">Hari ke-</span>
              <input type="number" min="1" max="31" value={form.recurring_day}
                onChange={e => setForm(f => ({ ...f, recurring_day: Number(e.target.value) }))}
                className="w-16 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Catatan (opsional)</label>
          <textarea rows={2} value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Keterangan tambahan..."
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div className="flex gap-2 sm:gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
            {loading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Transaksi'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
