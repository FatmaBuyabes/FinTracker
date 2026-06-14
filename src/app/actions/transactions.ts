'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface TransactionData {
  title: string
  amount: number
  type: 'income' | 'expense'
  category_id?: string | null
  date: string
  description?: string | null
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createTransaction(data: TransactionData) {
  const { supabase, user } = await getUser()

  const { error } = await supabase.from('transactions').insert({
    ...data,
    user_id: user.id,
    category_id: data.category_id || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/reports')
  return { success: true }
}

export async function updateTransaction(id: string, data: TransactionData) {
  const { supabase, user } = await getUser()

  const { error } = await supabase
    .from('transactions')
    .update({ ...data, category_id: data.category_id || null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/reports')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const { supabase, user } = await getUser()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/reports')
  return { success: true }
}
