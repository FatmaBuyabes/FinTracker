'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { BudgetForm } from './BudgetForm'
import { deleteBudget } from '@/app/actions/budgets'
import { formatCurrency, calcPercentage, cn } from '@/lib/utils'
import type { Budget, Category } from '@/types'

interface BudgetCardProps {
  budget: Budget
  categories: Category[]
  currency?: string
}

export function BudgetCard({ budget, categories, currency = 'USD' }: BudgetCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  const spent = budget.spent ?? 0
  const percentage = calcPercentage(spent, budget.amount)
  const remaining = budget.amount - spent

  const color =
    percentage >= 90 ? 'bg-destructive' :
    percentage >= 70 ? 'bg-warning' :
    'bg-success'

  const handleDelete = () => {
    if (!confirm('Delete this budget?')) return
    startDelete(async () => { await deleteBudget(budget.id) })
  }

  return (
    <>
      <Card className="group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: budget.category?.color ? `${budget.category.color}20` : '#6366f120' }}
              >
                {budget.category?.icon && (
                  <CategoryIcon
                    name={budget.category.icon}
                    className="h-4 w-4"
                    style={{ color: budget.category?.color ?? '#6366f1' }}
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{budget.category?.name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{percentage}% used</p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Progress value={percentage} indicatorClassName={color} className="mb-3 h-2" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              <span className={cn('font-semibold', percentage >= 90 ? 'text-destructive' : 'text-foreground')}>
                {formatCurrency(spent, currency)}
              </span>{' '}
              spent
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{formatCurrency(budget.amount, currency)}</span> budget
            </span>
          </div>

          {remaining < 0 ? (
            <p className="mt-1.5 text-xs font-medium text-destructive">
              {formatCurrency(Math.abs(remaining), currency)} over budget
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatCurrency(remaining, currency)} remaining
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <BudgetForm
            budget={budget}
            categories={categories}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
