import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Mail } from 'lucide-react'

import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { useCreateInvitation } from './hooks'

function inviteLink(token) {
  return `${window.location.origin}/accept-invite?token=${encodeURIComponent(
    token,
  )}`
}

export function InviteMemberDialog({ open, onClose, workspaceId }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null) // created invitation (with token)
  const [copied, setCopied] = useState(false)
  const prefersReduced = useReducedMotion()
  const toast = useToast()
  const { mutateAsync, isPending } = useCreateInvitation(workspaceId)

  function resetForm() {
    setEmail('')
    setRole('MEMBER')
    setError(null)
    setResult(null)
    setCopied(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required.')
      return
    }
    setError(null)
    try {
      const invitation = await mutateAsync({ email: trimmed, role })
      setResult(invitation)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not create invitation.')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink(result.token))
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={prefersReduced ? { duration: 0 } : undefined}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {result ? (
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Invitation ready</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invited <span className="font-medium text-foreground">{result.email}</span>{' '}
                  as {result.role === 'ADMIN' ? 'an admin' : 'a member'}. Email
                  delivery may not be configured, so share this link so they can
                  join:
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink(result.token)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Invitation link"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    aria-label="Copy invite link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Invite another
                  </Button>
                  <Button type="button" onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Invite member</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send an invitation to join this workspace.
                </p>
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="invite-email"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teammate@example.com"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="invite-role"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Role
                    </label>
                    <select
                      id="invite-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? 'Inviting…' : 'Send invite'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
