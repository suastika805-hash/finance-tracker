'use client'
import { useState, useEffect, useMemo } from 'react'
import { Transaction } from '@/lib/types'

export default function ReportSection({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetch(`/api/transactions?user_id=${userId}`)
      .then(r => r.json())
      .then(data => {
        setTransactions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  const reportData = useMemo(() => {
    let totalPemasukan = 0
    let totalPengeluaran = 0

    const yearly: Record<string, { pemasukan: number; pengeluaran: number }> = {}
    const monthly: Record<string, { pemasukan: number; pengeluaran: number }> = {}
    const weekly: Record<string, { pemasukan: number; pengeluaran: number }> = {}
    const daily: Record<string, { pemasukan: number; pengeluaran: number }> = {}

    transactions.forEach(t => {
      const isPemasukan = t.type === 'pemasukan'
      const amount = t.amount
      
      // Totals
      if (isPemasukan) totalPemasukan += amount
      else totalPengeluaran += amount

      const year = t.date.substring(0, 4)
      const month = t.date.substring(0, 7) // YYYY-MM
      const day = t.date // YYYY-MM-DD
      
      const dateObj = new Date(t.date)
      const dayOfWeek = dateObj.getDay() || 7 // 1-7 (Mon-Sun)
      const weekStart = new Date(dateObj)
      weekStart.setDate(dateObj.getDate() - dayOfWeek + 1)
      const weekKey = weekStart.toISOString().substring(0, 10)

      // Yearly
      if (!yearly[year]) yearly[year] = { pemasukan: 0, pengeluaran: 0 }
      if (isPemasukan) yearly[year].pemasukan += amount
      else yearly[year].pengeluaran += amount

      // Monthly
      if (!monthly[month]) monthly[month] = { pemasukan: 0, pengeluaran: 0 }
      if (isPemasukan) monthly[month].pemasukan += amount
      else monthly[month].pengeluaran += amount

      // Weekly
      if (!weekly[weekKey]) weekly[weekKey] = { pemasukan: 0, pengeluaran: 0 }
      if (isPemasukan) weekly[weekKey].pemasukan += amount
      else weekly[weekKey].pengeluaran += amount

      // Daily
      if (!daily[day]) daily[day] = { pemasukan: 0, pengeluaran: 0 }
      if (isPemasukan) daily[day].pemasukan += amount
      else daily[day].pengeluaran += amount
    })

    const saldo = totalPemasukan - totalPengeluaran

    const yearlyArray = Object.keys(yearly).sort((a, b) => b.localeCompare(a)).map(year => ({
      year,
      ...yearly[year],
      saldo: yearly[year].pemasukan - yearly[year].pengeluaran
    }))

    const monthlyArray = Object.keys(monthly).sort((a, b) => b.localeCompare(a)).map(month => {
      const [y, m] = month.split('-')
      const dateObj = new Date(parseInt(y), parseInt(m) - 1)
      const monthLabel = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      return {
        monthRaw: month,
        monthLabel,
        ...monthly[month],
        saldo: monthly[month].pemasukan - monthly[month].pengeluaran
      }
    })

    const weeklyArray = Object.keys(weekly).sort((a, b) => b.localeCompare(a)).map(week => {
      const start = new Date(week)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      const weekLabel = `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      return {
        weekRaw: week,
        weekLabel,
        ...weekly[week],
        saldo: weekly[week].pemasukan - weekly[week].pengeluaran
      }
    })

    const dailyArray = Object.keys(daily).sort((a, b) => b.localeCompare(a)).map(day => {
      const dateObj = new Date(day)
      const dayLabel = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      return {
        dayRaw: day,
        dayLabel,
        ...daily[day],
        saldo: daily[day].pemasukan - daily[day].pengeluaran
      }
    })

    return { totalPemasukan, totalPengeluaran, saldo, yearly: yearlyArray, monthly: monthlyArray, weekly: weeklyArray, daily: dailyArray }
  }, [transactions])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <h2 className="text-blue-100 font-medium mb-1 relative z-10">Total Uang Tersedia</h2>
        <p className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight relative z-10">
          {formatCurrency(reportData.saldo)}
        </p>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-blue-100 text-sm mb-1 flex items-center gap-1.5">
              <span className="bg-green-500/20 text-green-300 rounded p-0.5">↓</span> Total Pemasukan
            </p>
            <p className="text-lg sm:text-xl font-semibold">{formatCurrency(reportData.totalPemasukan)}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-blue-100 text-sm mb-1 flex items-center gap-1.5">
              <span className="bg-rose-500/20 text-rose-300 rounded p-0.5">↑</span> Total Pengeluaran
            </p>
            <p className="text-lg sm:text-xl font-semibold">{formatCurrency(reportData.totalPengeluaran)}</p>
          </div>
        </div>
      </div>

      {/* Yearly Report */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">📅 Laporan Tahunan</h3>
        </div>
        <div className="p-5">
          {reportData.yearly.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">Belum ada data.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reportData.yearly.map((item) => (
                <div key={item.year} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{item.year}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.saldo >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                      {item.saldo >= 0 ? 'Surplus' : 'Defisit'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Pemasukan</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(item.pemasukan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Pengeluaran</span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(item.pengeluaran)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Sisa / Saldo</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.saldo)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Report */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">📆 Laporan Bulanan</h3>
        </div>
        <div className="p-0 sm:p-5">
          {reportData.monthly.length === 0 ? (
            <p className="text-gray-500 text-sm text-center p-5">Belum ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 uppercase border-b border-gray-200 dark:border-gray-700 hidden sm:table-header-group">
                  <tr>
                    <th className="px-4 py-3">Bulan</th>
                    <th className="px-4 py-3 text-right">Pemasukan</th>
                    <th className="px-4 py-3 text-right">Pengeluaran</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reportData.monthly.map((item) => (
                    <tr key={item.monthRaw} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:table-row p-4 sm:p-0">
                      <td className="px-0 sm:px-4 py-2 sm:py-4 font-medium text-gray-900 dark:text-white mb-2 sm:mb-0">
                        {item.monthLabel}
                      </td>
                      <td className="px-0 sm:px-4 py-1 sm:py-4 sm:text-right flex justify-between sm:table-cell">
                        <span className="sm:hidden text-gray-500">Pemasukan</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(item.pemasukan)}</span>
                      </td>
                      <td className="px-0 sm:px-4 py-1 sm:py-4 sm:text-right flex justify-between sm:table-cell">
                        <span className="sm:hidden text-gray-500">Pengeluaran</span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">{formatCurrency(item.pengeluaran)}</span>
                      </td>
                      <td className="px-0 sm:px-4 py-2 sm:py-4 sm:text-right flex justify-between sm:table-cell mt-2 sm:mt-0 pt-2 sm:pt-4 border-t border-gray-100 dark:border-gray-800 sm:border-0">
                        <span className="sm:hidden text-gray-700 font-medium">Saldo</span>
                        <span className={`font-bold ${item.saldo >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(item.saldo)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Report */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">📅 Laporan Mingguan</h3>
        </div>
        <div className="p-0 sm:p-5">
          {reportData.weekly.length === 0 ? (
            <p className="text-gray-500 text-sm text-center p-5">Belum ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 uppercase border-b border-gray-200 dark:border-gray-700 hidden sm:table-header-group">
                  <tr>
                    <th className="px-4 py-3">Minggu</th>
                    <th className="px-4 py-3 text-right">Pemasukan</th>
                    <th className="px-4 py-3 text-right">Pengeluaran</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reportData.weekly.map((item) => (
                    <tr key={item.weekRaw} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:table-row p-4 sm:p-0">
                      <td className="px-0 sm:px-4 py-2 sm:py-4 font-medium text-gray-900 dark:text-white mb-2 sm:mb-0 whitespace-nowrap">
                        {item.weekLabel}
                      </td>
                      <td className="px-0 sm:px-4 py-1 sm:py-4 sm:text-right flex justify-between sm:table-cell">
                        <span className="sm:hidden text-gray-500">Pemasukan</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(item.pemasukan)}</span>
                      </td>
                      <td className="px-0 sm:px-4 py-1 sm:py-4 sm:text-right flex justify-between sm:table-cell">
                        <span className="sm:hidden text-gray-500">Pengeluaran</span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">{formatCurrency(item.pengeluaran)}</span>
                      </td>
                      <td className="px-0 sm:px-4 py-2 sm:py-4 sm:text-right flex justify-between sm:table-cell mt-2 sm:mt-0 pt-2 sm:pt-4 border-t border-gray-100 dark:border-gray-800 sm:border-0">
                        <span className="sm:hidden text-gray-700 font-medium">Saldo</span>
                        <span className={`font-bold ${item.saldo >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(item.saldo)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Daily Report */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">☀️ Laporan Harian</h3>
        </div>
        <div className="p-0 sm:p-5">
          {reportData.daily.length === 0 ? (
            <p className="text-gray-500 text-sm text-center p-5">Belum ada data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 uppercase border-b border-gray-200 dark:border-gray-700 hidden sm:table-header-group">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Pemasukan</th>
                    <th className="px-4 py-3 text-right">Pengeluaran</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reportData.daily.map((item) => (
                    <tr key={item.dayRaw} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col sm:table-row p-4 sm:p-0">
                      <td className="px-0 sm:px-4 py-2 sm:py-4 font-medium text-gray-900 dark:text-white mb-2 sm:mb-0 whitespace-nowrap">
                        {item.dayLabel}
                      </td>
                      <td className="px-0 sm:px-4 py-1 sm:py-4 sm:text-right flex justify-between sm:table-cell">
                        <span className="sm:hidden text-gray-500">Pemasukan</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(item.pemasukan)}</span>
                      </td>
                      <td className="px-0 sm:px-4 py-1 sm:py-4 sm:text-right flex justify-between sm:table-cell">
                        <span className="sm:hidden text-gray-500">Pengeluaran</span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">{formatCurrency(item.pengeluaran)}</span>
                      </td>
                      <td className="px-0 sm:px-4 py-2 sm:py-4 sm:text-right flex justify-between sm:table-cell mt-2 sm:mt-0 pt-2 sm:pt-4 border-t border-gray-100 dark:border-gray-800 sm:border-0">
                        <span className="sm:hidden text-gray-700 font-medium">Saldo</span>
                        <span className={`font-bold ${item.saldo >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(item.saldo)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
