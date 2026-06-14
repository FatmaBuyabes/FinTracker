'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTransaction, updateTransaction } from '@/app/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toISODateString } from '@/lib/utils'
import type { Category, Transaction } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number({ message: 'Amount must be positive' }).positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TransactionFormProps {
  categories: Category[]
  transaction?: Transaction
  onSuccess?: () => void
}

export function TransactionForm({ categories, transaction, onSuccess }: TransactionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!transaction

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: transaction?.title ?? '',
      amount: transaction?.amount ?? undefined,
      type: transaction?.type ?? 'expense',
      category_id: transaction?.category_id ?? undefined,
      date: transaction?.date ?? toISODateString(new Date()),
      description: transaction?.description ?? '',
    },
  })

  const watchedType = watch('type')
  const filteredCategories = categories.filter(c => c.type === watchedType || c.type === 'both')

  const onSubmit = (values: FormValues) => {
    setServerError(null)
    startTransition(async () => {
      const data = {
        ...values,
        category_id: values.category_id || null,
        description: values.description || null,
      }
      const result = isEdit
        ? await updateTransaction(transaction.id, data)
        : await createTransaction(data)

      if (result?.error) {
        setServerError(result.error)
      } else {
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update the transaction details below.' : 'Fill in the details for your new transaction.'}
        </DialogDescription>
      </DialogHeader>

      {serverError && (
        <div className="my-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{serverError}</div>
      )}

      <div className="space-y-4 py-2">
        {/* Type toggle */}
        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setValue('type', t); setValue('category_id', undefined) }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all ${
                  watchedType === t
                    ? t === 'income'
                      ? 'border-success bg-success/10 text-success'
                      : 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="e.g. Grocery shopping" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" className="pl-7" {...register('amount', { valueAsNumber: true })} />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            onValueChange={(v) => setValue('category_id', v)}
            defaultValue={transaction?.category_id ?? undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Notes (optional)</Label>
          <Input id="description" placeholder="Add a note..." {...register('description')} />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" loading={isPending} className="w-full sm:w-auto">
          {isEdit ? 'Save changes' : 'Add transaction'}
        </Button>
      </DialogFooter>
    </form>
  )
}
