'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Plus, Search, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card } from '@/components/ui/card'
import { groupTransactionsByDate, formatDate, getMonthName } from '@/lib/utils'
import type { Category, Transaction } from '@/types'

interface TransactionsClientProps {
  transactions: Transaction[]
  categories: Category[]
  currency: string
  currentMonth: number
  currentYear: number
  initialSearch?: string
  initialType?: 'income' | 'expense'
}

export function TransactionsClient({
  transactions, categories, currency, currentMonth, currentYear, initialSearch, initialType,
}: TransactionsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState(initialSearch ?? '')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(initialType ?? 'all')

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !search || tx.title.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || tx.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [transactions, search, typeFilter])

  const grouped = groupTransactionsByDate(filtered)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const navigate = (m: number, y: number) => {
    router.push(`${pathname}?month=${m}&year=${y}`)
  }

  const prevMonth = () => {
    const d = new Date(currentYear, currentMonth - 2, 1)
    navigate(d.getMonth() + 1, d.getFullYear())
  }
  const nextMonth = () => {
    const d = new Date(currentYear, currentMonth, 1)
    navigate(d.getMonth() + 1, d.getFullYear())
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Month navigation */}
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

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Add button */}
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Transaction list */}
      {sortedDates.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions"
          description={search || typeFilter !== 'all' ? 'No transactions match your filters.' : 'Add your first transaction to get started.'}
          action={!search && typeFilter === 'all' && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add transaction
            </Button>
          )}
        />
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <Card key={date} className="overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-border bg-muted/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatDate(date)}
                </p>
              </div>
              <div className="divide-y divide-border">
                {grouped[date].map(tx => (
                  <TransactionItem key={tx.id} transaction={tx} categories={categories} currency={currency} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add transaction dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <TransactionForm categories={categories} onSuccess={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
