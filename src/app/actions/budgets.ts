'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface BudgetData {
  category_id: string
  amount: number
  month: number
  year: number
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function upsertBudget(data: BudgetData) {
  const { supabase, user } = await getUser()

  const { error } = await supabase.from('budgets').upsert(
    { ...data, user_id: user.id },
    { onConflict: 'user_id,category_id,month,year' }
  )

  if (error) return { error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBudget(id: string) {
  const { supabase, user } = await getUser()

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: true }
}
