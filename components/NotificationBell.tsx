'use client'

import { useState, useEffect, useRef } from 'react'
import { Budget, WishlistItem } from '@/lib/types'
import { getCurrentMonth } from '@/lib/utils'

interface AppNotification {
  id: string
  type: 'critical' | 'warning' | 'success'
  title: string
  message: string
}

export default function NotificationBell({ userId, saldo }: { userId: string, saldo: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!userId) return

    const checkNotifications = async () => {
      try {
        const notifs: AppNotification[] = []
        
        // 1. Check Budgets
        const month = getCurrentMonth()
        const bRes = await fetch(`/api/budgets?user_id=${userId}&month=${month}`)
        if (bRes.ok) {
          const budgets: Budget[] = await bRes.json()
          budgets.forEach(b => {
            const spent = b.spent || 0
            const limit = b.limit_amount
            const catName = b.categories?.name || 'Kategori'
            
            if (spent >= limit) {
              notifs.push({
                id: `budget_crit_${b.id}`,
                type: 'critical',
                title: 'Budget Jebol!',
                message: `Pengeluaran ${catName} (Rp ${spent.toLocaleString('id-ID')}) telah melebihi batas budget (Rp ${limit.toLocaleString('id-ID')}).`
              })
            } else if (spent >= limit * 0.8) {
              notifs.push({
                id: `budget_warn_${b.id}`,
                type: 'warning',
                title: 'Budget Menipis',
                message: `Pengeluaran ${catName} sudah mencapai ${(spent/limit*100).toFixed(0)}% dari budget.`
              })
            }
          })
        }

        // 2. Check Wishlists
        const wRes = await fetch(`/api/wishlist?user_id=${userId}`)
        if (wRes.ok) {
          const wishlists: WishlistItem[] = await wRes.json()
          wishlists.filter(w => w.status === 'pending').forEach(w => {
            if (saldo >= w.price) {
              notifs.push({
                id: `wishlist_succ_${w.id}`,
                type: 'success',
                title: 'Target Tercapai!',
                message: `Saldo kamu (Rp ${saldo.toLocaleString('id-ID')}) sudah cukup untuk membeli ${w.name} (Rp ${w.price.toLocaleString('id-ID')})!`
              })
            }
          })
        }

        setNotifications(notifs)
      } catch (e) {
        console.error("Failed to fetch notifications:", e)
      }
    }

    checkNotifications()
  }, [userId, saldo])

  const unreadCount = notifications.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors relative"
      >
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm z-10 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifikasi</h3>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-full font-medium">
              {unreadCount} Baru
            </span>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-3 mb-1 rounded-xl flex gap-3 items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                    n.type === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                    n.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}>
                    {n.type === 'critical' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    {n.type === 'warning' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {n.type === 'success' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
