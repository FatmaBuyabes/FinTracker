'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { MFPaymentMethod } from '@/lib/myfatoorah'

interface PaymentMethodModalProps {
  tier:    'pro' | 'family'
  amount:  number
  onClose: () => void
}

export function PaymentMethodModal({ tier, amount, onClose }: PaymentMethodModalProps) {
  const [methods,  setMethods]  = useState<MFPaymentMethod[]>([])
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState<number | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  // Load available payment methods on mount
  useEffect(() => {
    fetch(`/api/payment/methods?amount=${amount}`)
      .then(r => r.json())
      .then((d: { methods?: MFPaymentMethod[]; error?: string }) => {
        if (d.error) throw new Error(d.error)
        setMethods(d.methods ?? [])
      })
      .catch(e => setError(e.message ?? 'Could not load payment methods'))
      .finally(() => setLoading(false))
  }, [amount])

  const handlePay = async (methodId: number) => {
    setError(null)
    setPaying(methodId)
    try {
      const res  = await fetch('/api/payment/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier, methodId }),
      })
      const data = await res.json() as { invoiceUrl?: string; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? 'Payment failed')
      if (!data.invoiceUrl) throw new Error('No checkout URL returned')
      window.open(data.invoiceUrl, '_blank', 'noopener,noreferrer')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setPaying(null)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Choose payment method</h2>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {tier} plan · {amount.toFixed(3)} KWD / month
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading payment methods…</span>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m.PaymentMethodId}
                  type="button"
                  onClick={() => handlePay(m.PaymentMethodId)}
                  disabled={paying !== null}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
                >
                  {/* Gateway logo */}
                  <img
                    src={m.ImageUrl}
                    alt={m.PaymentMethodEn}
                    className="h-8 w-12 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{m.PaymentMethodEn}</span>
                    <span className="block text-xs text-muted-foreground">
                      {m.ServiceCharge > 0
                        ? `Service charge: ${m.ServiceCharge.toFixed(3)} KWD`
                        : 'No extra charge'}
                    </span>
                  </div>
                  {paying === m.PaymentMethodId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">→</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="px-5 pb-4 text-center text-[11px] text-muted-foreground">
          Secure checkout powered by MyFatoorah. Your card details are never stored by FinTrack.
        </p>
      </div>
    </div>
  )
}
