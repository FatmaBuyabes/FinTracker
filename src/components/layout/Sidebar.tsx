'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { LayoutDashboard, ArrowLeftRight, Target, BarChart2, Settings, Wallet, LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets',      label: 'Budgets',      icon: Target },
  { href: '/reports',      label: 'Reports',      icon: BarChart2 },
  { href: '/settings',     label: 'Settings',     icon: Settings },
]

const TIER_BADGE: Record<string, { label: string; className: string }> = {
  pro:    { label: 'Pro',    className: 'bg-primary/10 text-primary' },
  family: { label: 'Family', className: 'bg-emerald-500/10 text-emerald-600' },
}

interface SidebarProps {
  userEmail?: string | null
  tier?: string | null
}

export function Sidebar({ userEmail, tier }: SidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => { await signOut() })
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : '?'
  const badge    = tier ? TIER_BADGE[tier] : null

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wallet className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">FinTrack</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Upgrade nudge — only shown on free tier */}
        {!badge && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
              Unlock full history, budgets, reports & AI insights.
            </p>
            <Link
              href="/pricing"
              className="block w-full rounded-lg bg-primary px-3 py-1.5 text-center text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              See plans →
            </Link>
          </div>
        )}
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs text-muted-foreground">{userEmail ?? 'Account'}</p>
            {badge && (
              <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold', badge.className)}>
                {badge.label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            title="Sign out"
            className="rounded-md p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
