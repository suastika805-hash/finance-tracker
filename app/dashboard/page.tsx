'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Transaction, Summary } from '@/lib/types'
import { getCurrentMonth, getMonthLabel } from '@/lib/utils'
import SummaryCard from '@/components/SummaryCard'
import TransactionForm from '@/components/TransactionForm'
import TransactionList from '@/components/TransactionList'
import ChartSection from '@/components/ChartSection'
import BudgetSection from '@/components/BudgetSection'
import ExportButton from '@/components/ExportButton'
import DarkModeToggle from '@/components/DarkModeToggle'
import CategoryManager from '@/components/CategoryManager'
import WishlistSection from '@/components/WishlistSection'
import ReportSection from '@/components/ReportSection'

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; pemasukan: number; pengeluaran: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [editData, setEditData] = useState<Transaction | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth())
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'transaksi' | 'grafik' | 'budget' | 'wishlist' | 'kategori' | 'laporan'>('transaksi')

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else { setUserId(data.user.id); setUserEmail(data.user.email || '') }
    })
  }, [router])

  const summary: Summary = {
    totalPemasukan: transactions.filter(t => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0),
    totalPengeluaran: transactions.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0),
    saldo: 0,
  }
  summary.saldo = summary.totalPemasukan - summary.totalPengeluaran

  const fetchTransactions = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const params = new URLSearchParams({ user_id: userId })
    if (filterMonth) params.set('month', filterMonth)
    if (filterType) params.set('type', filterType)
    if (search) params.set('search', search)

    const res = await fetch(`/api/transactions?${params}`)
    const data = await res.json()
    setTransactions(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [userId, filterMonth, filterType, search])

  // Fetch 6 month trend
  const fetchMonthlyTrend = useCallback(async () => {
    if (!userId) return
    const months: { month: string; pemasukan: number; pengeluaran: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const month = d.toISOString().slice(0, 7)
      const shortMonth = d.toLocaleDateString('id-ID', { month: 'short' })
      const res = await fetch(`/api/transactions?user_id=${userId}&month=${month}`)
      const raw = await res.json()
      const data: Transaction[] = Array.isArray(raw) ? raw : []
      months.push({
        month: shortMonth,
        pemasukan: data.filter(t => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0),
        pengeluaran: data.filter(t => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0),
      })
    }
    setMonthlyData(months)
  }, [userId])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])
  useEffect(() => { fetchMonthlyTrend() }, [fetchMonthlyTrend])

  // Fetch all for chart (no type filter)
  useEffect(() => {
    if (!userId) return
    fetch(`/api/transactions?user_id=${userId}&month=${filterMonth}`)
      .then(r => r.json()).then(data => setAllTransactions(Array.isArray(data) ? data : []))
  }, [userId, filterMonth])

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchTransactions(); fetchMonthlyTrend()
  }

  const handleEdit = (t: Transaction) => {
    setEditData(t); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormSuccess = () => {
    setEditData(null); setShowForm(false)
    fetchTransactions(); fetchMonthlyTrend()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const TABS = [
    { key: 'transaksi', label: '📋', fullLabel: '📋 Transaksi' },
    { key: 'grafik', label: '📊', fullLabel: '📊 Grafik' },
    { key: 'budget', label: '🎯', fullLabel: '🎯 Budget' },
    { key: 'wishlist', label: '🎁', fullLabel: '🎁 Target Beli' },
    { key: 'kategori', label: '🏷️', fullLabel: '🏷️ Kategori' },
    { key: 'laporan', label: '📝', fullLabel: '📝 Laporan' },
  ] as const

  if (!userId) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 dark:text-gray-500 text-sm">Memuat...</p>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">💸 CatatUang</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] sm:max-w-xs">{userEmail}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <DarkModeToggle />
            <button
              onClick={() => { setShowForm(!showForm); setEditData(null) }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {showForm && !editData ? '✕' : '＋'}
              <span className="hidden sm:inline ml-1">{showForm && !editData ? 'Tutup' : 'Tambah'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden sm:block"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Summary */}
        <SummaryCard summary={summary} loading={loading} />

        {/* Form */}
        {(showForm || editData) && (
          <TransactionForm
            editData={editData}
            userId={userId}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditData(null) }}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              <span className="sm:hidden">{tab.label}</span>
              <span className="hidden sm:inline">{tab.fullLabel}</span>
            </button>
          ))}
        </div>

        {/* Tab: Transaksi */}
        {activeTab === 'transaksi' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Header transaksi */}
            <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-1">
                {getMonthLabel(filterMonth)}
              </h2>
              <ExportButton transactions={transactions} month={filterMonth} />
            </div>

            {/* Filter */}
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-2">
              {/* Baris 1: Search */}
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Cari catatan..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
              {/* Baris 2: Month + Type */}
              <div className="flex gap-2">
                <input
                  type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white min-w-0"
                />
                <select
                  value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-white min-w-0"
                >
                  <option value="">Semua</option>
                  <option value="pemasukan">Pemasukan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <TransactionList
                transactions={transactions}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}

        {/* Tab: Grafik */}
        {activeTab === 'grafik' && (
          <ChartSection transactions={allTransactions} monthlyData={monthlyData} />
        )}

        {/* Tab: Budget */}
        {activeTab === 'budget' && (
          <BudgetSection userId={userId} month={filterMonth} />
        )}

        {/* Tab: Target Beli */}
        {activeTab === 'wishlist' && (
          <WishlistSection
            userId={userId}
            currentBalance={summary.saldo}
            onSuccess={() => {
              fetchTransactions()
              fetchMonthlyTrend()
            }}
          />
        )}

        {/* Tab: Kategori */}
        {activeTab === 'kategori' && (
          <CategoryManager onCategoryAdded={() => { /* refresh if needed */ }} />
        )}

        {/* Tab: Laporan */}
        {activeTab === 'laporan' && (
          <ReportSection userId={userId} />
        )}

        {/* Footer spacing for mobile */}
        <div className="h-4" />
      </div>

      {/* Mobile logout button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex justify-center">
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5"
        >
          <span>🚪</span> Keluar dari akun
        </button>
      </div>
    </main>
  )
}
