'use client'

import { useState, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, User, DollarSign, Palette } from 'lucide-react'
import { updateProfile } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Profile } from '@/types'

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (CA$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'TRY', label: 'Turkish Lira (₺)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
]

interface SettingsClientProps {
  profile: Profile | null
  userEmail: string
}

export function SettingsClient({ profile, userEmail }: SettingsClientProps) {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD')

  const handleSave = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await updateProfile({ full_name: fullName, currency })
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={userEmail} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Currency</CardTitle>
          </div>
          <CardDescription>Choose your preferred display currency.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
          <CardDescription>Choose how FinTrack looks to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                  theme === id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">Settings saved successfully.</p>}
      <Button onClick={handleSave} loading={isPending}>Save changes</Button>
    </div>
  )
}
