import { Plus, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { BudgetsClient } from './_client'

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const month = params.month ? parseInt(params.month) : new Date().getMonth() + 1
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  let profile = null, categories: any[] = [], budgetsWithSpent: any[] = []

  if (user) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
    ;({ data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).single())
    ;({ data: categories = [] } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name'))
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, category:categories(id, name, icon, color, type, is_default, user_id, created_at)')
      .eq('user_id', user.id).eq('month', month).eq('year', year)
    const { data: spendingTx } = await supabase
      .from('transactions').select('category_id, amount')
      .eq('user_id', user.id).eq('type', 'expense').gte('date', firstDay).lte('date', lastDay)
    const spentMap = (spendingTx ?? []).reduce((acc, tx) => {
      if (tx.category_id) acc[tx.category_id] = (acc[tx.category_id] ?? 0) + tx.amount
      return acc
    }, {} as Record<string, number>)
    budgetsWithSpent = (budgets ?? []).map(b => ({ ...b, spent: spentMap[b.category_id] ?? 0 }))
  }

  return (
    <div>
      <Header title="Budgets" subtitle="Set and track your monthly spending limits" />
      <BudgetsClient
        budgets={budgetsWithSpent as any}
        categories={categories ?? []}
        currency={profile?.currency ?? 'USD'}
        currentMonth={month}
        currentYear={year}
      />
    </div>
  )
}
