import { type NextRequest } from 'next/server'
import { initiatePayment } from '@/lib/myfatoorah'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const amount = parseFloat(request.nextUrl.searchParams.get('amount') ?? '2.990')
  try {
    const methods = await initiatePayment(amount)
    return Response.json({ methods })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load payment methods'
    return Response.json({ error: message }, { status: 502 })
  }
}
