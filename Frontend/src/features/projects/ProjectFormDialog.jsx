import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'

/**
 * Create/edit dialog for a project. `project` (optional) puts the form in edit
 * mode and prefills the fields. `onSubmit(payload)` returns a promise; the
 * caller owns the mutation, this owns the form + error UX. Mounts fresh each
 * open (keyed by the parent's AnimatePresence) so no reset effect is needed.
 */
export function ProjectFormDialog({ open, onOpenChange, project, onSubmit }) {
  return (
    <AnimatePresence>
      {open && (
        <ProjectForm
          key={project?.id ?? 'create'}
          project={project}
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
        />
      )}
    </AnimatePresence>
  )
}

function ProjectForm({ project, onSubmit, onClose }) {
  const reduce = useReducedMotion()
  const editing = Boolean(project)

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [dueDate, setDueDate] = useState(project?.due_date ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    // PATCH/POST share this shape; null clears optional fields server-side.
    const payload = {
      name: trimmed,
      description: description.trim() || null,
      due_date: dueDate || null,
    }
    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the project.'))
      setSubmitting(false)
    }
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
        aria-labelledby="project-form-title"
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

        <h2 id="project-form-title" className="text-lg font-semibold tracking-tight">
          {editing ? 'Edit project' : 'Create project'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {editing
            ? 'Update this project’s details.'
            : 'Group related tasks under a project.'}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <FormError>{error}</FormError>

          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website Redesign"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about? (optional)"
              rows={3}
              className="flex w-full resize-y rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-due">Due date</Label>
            <Input
              id="p-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="[color-scheme:dark]"
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
              disabled={!name.trim() || submitting}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_8px_30px_-12px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5',
                'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
              )}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editing ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
