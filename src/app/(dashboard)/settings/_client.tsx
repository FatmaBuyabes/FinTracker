'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, User, DollarSign, Palette, CreditCard, Sparkles, Users, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { updateProfile } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Profile } from '@/types'

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (CA$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'TRY', label: 'Turkish Lira (₺)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
]

const TIER_META = {
  free:   { label: 'Free',   color: 'text-muted-foreground', bg: 'bg-muted',          Icon: Zap       },
  pro:    { label: 'Pro',    color: 'text-primary',          bg: 'bg-primary/10',     Icon: Sparkles  },
  family: { label: 'Family', color: 'text-emerald-600',      bg: 'bg-emerald-500/10', Icon: Users     },
} as const

interface Subscription {
  tier: 'free' | 'pro' | 'family'
  status: string
  current_period_end: string | null
}

interface SettingsClientProps {
  profile:       Profile | null
  userEmail:     string
  subscription:  Subscription | null
  paymentStatus?: string  // 'success' | 'failed' | 'error' from URL param
}

export function SettingsClient({ profile, userEmail, subscription, paymentStatus }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted]         = useState(false)
  const [isPending, startTransition]  = useTransition()
  const [upgrading, setUpgrading]     = useState<string | null>(null)
  const [upgradeError, setUpgradeError] = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [fullName, setFullName]       = useState(profile?.full_name ?? '')
  const [currency, setCurrency]       = useState(profile?.currency ?? 'USD')
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const tier = (subscription?.tier ?? 'free') as keyof typeof TIER_META
  const { label: tierLabel, color: tierColor, bg: tierBg, Icon: TierIcon } = TIER_META[tier]

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile({ full_name: fullName, currency })
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  const handleUpgrade = async (targetTier: 'pro' | 'family') => {
    setUpgradeError(null)
    setUpgrading(targetTier)
    try {
      const res  = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier }),
      })
      const data = await res.json() as { invoiceUrl?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Payment failed')
      window.location.href = data.invoiceUrl!
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Could not start payment')
      setUpgrading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">

      {/* Payment status banner */}
      {paymentStatus === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Payment successful! Your subscription has been upgraded.
        </div>
      )}
      {(paymentStatus === 'failed' || paymentStatus === 'error') && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          Payment was not completed. No charge was made.
        </div>
      )}

      {/* ── Subscription ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Subscription</CardTitle>
          </div>
          <CardDescription>Your current plan and upgrade options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current tier badge */}
          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tierBg}`}>
              <TierIcon className={`h-5 w-5 ${tierColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{tierLabel} plan</p>
              {periodEnd ? (
                <p className="text-xs text-muted-foreground">Renews {periodEnd}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {tier === 'free' ? 'Upgrade to unlock full history, budgets & insights' : 'Active'}
                </p>
              )}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wide ${tierColor}`}>{tierLabel}</span>
          </div>

          {upgradeError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {upgradeError}
            </div>
          )}

          {/* Upgrade options */}
          {tier === 'free' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Pro */}
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Pro</span>
                  <span className="ml-auto text-sm font-bold">2.990 KWD<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✓ Full history & budgets</li>
                  <li>✓ Reports & AI insights</li>
                  <li>✓ All devices</li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleUpgrade('pro')}
                  disabled={!!upgrading}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {upgrading === 'pro' ? (
                    <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Redirecting…</>
                  ) : 'Upgrade to Pro'}
                </button>
              </div>

              {/* Family */}
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-sm">Family</span>
                  <span className="ml-auto text-sm font-bold">4.990 KWD<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Shared ledgers</li>
                  <li>✓ Up to 6 members</li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleUpgrade('family')}
                  disabled={!!upgrading}
                  className="w-full rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {upgrading === 'family' ? (
                    <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Redirecting…</>
                  ) : 'Upgrade to Family'}
                </button>
              </div>
            </div>
          )}

          {tier === 'pro' && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Want shared ledgers for your family?</p>
                <p className="text-xs text-muted-foreground">Upgrade to Family — 4.990 KWD/mo</p>
              </div>
              <button
                type="button"
                onClick={() => handleUpgrade('family')}
                disabled={!!upgrading}
                className="rounded-lg border border-emerald-500/50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10 transition-colors disabled:opacity-60"
              >
                {upgrading === 'family' ? '…' : 'Upgrade'}
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            <a href="/pricing" className="underline underline-offset-2 hover:text-foreground transition-colors">
              View full plan comparison →
            </a>
          </p>
        </CardContent>
      </Card>

      {/* ── Profile ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={userEmail} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Currency ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Currency</CardTitle>
          </div>
          <CardDescription>Choose your preferred display currency.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ── Theme ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
          <CardDescription>Choose how FinTrack looks to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark',  label: 'Dark',  icon: Moon },
              { id: 'system',label: 'System',icon: Monitor },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  mounted && theme === id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      {error   && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">Settings saved successfully.</p>}
      <Button onClick={handleSave} loading={isPending}>Save changes</Button>
    </div>
  )
}
