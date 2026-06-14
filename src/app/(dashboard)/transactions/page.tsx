import { Plus, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { TransactionsClient } from './_client'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; type?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const month = params.month ? parseInt(params.month) : new Date().getMonth() + 1
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  let profile = null, categories: any[] = [], transactions: any[] = []

  if (user) {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
    ;({ data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).single())
    ;({ data: categories = [] } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name'))
    ;({ data: transactions = [] } = await supabase
      .from('transactions')
      .select('*, category:categories(id, name, icon, color, type, is_default, user_id, created_at)')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }))
  }

  return (
    <div>
      <Header title="Transactions" subtitle="Manage your income and expenses" />
      <TransactionsClient
        transactions={(transactions ?? []) as any}
        categories={categories ?? []}
        currency={profile?.currency ?? 'USD'}
        currentMonth={month}
        currentYear={year}
        initialSearch={params.search}
        initialType={params.type as 'income' | 'expense' | undefined}
      />
    </div>
  )
}
