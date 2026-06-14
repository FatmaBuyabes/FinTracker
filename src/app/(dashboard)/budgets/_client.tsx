'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, getMonthName } from '@/lib/utils'
import type { Budget, Category } from '@/types'

interface BudgetsClientProps {
  budgets: Budget[]
  categories: Category[]
  currency: string
  currentMonth: number
  currentYear: number
}

export function BudgetsClient({ budgets, categories, currency, currentMonth, currentYear }: BudgetsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0)
  const overBudgetCount = budgets.filter(b => (b.spent ?? 0) > b.amount).length

  const navigate = (m: number, y: number) => router.push(`${pathname}?month=${m}&year=${y}`)
  const prevMonth = () => { const d = new Date(currentYear, currentMonth - 2, 1); navigate(d.getMonth() + 1, d.getFullYear()) }
  const nextMonth = () => { const d = new Date(currentYear, currentMonth, 1); navigate(d.getMonth() + 1, d.getFullYear()) }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-medium">
            {getMonthName(currentMonth)} {currentYear}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add budget
        </Button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total Budget</p><p className="text-xl font-bold">{formatCurrency(totalBudget, currency)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Total Spent</p><p className="text-xl font-bold">{formatCurrency(totalSpent, currency)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Remaining</p><p className={`text-xl font-bold ${totalBudget - totalSpent < 0 ? 'text-destructive' : 'text-success'}`}>{formatCurrency(Math.abs(totalBudget - totalSpent), currency)}</p>{overBudgetCount > 0 && <p className="text-xs text-destructive mt-0.5">{overBudgetCount} over budget</p>}</CardContent></Card>
        </div>
      )}

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets set"
          description="Set monthly spending limits to track your expenses better."
          action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add budget</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map(budget => (
            <BudgetCard key={budget.id} budget={budget} categories={categories} currency={currency} />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <BudgetForm
            categories={categories}
            defaultMonth={currentMonth}
            defaultYear={currentYear}
            onSuccess={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
