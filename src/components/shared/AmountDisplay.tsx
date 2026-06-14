import { cn, formatCurrency } from '@/lib/utils'

interface AmountDisplayProps {
  amount: number
  type: 'income' | 'expense'
  currency?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AmountDisplay({ amount, type, currency = 'USD', className, size = 'md' }: AmountDisplayProps) {
  const isIncome = type === 'income'
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        isIncome ? 'text-success' : 'text-destructive',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-xl',
        className
      )}
    >
      {isIncome ? '+' : '-'}{formatCurrency(amount, currency)}
    </span>
  )
}
