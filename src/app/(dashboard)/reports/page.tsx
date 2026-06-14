import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ReportsClient } from './_client'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const currency = 'USD'
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const monthlyData: any[] = []
  let categoryData: any[] = []
  let yearIncome = 0, yearExpenses = 0, savingsRate = 0

  if (user) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const start = `${y}-${String(m).padStart(2, '0')}-01`
      const end = new Date(y, m, 0).toISOString().split('T')[0]
      const { data: tx } = await supabase.from('transactions').select('amount, type, category_id').eq('user_id', user.id).gte('date', start).lte('date', end)
      const income = (tx ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = (tx ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      monthlyData.push({ month: `${String(m).padStart(2, '0')}/${String(y).slice(2)}`, income, expenses })
    }
    const firstDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const lastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
    const { data: categoryTx } = await supabase.from('transactions').select('amount, type, category:categories(name, color, icon)').eq('user_id', user.id).eq('type', 'expense').gte('date', firstDay).lte('date', lastDay)
    const catMap = new Map<string, { name: string; value: number; color: string; icon: string }>()
    ;(categoryTx ?? []).forEach((tx: any) => {
      const name = tx.category?.name ?? 'Other'
      const existing = catMap.get(name)
      if (existing) existing.value += tx.amount
      else catMap.set(name, { name, value: tx.amount, color: tx.category?.color ?? '#94a3b8', icon: tx.category?.icon ?? 'circle' })
    })
    categoryData = Array.from(catMap.values()).sort((a, b) => b.value - a.value)
    const { data: yearTx } = await supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('date', `${currentYear}-01-01`).lte('date', `${currentYear}-12-31`)
    yearIncome = (yearTx ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    yearExpenses = (yearTx ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    savingsRate = yearIncome > 0 ? ((yearIncome - yearExpenses) / yearIncome) * 100 : 0
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      monthlyData.push({ month: `${String(m).padStart(2, '0')}/${String(y).slice(2)}`, income: 0, expenses: 0 })
    }
  }

  return (
    <div>
      <Header title="Reports & Insights" subtitle={`Financial overview for ${currentYear}`} />
      <ReportsClient
        monthlyData={monthlyData as any}
        categoryData={categoryData}
        currency={currency}
        yearIncome={yearIncome}
        yearExpenses={yearExpenses}
        savingsRate={savingsRate}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  )
}
