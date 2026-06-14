import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  iconColor: string
  iconBg: string
  currency?: string
  subtitle?: string
  trend?: number
  isCount?: boolean
}

export function StatsCard({ title, value, icon: Icon, iconColor, iconBg, currency = 'USD', subtitle, trend, isCount }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{isCount ? value.toString() : formatCurrency(value, currency)}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== undefined && (
              <p className={cn('mt-1.5 text-xs font-medium', trend >= 0 ? 'text-success' : 'text-destructive')}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs last month
              </p>
            )}
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
