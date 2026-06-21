import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Payment failed</h1>
        <p className="text-muted-foreground">
          Something went wrong during payment. No charge was made.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
