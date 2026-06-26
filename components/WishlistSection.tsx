'use client'
import { useState, useEffect } from 'react'
import { WishlistItem, Category } from '@/lib/types'
import { formatRupiah } from '@/lib/utils'

interface Props {
  userId: string
  currentBalance: number
  onSuccess: () => void
}

export default function WishlistSection({ userId, currentBalance, onSuccess }: Props) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<WishlistItem | null>(null)
  const [form, setForm] = useState({ name: '', price: 0, category_id: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchWishlist = async () => {
    const res = await fetch(`/api/wishlist?user_id=${userId}`)
    const data = await res.json()
    setWishlist(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(data =>
      setCategories(data.filter((c: Category) => c.type === 'pengeluaran'))
    )
    fetchWishlist()
  }, [userId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.price || form.price <= 0) {
      setError('Harga estimasi harus lebih dari 0')
      setLoading(false)
      return
    }

    const url = editItem ? `/api/wishlist/${editItem.id}` : '/api/wishlist'
    const method = editItem ? 'PUT' : 'POST'
    const body = editItem 
      ? { ...form, status: editItem.status } 
      : { ...form, user_id: userId }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Gagal menyimpan target')
    } else {
      setForm({ name: '', price: 0, category_id: '', note: '' })
      setEditItem(null)
      setShowForm(false)
      fetchWishlist()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus target pembelian ini?')) return
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
    fetchWishlist()
  }

  const handleAcc = async (id: string) => {
    if (!confirm('ACC target pembelian ini? Data akan dipindahkan ke daftar Pengeluaran Transaksi.')) return
    setLoading(true)
    const res = await fetch(`/api/wishlist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'purchased' })
    })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'Gagal melakukan ACC target pembelian')
    } else {
      fetchWishlist()
      onSuccess() // Memicu update data transaksi & trend di dashboard utama
    }
    setLoading(false)
  }

  const handleEditClick = (item: WishlistItem) => {
    setEditItem(item)
    setForm({
      name: item.name,
      price: item.price,
      category_id: item.category_id || '',
      note: item.note || ''
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setForm({ name: '', price: 0, category_id: '', note: '' })
    setEditItem(null)
    setShowForm(false)
  }

  const pendingItems = wishlist.filter(item => item.status === 'pending')
  const purchasedItems = wishlist.filter(item => item.status === 'purchased')
  const totalPendingEstimate = pendingItems.reduce((acc, curr) => acc + curr.price, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            🎁 Rencana & Target Pembelian
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Total Estimasi Belum Terbeli: <span className="font-semibold text-rose-500 dark:text-rose-400">{formatRupiah(totalPendingEstimate)}</span>
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              handleCancel()
            } else {
              setShowForm(true)
            }
          }}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          {showForm ? 'Batal' : '+ Tambah Target'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {editItem ? '✏️ Edit Target Pembelian' : '＋ Tambah Target Pembelian'}
          </h4>
          {error && (
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Barang / Target</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Sepatu Baru, Laptop, Liburan"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estimasi Harga (Rp)</label>
                <input type="number" min="1" required value={form.price || ''}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  placeholder="500000"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kategori Pengeluaran</label>
                <select required value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Catatan Tambahan (opsional)</label>
              <input type="text" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Spesifikasi, toko, atau alasan menunda..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 sm:flex-initial bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
              {loading ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Simpan Rencana'}
            </button>
            <button type="button" onClick={handleCancel}
              className="border border-gray-200 dark:border-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Wishlist Lists */}
      <div className="px-4 sm:px-5 pb-5 space-y-6">
        
        {/* Belum Terbeli (Pending) */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase mb-3">Belum Terbeli</h4>
          {pendingItems.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
              Tidak ada rencana pembelian tertunda.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingItems.map((item) => {
                const isAffordable = currentBalance >= item.price
                return (
                  <div key={item.id} className="border border-gray-100 dark:border-gray-700/70 dark:bg-gray-900/10 p-4 rounded-2xl flex flex-col justify-between gap-3 hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</h5>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider ${
                          isAffordable
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {isAffordable ? 'Uang Cukup' : 'Belum Cukup'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span>{item.categories?.icon || '📦'}</span>
                        <span className="truncate">{item.categories?.name || 'Lainnya'}</span>
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-white pt-1">{formatRupiah(item.price)}</p>
                      {item.note && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic line-clamp-2">"{item.note}"</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-gray-700/30">
                      <button
                        onClick={() => handleAcc(item.id)}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        ✅ ACC Beli
                      </button>
                      <button
                        onClick={() => handleEditClick(item)}
                        disabled={loading}
                        className="px-3 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl transition-colors text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={loading}
                        className="px-3 border border-gray-200 dark:border-gray-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-colors text-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sudah Terbeli (Purchased) */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider uppercase mb-3">Sudah Terbeli / Di-ACC</h4>
          {purchasedItems.length === 0 ? (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 italic">
              Belum ada target yang terbeli.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {purchasedItems.map((item) => (
                <div key={item.id} className="border border-emerald-100/50 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 p-3 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="font-semibold text-xs text-gray-600 dark:text-gray-300 truncate line-through">{item.name}</h5>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold bg-emerald-100/60 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Terbeli</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-500 dark:hover:text-rose-400 text-xs flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
