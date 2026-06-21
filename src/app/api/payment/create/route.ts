import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiatePayment, executePayment } from '@/lib/myfatoorah'

export const dynamic = 'force-dynamic'

const PLANS = {
  pro:    { label: 'Pro',    amount: 2.990 },
  family: { label: 'Family', amount: 4.990 },
} as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { tier?: string }
    const tier = body.tier as keyof typeof PLANS | undefined
    if (!tier || !PLANS[tier]) {
      return Response.json({ error: 'Invalid tier. Must be "pro" or "family".' }, { status: 400 })
    }

    const plan   = PLANS[tier]
    const origin = request.nextUrl.origin

    // 1. Get available payment methods for this amount
    const methods = await initiatePayment(plan.amount)
    if (!methods.length) {
      return Response.json({ error: 'No payment methods available.' }, { status: 502 })
    }

    // Pick the first available method (KNET/credit card depending on configuration)
    const methodId = methods[0].PaymentMethodId

    // 2. Create the invoice — MyFatoorah returns a hosted payment page URL
    const { invoiceId, invoiceUrl } = await executePayment({
      paymentMethodId:   methodId,
      invoiceValue:      plan.amount,
      customerEmail:     user.email ?? '',
      customerName:      user.email?.split('@')[0] ?? 'User',
      callbackUrl:       `${origin}/payment/callback`,
      errorUrl:          `${origin}/payment/error`,
      customerReference: `${user.id}:${tier}`,
    })

    // 3. Save pending state so we can match it on callback
    await supabase.from('subscriptions').upsert({
      user_id:       user.id,
      tier:          'free',          // stays free until payment confirmed
      status:        'pending',
      mf_invoice_id: String(invoiceId),
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (!invoiceUrl) throw new Error('Payment gateway returned no checkout URL')
    return Response.json({ invoiceUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment initiation failed'
    console.error('[payment/create]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
