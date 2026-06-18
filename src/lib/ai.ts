import { unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface AIInsight {
  timeEstimate: string
  dailyMessage: string
  spendingTip: string
}

/**
 * Fetches this month's transactions + budgets then invokes the
 * ai-daily-insight Supabase Edge Function (which reads OPENROUTER_API_KEY
 * from Supabase secrets and calls OpenRouter).
 * Returns null on any error so the dashboard degrades gracefully.
 */
export async function getAIDailyInsight(): Promise<AIInsight | null> {
  noStore() // always fetch fresh — never serve a cached response
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    const [{ data: transactions }, { data: budgets }] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, type, title, category:categories(name)')
        .eq('user_id', user.id)
        .gte('date', firstDay)
        .lte('date', lastDay),
      supabase
        .from('budgets')
        .select('amount, month, year, category:categories(name)')
        .eq('user_id', user.id)
        .eq('month', month)
        .eq('year', year),
    ])

    const { data, error } = await supabase.functions.invoke('ai-daily-insight', {
      body: {
        transactions: transactions ?? [],
        budgets: budgets ?? [],
      },
    })

    if (error) {
      console.error('[getAIDailyInsight] invoke error:', JSON.stringify(error))
      return null
    }

    if (data?.error) {
      console.error('[getAIDailyInsight] function error:', data.error)
      return null
    }

    return data as AIInsight
  } catch (e) {
    console.error('[getAIDailyInsight] exception:', e)
    return null
  }
}
