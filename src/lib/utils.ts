import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy')
}

export function formatMonthYear(date: string): string {
  return format(parseISO(date), 'MMMM yyyy')
}

export function getMonthName(month: number): string {
  return format(new Date(2024, month - 1, 1), 'MMMM')
}

export function getShortMonthName(month: number): string {
  return format(new Date(2024, month - 1, 1), 'MMM')
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function groupTransactionsByDate<T extends { date: string }>(
  transactions: T[]
): Record<string, T[]> {
  return transactions.reduce((groups, tx) => {
    const date = tx.date
    return { ...groups, [date]: [...(groups[date] || []), tx] }
  }, {} as Record<string, T[]>)
}

export function calcPercentage(spent: number, budget: number): number {
  if (budget === 0) return 0
  return Math.min(Math.round((spent / budget) * 100), 100)
}
