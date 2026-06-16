'use client'

import { useState } from 'react'
import { Sparkles, X, Clock, Bell, Lightbulb } from 'lucide-react'
import type { AIInsight } from '@/lib/ai'

export function DailyInsightCard({ insight }: { insight: AIInsight }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-primary/5 to-transparent p-4 pr-10 shadow-sm">
      {/* Dismiss */}
      <button
        type="button"
        aria-label="Dismiss insight"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-primary">AI Daily Insight</span>
        <span className="ml-auto mr-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
          Today
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {/* Budget runway */}
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
            <Clock className="h-3 w-3 text-blue-500" />
          </div>
          <p className="text-sm leading-relaxed">{insight.timeEstimate}</p>
        </div>

        {/* Daily reminder / alarm */}
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <Bell className="h-3 w-3 text-amber-500" />
          </div>
          <p className="text-sm leading-relaxed">{insight.dailyMessage}</p>
        </div>

        {/* Actionable tip */}
        <div className="flex gap-2.5">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
            <Lightbulb className="h-3 w-3 text-emerald-500" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{insight.spendingTip}</p>
        </div>
      </div>
    </div>
  )
}

/** Skeleton shown while the AI is thinking */
export function DailyInsightSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 animate-pulse">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-muted" />
        <div className="h-4 w-28 rounded bg-muted" />
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-2.5">
            <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-muted" />
            <div className="h-4 rounded bg-muted" style={{ width: `${72 - i * 8}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
