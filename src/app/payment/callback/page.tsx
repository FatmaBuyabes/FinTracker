import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPaymentStatus } from '@/lib/myfatoorah'

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { paymentId } = await searchParams

  if (!paymentId || typeof paymentId !== 'string') {
    redirect('/settings?payment=error')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const status = await getPaymentStatus(paymentId)

    if (status.InvoiceStatus === 'Paid') {
      // CustomerReference was set as "userId:tier" when we created the invoice
      const parts = (status.CustomerReference ?? '').split(':')
      const tier  = parts[1] === 'family' ? 'family' : 'pro'

      // 30-day subscription period
      const periodEnd = new Date()
      periodEnd.setDate(periodEnd.getDate() + 30)

      await supabase.from('subscriptions').upsert({
        user_id:             user.id,
        tier,
        status:              'active',
        mf_invoice_id:       String(status.InvoiceId),
        mf_payment_id:       paymentId,
        current_period_end:  periodEnd.toISOString(),
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id' })

      redirect('/settings?payment=success')
    } else {
      redirect('/settings?payment=failed')
    }
  } catch (err) {
    console.error('[payment/callback]', err)
    redirect('/settings?payment=error')
  }
}
