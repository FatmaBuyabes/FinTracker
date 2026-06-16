'use client'

import { useState, useTransition, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Paperclip, X, FileText, ImageIcon } from 'lucide-react'
import { createTransaction, updateTransaction } from '@/app/actions/transactions'
import { createClient } from '@/lib/supabase/client'
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(transaction?.attachment_url ?? null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!transaction

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setAttachmentFile(file)
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file))
    } else {
      setAttachmentPreview(null) // PDF — no image preview
    }
  }

  const clearAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('fintech-attach').upload(path, file, { upsert: false })
    if (error) { setUploadError(error.message); return null }
    const { data: { publicUrl } } = supabase.storage.from('fintech-attach').getPublicUrl(data.path)
    return publicUrl
  }

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
    setUploadError(null)
    startTransition(async () => {
      let attachment_url: string | null = isEdit ? (transaction.attachment_url ?? null) : null

      // Upload new file if one was selected
      if (attachmentFile) {
        const url = await uploadFile(attachmentFile)
        if (!url) return // uploadError already set
        attachment_url = url
      } else if (!attachmentPreview) {
        // User explicitly cleared the attachment
        attachment_url = null
      }

      const data = {
        ...values,
        category_id: values.category_id || null,
        description: values.description || null,
        attachment_url,
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

        {/* Attachment */}
        <div className="space-y-1.5">
          <Label>Attachment (optional)</Label>

          {/* Show existing or new preview */}
          {attachmentPreview && (
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/40">
              {attachmentPreview.startsWith('blob:') || attachmentPreview.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ? (
                <img src={attachmentPreview} alt="Attachment preview" className="max-h-36 w-full object-contain p-2" />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-muted-foreground">
                    {attachmentFile?.name ?? 'Attached file'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={clearAttachment}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {!attachmentPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
              Attach bill / receipt
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF or PDF · max 10 MB</p>
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
