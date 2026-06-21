import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let tier: string | null = null
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single()
    tier = sub?.tier ?? 'free'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex md:shrink-0">
        <Sidebar userEmail={user?.email} tier={tier} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
