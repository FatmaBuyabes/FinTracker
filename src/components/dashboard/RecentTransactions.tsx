import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { AmountDisplay } from '@/components/shared/AmountDisplay'
import { formatDate } from '@/lib/utils'
import type { Transaction } from '@/types'

interface RecentTransactionsProps {
  transactions: Transaction[]
  currency?: string
}

export function RecentTransactions({ transactions, currency = 'USD' }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {transactions.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tx.category?.color ? `${tx.category.color}20` : '#6366f120' }}
                >
                  {tx.category?.icon && (
                    <CategoryIcon
                      name={tx.category.icon}
                      className="h-4 w-4"
                      style={{ color: tx.category?.color ?? '#6366f1' }}
                    />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <AmountDisplay amount={tx.amount} type={tx.type} currency={currency} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
