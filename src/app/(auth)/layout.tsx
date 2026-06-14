import { Wallet } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FinTrack</span>
        </div>
        <div>
          <blockquote className="text-white/90">
            <p className="text-2xl font-medium leading-relaxed mb-4">
              &ldquo;Track every dollar, reach every goal.&rdquo;
            </p>
            <p className="text-white/70 text-sm">
              Your personal finance tracker — income, expenses, budgets, and insights in one place.
            </p>
          </blockquote>
        </div>
        <div className="flex gap-6 text-white/60 text-sm">
          <span>✓ Free to use</span>
          <span>✓ Secure & private</span>
          <span>✓ Offline support</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">FinTrack</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
