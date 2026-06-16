'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Paperclip, X, ExternalLink, FileText } from 'lucide-react'
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

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)
}

export function TransactionItem({ transaction, categories, currency = 'USD' }: TransactionItemProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleting, startDelete] = useTransition()

  const handleDelete = () => {
    if (!confirm('Delete this transaction?')) return
    startDelete(async () => { await deleteTransaction(transaction.id) })
  }

  const handleAttachmentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!transaction.attachment_url) return
    if (isImage(transaction.attachment_url)) {
      setPreviewOpen(true)
    } else {
      // PDF — open in new tab
      window.open(transaction.attachment_url, '_blank', 'noopener,noreferrer')
    }
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
          {transaction.attachment_url && (
            <button
              type="button"
              title="View attachment"
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleAttachmentClick}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
          )}
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

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <TransactionForm
            transaction={transaction}
            categories={categories}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Attachment preview lightbox */}
      {transaction.attachment_url && previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full rounded-xl overflow-hidden shadow-2xl bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium truncate">
                {isImage(transaction.attachment_url) ? (
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{transaction.title} — attachment</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={transaction.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setPreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex items-center justify-center bg-muted/30 max-h-[75vh] overflow-auto p-4">
              <img
                src={transaction.attachment_url}
                alt={`${transaction.title} attachment`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
