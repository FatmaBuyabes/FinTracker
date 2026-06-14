import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from './_client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    ;({ data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single())
  }

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account preferences" />
      <SettingsClient profile={profile} userEmail={user?.email ?? ''} />
    </div>
  )
}
