import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useCreateWorkspace } from '@/features/workspace/hooks'

/**
 * Modal for creating a workspace. On success it selects the new workspace and
 * closes. Used by the switcher's "Create workspace" item and the empty state.
 * The form lives in a child that mounts only while open, so its state (and the
 * create mutation) start fresh every time - no reset effect needed.
 */
export function CreateWorkspaceDialog({ open, onOpenChange }) {
  return (
    <AnimatePresence>
      {open && (
        <CreateWorkspaceForm key="create-ws" onClose={() => onOpenChange(false)} />
      )}
    </AnimatePresence>
  )
}

function CreateWorkspaceForm({ onClose }) {
  const reduce = useReducedMotion()
  const { selectWorkspace } = useWorkspace()
  const create = useCreateWorkspace()
  const [name, setName] = useState('')

  // Close on Escape (the handler runs on a keydown event, not in render).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || create.isPending) return
    create.mutate(
      { name: trimmed },
      {
        onSuccess: (workspace) => {
          selectWorkspace(workspace.id)
          onClose()
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ws-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 id="create-ws-title" className="text-lg font-semibold tracking-tight">
          Create workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A workspace is where your team&apos;s projects and tasks live.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <FormError>
            {create.isError &&
              getErrorMessage(create.error, 'Could not create workspace.')}
          </FormError>

          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              maxLength={120}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_8px_30px_-12px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create workspace
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
