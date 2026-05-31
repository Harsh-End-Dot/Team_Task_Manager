import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'
import { useToast } from '@/hooks/useToast'
import { STATUS_META, PRIORITY_META } from '@/features/dashboard/meta'
import { COLUMN_ORDER } from './constants'
import { attachLabel } from './api'
import { useCreateTask } from './hooks'

const inputCls =
  'flex h-10 w-full rounded-md border border-input bg-background/40 px-3 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  initialStatus = 'TODO',
  members = [],
  me,
  labels = [],
  onCreated,
}) {
  return (
    <AnimatePresence>
      {open && (
        <CreateTaskForm
          key="create-task"
          projectId={projectId}
          initialStatus={initialStatus}
          members={members}
          me={me}
          labels={labels}
          onCreated={onCreated}
          onClose={() => onOpenChange(false)}
        />
      )}
    </AnimatePresence>
  )
}

function memberLabel(m, me) {
  if (me && m.user_id === me.id) return 'You'
  // Members carry a nested `user` object (name + email); see Team page / MemberCard.
  return m.user?.name || m.user?.email || `Member ${m.user_id.slice(0, 8)}`
}

function CreateTaskForm({
  projectId,
  initialStatus,
  members,
  me,
  labels,
  onCreated,
  onClose,
}) {
  const reduce = useReducedMotion()
  const toast = useToast()
  const create = useCreateTask()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('')
  const [labelIds, setLabelIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const toggleLabel = (id) =>
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const task = await create.mutateAsync({
        projectId,
        payload: {
          title: trimmed,
          description: description.trim() || null,
          status,
          priority,
          assignee_id: assignee || null,
          due_date: dueDate || null,
        },
      })
      // Labels aren't part of task create - attach each after creation.
      for (const labelId of labelIds) {
        try {
          await attachLabel({ taskId: task.id, labelId })
        } catch {
          toast.error('Task created, but a label could not be attached.')
        }
      }
      toast.success('Task created.')
      onCreated?.()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create task.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
        aria-labelledby="create-task-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/70 bg-card p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 id="create-task-title" className="text-lg font-semibold tracking-tight">
          New task
        </h2>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          <FormError>{error}</FormError>

          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add detail (optional)"
              rows={3}
              className={cn(inputCls, 'h-auto py-2')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-status">Status</Label>
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                {COLUMN_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-priority">Priority</Label>
              <select
                id="t-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputCls}
              >
                {Object.keys(PRIORITY_META).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due date</Label>
              <input
                id="t-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn(inputCls, '[color-scheme:dark]')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-assignee">Assignee</Label>
              <select
                id="t-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {memberLabel(m, me)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {labels.length > 0 && (
            <div className="space-y-1.5">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => {
                  const active = labelIds.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary/50 bg-primary/15 text-foreground'
                          : 'border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: l.color || 'hsl(var(--primary))' }}
                      />
                      {l.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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
              disabled={!title.trim() || submitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_8px_30px_-12px_hsl(var(--primary))] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
