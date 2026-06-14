'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, getMonthName } from '@/lib/utils'
import type { MonthlyData, CategorySpending } from '@/types'

interface ReportsClientProps {
  monthlyData: MonthlyData[]
  categoryData: CategorySpending[]
  currency: string
  yearIncome: number
  yearExpenses: number
  savingsRate: number
  currentMonth: number
  currentYear: number
}

export function ReportsClient({
  monthlyData, categoryData, currency, yearIncome, yearExpenses, savingsRate, currentYear,
}: ReportsClientProps) {
  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      fontSize: 12,
    },
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Yearly summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">{currentYear} Total Income</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(yearIncome, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">{currentYear} Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(yearExpenses, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
            <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {savingsRate >= 20 ? '🌟 Great job!' : savingsRate >= 10 ? '👍 On track' : '⚠️ Save more'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expenses trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income vs Expenses — Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={38} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v ?? 0), currency), '']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income"   name="Income"   stroke="hsl(var(--success))"     strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two charts side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly bar chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData.slice(-6)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={36} />
                <Tooltip {...tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v ?? 0), currency), '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income"   name="Income"   fill="hsl(var(--success))"     radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category donut */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No expense data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v ?? 0), currency), '']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: 'hsl(var(--foreground))' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top spending categories table */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top Spending Categories This Month</CardTitle></CardHeader>
          <CardContent className="px-0">
            <ul className="divide-y divide-border">
              {categoryData.slice(0, 8).map((cat, i) => {
                const total = categoryData.reduce((s, c) => s + c.value, 0)
                const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : '0'
                return (
                  <li key={i} className="flex items-center gap-3 px-6 py-3">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                    <span className="text-sm font-semibold">{formatCurrency(cat.value, currency)}</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
