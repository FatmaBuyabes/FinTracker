import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { getCurrentMonth, getCurrentYear, getMonthName, getShortMonthName } from '@/lib/utils'
import type { MonthlyData, CategorySpending } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const month = getCurrentMonth()
  const year = getCurrentYear()

  const currency = 'USD'
  let transactions: Array<{ amount: number; type: string; title: string; date: string; category: { name: string; icon: string; color: string } | null }> = []
  let recentTx: any[] = []
  const monthlyData: MonthlyData[] = []

  if (user) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: profile } = await supabase.from('profiles').select('currency, full_name').eq('id', user.id).single()

    const { data: thisMonthTx } = await supabase
      .from('transactions')
      .select('amount, type, title, date, category:categories(name, icon, color)')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transactions = (thisMonthTx ?? []) as unknown as typeof transactions

    const { data: recent } = await supabase
      .from('transactions')
      .select('*, category:categories(id, name, icon, color, type, is_default, user_id, created_at)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)
    recentTx = recent ?? []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const start = `${y}-${String(m).padStart(2, '0')}-01`
      const end = new Date(y, m, 0).toISOString().split('T')[0]
      const { data: mTx } = await supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('date', start).lte('date', end)
      const income = (mTx ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = (mTx ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      monthlyData.push({ month: getShortMonthName(m), income, expenses })
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      monthlyData.push({ month: getShortMonthName(d.getMonth() + 1), income: 0, expenses: 0 })
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netSavings = totalIncome - totalExpenses

  const categoryMap = new Map<string, CategorySpending>()
  transactions.filter(t => t.type === 'expense' && t.category).forEach(t => {
    const name = t.category!.name
    if (categoryMap.has(name)) categoryMap.get(name)!.value += t.amount
    else categoryMap.set(name, { name, value: t.amount, color: t.category!.color, icon: t.category!.icon })
  })
  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value).slice(0, 6)

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const name = 'there'

  return (
    <div>
      <Header
        title={`${greeting}, ${name} 👋`}
        subtitle={`${getMonthName(month)} ${year} overview`}
      />

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Income"
            value={totalIncome}
            currency={currency}
            icon={TrendingUp}
            iconColor="text-success"
            iconBg="bg-success/10"
            subtitle={`${transactions.filter(t => t.type === 'income').length} transactions`}
          />
          <StatsCard
            title="Total Expenses"
            value={totalExpenses}
            currency={currency}
            icon={TrendingDown}
            iconColor="text-destructive"
            iconBg="bg-destructive/10"
            subtitle={`${transactions.filter(t => t.type === 'expense').length} transactions`}
          />
          <StatsCard
            title="Net Savings"
            value={Math.abs(netSavings)}
            currency={currency}
            icon={netSavings >= 0 ? PiggyBank : TrendingDown}
            iconColor={netSavings >= 0 ? 'text-primary' : 'text-warning'}
            iconBg={netSavings >= 0 ? 'bg-primary/10' : 'bg-warning/10'}
            subtitle={netSavings >= 0 ? 'Saved this month' : 'Overspent this month'}
          />
          <StatsCard
            title="Transactions"
            value={transactions.length}
            icon={DollarSign}
            iconColor="text-muted-foreground"
            iconBg="bg-muted"
            subtitle="This month"
            isCount
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MonthlyChart data={monthlyData} currency={currency} />
          </div>
          <CategoryChart data={categoryData} currency={currency} />
        </div>

        {/* Recent transactions */}
        <RecentTransactions transactions={(recentTx ?? []) as any} currency={currency} />
      </div>
    </div>
  )
}
