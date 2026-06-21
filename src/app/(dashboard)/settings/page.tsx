import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './_client'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { payment } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile      = null
  let subscription = null

  if (user) {
    ;[{ data: profile }, { data: subscription }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    ])
  }

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account preferences" />
      <SettingsClient
        profile={profile}
        userEmail={user?.email ?? ''}
        subscription={subscription}
        paymentStatus={typeof payment === 'string' ? payment : undefined}
      />
    </div>
  )
}
