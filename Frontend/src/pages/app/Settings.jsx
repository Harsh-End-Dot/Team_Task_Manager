import { useState } from 'react'
import { KeyRound, Loader2, Mail, Moon, Sun, User as UserIcon } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/useToast'
import { requestPasswordReset } from '@/features/auth/api'
import { getErrorMessage } from '@/lib/apiError'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FormSuccess } from '@/features/auth/components'
import { cn } from '@/lib/utils'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const toast = useToast()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Profile edit form (seeded from the current user; reset when user changes).
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [savedUserId, setSavedUserId] = useState(user?.id ?? null)
  const [savingProfile, setSavingProfile] = useState(false)
  if (user && user.id !== savedUserId) {
    setSavedUserId(user.id)
    setName(user.name ?? '')
    setEmail(user.email ?? '')
  }

  const dirty =
    name.trim() !== (user?.name ?? '') || email.trim() !== (user?.email ?? '')

  async function saveProfile(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail || savingProfile || !dirty) return
    setSavingProfile(true)
    try {
      await updateProfile({ name: trimmedName, email: trimmedEmail })
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function sendResetLink() {
    if (!user?.email || sending) return
    setSending(true)
    try {
      await requestPasswordReset({ email: user.email })
      setSent(true)
      toast.success('Password reset link sent. Check your email.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send the reset link.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, password, and appearance.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-4 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="set-name">Name</Label>
              <Input
                id="set-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-email">Email</Label>
              <Input
                id="set-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!dirty || savingProfile || !name.trim() || !email.trim()}
                className="gap-2"
              >
                {savingProfile && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We’ll email a secure link to{' '}
            <span className="font-medium text-foreground">{user?.email}</span> to
            reset your password. The link expires in one hour.
          </p>
          {sent && (
            <FormSuccess>
              If an account with that email exists, a reset link has been sent.
            </FormSuccess>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={sendResetLink} disabled={sending} className="gap-2">
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {sent ? 'Resend reset link' : 'Send password reset link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="size-4 text-primary" />
            ) : (
              <Sun className="size-4 text-primary" />
            )}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                {theme === 'dark' ? 'Dark' : 'Light'} mode, saved
                on this device.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-border transition-colors',
                theme === 'dark' ? 'bg-primary/30' : 'bg-secondary',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-5 items-center justify-center rounded-full bg-card shadow transition-transform',
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1',
                )}
              >
                {theme === 'dark' ? (
                  <Moon className="size-3 text-primary" />
                ) : (
                  <Sun className="size-3 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
