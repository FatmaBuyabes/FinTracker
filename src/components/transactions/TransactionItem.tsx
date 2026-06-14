'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { TransactionForm } from './TransactionForm'
import { deleteTransaction } from '@/app/actions/transactions'
import { formatDate } from '@/lib/utils'
import type { Category, Transaction } from '@/types'

interface TransactionItemProps {
  transaction: Transaction
  categories: Category[]
  currency?: string
}

export function TransactionItem({ transaction, categories, currency = 'USD' }: TransactionItemProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  const handleDelete = () => {
    if (!confirm('Delete this transaction?')) return
    startDelete(async () => { await deleteTransaction(transaction.id) })
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-muted/50 transition-colors group">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: transaction.category?.color ? `${transaction.category.color}20` : '#6366f120' }}
        >
          {transaction.category?.icon && (
            <CategoryIcon
              name={transaction.category.icon}
              className="h-4 w-4"
              style={{ color: transaction.category?.color ?? '#6366f1' }}
            />
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium">{transaction.title}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
            {transaction.category && (
              <span className="text-xs text-muted-foreground">· {transaction.category.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AmountDisplay amount={transaction.amount} type={transaction.type} currency={currency} size="sm" />
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <TransactionForm
            transaction={transaction}
            categories={categories}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
