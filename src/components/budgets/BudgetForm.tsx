'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upsertBudget } from '@/app/actions/budgets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import type { Budget, Category } from '@/types'

const schema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  amount: z.number({ message: 'Amount must be positive' }).positive('Amount must be positive'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
})

type FormValues = z.infer<typeof schema>

interface BudgetFormProps {
  budget?: Budget
  categories: Category[]
  defaultMonth?: number
  defaultYear?: number
  onSuccess?: () => void
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))
const YEARS = Array.from({ length: 5 }, (_, i) => getCurrentYear() - 1 + i)

export function BudgetForm({ budget, categories, defaultMonth, defaultYear, onSuccess }: BudgetFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: budget?.category_id ?? '',
      amount: budget?.amount ?? undefined,
      month: budget?.month ?? defaultMonth ?? getCurrentMonth(),
      year: budget?.year ?? defaultYear ?? getCurrentYear(),
    },
  })

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const result = await upsertBudget(values)
      if (result?.error) setServerError(result.error)
      else onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>{budget ? 'Edit Budget' : 'Set Budget'}</DialogTitle>
        <DialogDescription>Set a monthly spending limit for a category.</DialogDescription>
      </DialogHeader>

      {serverError && (
        <div className="my-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</div>
      )}

      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            onValueChange={(v) => setValue('category_id', v)}
            defaultValue={budget?.category_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Monthly limit</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" className="pl-7" {...register('amount', { valueAsNumber: true })} />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select onValueChange={(v) => setValue('month', Number(v) as 1|2|3|4|5|6|7|8|9|10|11|12)} defaultValue={String(budget?.month ?? defaultMonth ?? getCurrentMonth())}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(({ value, label }) => (
                  <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Select onValueChange={(v) => setValue('year', Number(v))} defaultValue={String(budget?.year ?? defaultYear ?? getCurrentYear())}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" loading={isPending} className="w-full sm:w-auto">
          {budget ? 'Save changes' : 'Set budget'}
        </Button>
      </DialogFooter>
    </form>
  )
}
