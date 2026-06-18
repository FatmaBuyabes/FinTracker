'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData) {
  const email    = (formData.get('email')    as string ?? '').trim()
  const password = (formData.get('password') as string ?? '')

  if (!email || !password) return { error: 'Email and password are required.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const email    = (formData.get('email')    as string ?? '').trim()
  const password = (formData.get('password') as string ?? '')
  const confirm  = (formData.get('confirm')  as string ?? '')

  if (!email || !password)  return { error: 'Email and password are required.' }
  if (password.length < 6)  return { error: 'Password must be at least 6 characters.' }
  if (password !== confirm)  return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }

  // Create profile row for the new user
  if (data.user) {
    await supabase.from('profiles').upsert({
      id:         data.user.id,
      email,
      currency:   'USD',
      updated_at: new Date().toISOString(),
    })
  }

  // If email confirmation is required, session will be null
  if (!data.session) {
    return { success: 'Check your email for a confirmation link, then sign in.' }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
