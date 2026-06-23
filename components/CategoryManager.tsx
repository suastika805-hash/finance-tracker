'use client'
import { useState, useEffect } from 'react'
import { Category, TransactionType } from '@/lib/types'

const EMOJI_OPTIONS = [
  '💰','💸','🏠','🚗','🍜','🛒','🎬','🏥','📚','📄','🎁','💻','📈','🏪',
  '✈️','👗','⚽','🎮','💊','🐾','🌿','🏋️','🎵','📱','💼','🔧','🎯','🍕',
  '☕','🚌','🏦','💎','🌟','➕','➖','🔄','💡','🎨','📦','🛡️',
]

interface Props {
  onCategoryAdded?: () => void
}

export default function CategoryManager({ onCategoryAdded }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('pengeluaran')
  const [form, setForm] = useState({ name: '', type: 'pengeluaran' as TransactionType, icon: '💰' })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
  }

  useEffect(() => { fetchCategories() }, [])

  const filtered = categories.filter(c => c.type === activeTab)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama kategori wajib diisi'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Gagal menambahkan kategori')
    } else {
      setForm({ name: '', type: form.type, icon: '💰' })
      setShowForm(false)
      await fetchCategories()
      onCategoryAdded?.()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Transaksi yang menggunakan kategori ini akan kehilangan kategorinya.`)) return
    setDeleting(id)
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
    await fetchCategories()
    onCategoryAdded?.()
    setDeleting(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">🏷️ Kelola Kategori</h3>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          {showForm ? 'Batal' : '+ Tambah'}
        </button>
      </div>

      {/* Form Tambah */}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-3">
          {error && <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">{error}</p>}
          
          {/* Tipe */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tipe Kategori</label>
            <div className="flex gap-2">
              {(['pemasukan', 'pengeluaran'] as TransactionType[]).map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    form.type === t
                      ? t === 'pemasukan' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                  }`}>
                  {t === 'pemasukan' ? '↑ Pemasukan' : '↓ Pengeluaran'}
                </button>
              ))}
            </div>
          </div>

          {/* Icon + Nama */}
          <div className="flex gap-2 items-start">
            {/* Emoji Picker */}
            <div className="relative">
              <button type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-12 h-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xl flex items-center justify-center hover:border-indigo-400 transition-colors"
              >
                {form.icon}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-12 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 w-64">
                  <div className="grid grid-cols-8 gap-1.5">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button key={emoji} type="button"
                        onClick={() => { setForm(f => ({ ...f, icon: emoji })); setShowEmojiPicker(false) }}
                        className={`w-7 h-7 rounded-lg text-base flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${form.icon === emoji ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Nama */}
            <div className="flex-1">
              <input
                type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nama kategori..."
                maxLength={30}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan Kategori'}
          </button>
        </form>
      )}

      {/* Tab Tipe */}
      <div className="flex gap-1 p-3 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
        {(['pengeluaran', 'pemasukan'] as TransactionType[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === t
                ? t === 'pemasukan' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {t === 'pemasukan' ? '↑ Pemasukan' : '↓ Pengeluaran'} ({categories.filter(c => c.type === t).length})
          </button>
        ))}
      </div>

      {/* List Kategori */}
      <div className="p-3 sm:p-4">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
            Belum ada kategori {activeTab}. Tambahkan sekarang!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map(cat => (
              <div key={cat.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl px-3 py-2.5 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{cat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{cat.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={deleting === cat.id}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-500 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800 text-xs flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                  title="Hapus"
                >
                  {deleting === cat.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
