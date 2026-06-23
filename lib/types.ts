export type TransactionType = 'pemasukan' | 'pengeluaran'

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category_id: string | null
  note: string | null
  date: string
  created_at: string
  updated_at: string
  categories?: Category
  is_recurring?: boolean
  recurring_day?: number | null
}

export interface TransactionFormData {
  type: TransactionType
  amount: number
  category_id: string
  note: string
  date: string
  is_recurring: boolean
  recurring_day: number
}

export interface Summary {
  totalPemasukan: number
  totalPengeluaran: number
  saldo: number
}

export interface Budget {
  id: string
  category_id: string
  limit_amount: number
  month: string
  spent?: number
  categories?: Category
}

export interface ChartDataItem {
  name: string
  value: number
  icon: string
  color: string
}

export interface WishlistItem {
  id: string
  user_id: string
  name: string
  price: number
  category_id: string | null
  status: 'pending' | 'purchased'
  note: string | null
  created_at: string
  updated_at: string
  categories?: Category
}
