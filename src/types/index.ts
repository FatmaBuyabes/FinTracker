export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: CategoryType
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  type: TransactionType
  title: string
  description: string | null
  date: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
  category?: Category
  spent?: number
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  transactionCount: number
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export interface CategorySpending {
  name: string
  value: number
  color: string
  icon: string
}
