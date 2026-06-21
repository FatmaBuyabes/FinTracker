'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Sparkles, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: null,
    description: 'Perfect for getting started',
    icon: Zap,
    color: 'text-muted-foreground',
    badge: null,
    features: [
      'Log income & expenses',
      'Current month view',
      'One device',
      'Basic categories',
      '5 transactions/day',
    ],
    cta: 'Get started free',
    ctaVariant: 'outline' as const,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 2.990,
    description: 'For individuals who want full control',
    icon: Sparkles,
    color: 'text-primary',
    badge: 'Most popular',
    features: [
      'Everything in Free',
      'Full transaction history',
      'Budgets & reports',
      'AI daily spending insights',
      'Sync across all devices',
      'Unlimited transactions',
      'Export to CSV',
    ],
    cta: 'Upgrade to Pro',
    ctaVariant: 'primary' as const,
  },
  {
    id: 'family' as const,
    name: 'Family',
    price: 4.990,
    description: 'Shared finances for the whole household',
    icon: Users,
    color: 'text-emerald-500',
    badge: null,
    features: [
      'Everything in Pro',
      'Shared family ledger',
      'Split expenses',
      'Up to 6 members',
      'Per-member budgets',
      'Household reports',
      'Priority support',
    ],
    cta: 'Upgrade to Family',
    ctaVariant: 'outline' as const,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (tier: 'pro' | 'family') => {
    setError(null)
    setLoading(tier)
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json() as { invoiceUrl?: string; error?: string }

      if (!res.ok || data.error) {
        // If unauthenticated, send to login first
        if (res.status === 401) {
          router.push(`/login?next=/pricing`)
          return
        }
        throw new Error(data.error ?? 'Failed to create payment')
      }

      // Redirect to MyFatoorah hosted payment page
      window.location.href = data.invoiceUrl!
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Start free. Upgrade when you need more. Cancel any time.
        </p>
      </div>

      {error && (
        <div className="mb-8 mx-auto max-w-md rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isPro = plan.id === 'pro'
          const isFree = plan.id === 'free'
          const isLoading = loading === plan.id

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6',
                isPro
                  ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5'
                  : 'border-border bg-card'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', isPro ? 'bg-primary/20' : 'bg-muted')}>
                  <Icon className={cn('h-5 w-5', plan.color)} />
                </div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                <div className="mt-4">
                  {plan.price == null ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price.toFixed(3)}</span>
                      <span className="text-sm font-medium text-muted-foreground">KWD / mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', isPro ? 'text-primary' : 'text-muted-foreground')} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isFree ? (
                <a
                  href="/signup"
                  className="flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpgrade(plan.id as 'pro' | 'family')}
                  disabled={!!loading}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60',
                    isPro
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-border hover:bg-accent'
                  )}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Redirecting…
                    </>
                  ) : (
                    plan.cta
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Prices in Kuwaiti Dinar (KWD). Billed monthly. Secure checkout via MyFatoorah.
      </p>
    </main>
  )
}
