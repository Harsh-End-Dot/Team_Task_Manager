import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Send,
  MessageSquare,
  ListChecks,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/apiError'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'
import { useMembers } from '@/features/workspace/hooks'
import { STATUS_META, PRIORITY_META } from '@/features/dashboard/meta'
import { LabelChip } from './LabelChip'
import { COLUMN_ORDER } from './constants'
import { tasksKey } from './hooks'
import {
  getTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  attachLabel,
  detachLabel,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  fetchComments,
  createComment,
  deleteComment,
} from './api'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

function initials(name) {
  const s = (name || '?').trim()
  const p = s.split(/\s+/).filter(Boolean)
  return (p.length >= 2 ? p[0][0] + p[1][0] : s.slice(0, 2)).toUpperCase()
}

function fmtTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Render a comment body, highlighting @<email> tokens that resolved to a mention.
function CommentBody({ body, mentioned }) {
  const byEmail = useMemo(() => {
    const m = new Map()
    for (const u of mentioned || []) m.set(u.email.toLowerCase(), u)
    return m
  }, [mentioned])
  // Split on @<email> tokens (the email itself contains an @).
  const parts = body.split(/(@[\w.+-]+@[\w-]+\.[\w.-]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const u = byEmail.get(part.slice(1).toLowerCase())
          if (u) {
            return (
              <span
                key={i}
                className="rounded bg-primary/15 px-1 font-medium text-primary"
              >
                @{u.name}
              </span>
            )
          }
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export function TaskDetailDialog({ open, onOpenChange, task, labels = [] }) {
  const reduce = useReducedMotion()
  const { currentWorkspaceId, isAdmin } = useWorkspace()
  const { user } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const { data: members = [] } = useMembers(currentWorkspaceId)

  // AnimatePresence keeps the last-rendered panel mounted through the exit
  // animation, so we can key everything off `task` directly (no retain ref).
  const taskId = task?.id

  const {
    data: full,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: open && Boolean(taskId),
    initialData: task,
  })

  const projectId = full?.project_id ?? task?.project_id

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ['task', taskId] })
    if (projectId) qc.invalidateQueries({ queryKey: tasksKey(projectId) })
  }

  // Member directory (Phase 9 members carry a nested `user`); include self.
  const usersById = useMemo(() => {
    const map = {}
    for (const m of members) if (m.user) map[m.user_id] = m.user
    if (user) map[user.id] = { id: user.id, name: user.name, email: user.email }
    return map
  }, [members, user])
  const displayName = (uid) => usersById[uid]?.name || 'Unknown member'

  // Permissions mirror the backend so the UI doesn't offer actions that 403.
  const meId = user?.id
  const canEdit = Boolean(isAdmin || (full && full.assignee_id === meId))
  const canAssign = Boolean(isAdmin)

  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  // --- field editors (uncontrolled + refs, keyed by task id so they reset
  // when switching tasks - avoids a state-sync effect) ---------------------
  const titleRef = useRef(null)
  const descRef = useRef(null)

  async function savePatch(patch, { revert } = {}) {
    try {
      await updateTask(taskId, patch)
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save changes.'))
      revert?.()
      invalidateAll()
    }
  }

  async function saveTitle() {
    const el = titleRef.current
    if (!el) return
    const next = el.value.trim()
    if (!next || next === full.title) {
      el.value = full.title
      return
    }
    await savePatch(
      { title: next },
      {
        revert: () => {
          el.value = full.title
        },
      },
    )
  }

  async function saveDescription() {
    const el = descRef.current
    if (!el) return
    const next = el.value
    if ((full.description ?? '') === next) return
    await savePatch(
      { description: next || null },
      {
        revert: () => {
          el.value = full.description ?? ''
        },
      },
    )
  }

  async function changeStatus(status) {
    if (status === full.status) return
    try {
      await updateTaskStatus({ taskId, status })
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change status.'))
      invalidateAll()
    }
  }

  async function changeAssignee(value) {
    const assignee = value || null
    if (assignee === (full.assignee_id ?? null)) return
    try {
      await assignTask(taskId, assignee)
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change assignee.'))
      invalidateAll()
    }
  }

  // --- labels --------------------------------------------------------------
  const attachedIds = new Set((full?.labels ?? []).map((l) => l.id))
  const available = labels.filter((l) => !attachedIds.has(l.id))
  const [labelPickerOpen, setLabelPickerOpen] = useState(false)

  async function toggleLabel(labelId, attached) {
    try {
      if (attached) await detachLabel({ taskId, labelId })
      else await attachLabel({ taskId, labelId })
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update labels.'))
      invalidateAll()
    }
  }

  // --- subtasks (optimistic toggle) ---------------------------------------
  const [newSubtask, setNewSubtask] = useState('')
  const subtasks = full?.subtasks ?? []
  const doneCount = subtasks.filter((s) => s.is_done).length
  const pct = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0

  async function addSubtask(e) {
    e.preventDefault()
    const t = newSubtask.trim()
    if (!t) return
    setNewSubtask('')
    try {
      await createSubtask(taskId, t)
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add subtask.'))
      setNewSubtask(t)
    }
  }

  async function toggleSubtask(st) {
    // Optimistic flip in the task cache, rollback on error.
    qc.setQueryData(['task', taskId], (old) =>
      old
        ? {
            ...old,
            subtasks: old.subtasks.map((s) =>
              s.id === st.id ? { ...s, is_done: !s.is_done } : s,
            ),
          }
        : old,
    )
    try {
      await updateSubtask(st.id, { is_done: !st.is_done })
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update subtask.'))
      invalidateAll()
    }
  }

  async function removeSubtask(st) {
    try {
      await deleteSubtask(st.id)
      invalidateAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete subtask.'))
      invalidateAll()
    }
  }

  // --- comments + mentions -------------------------------------------------
  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => fetchComments(taskId),
    enabled: open && Boolean(taskId),
  })

  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const taRef = useRef(null)

  const mentionCandidates = useMemo(() => {
    if (mentionQuery == null) return []
    const q = mentionQuery
    return members
      .filter((m) => m.user)
      .filter(
        (m) =>
          !q ||
          m.user.name.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q),
      )
      .slice(0, 6)
  }, [members, mentionQuery])

  function onCommentChange(e) {
    const val = e.target.value
    setCommentBody(val)
    const caret = e.target.selectionStart ?? val.length
    const m = val.slice(0, caret).match(/@([^\s@]*)$/)
    setMentionQuery(m ? m[1].toLowerCase() : null)
  }

  function insertMention(member) {
    const ta = taRef.current
    const caret = ta?.selectionStart ?? commentBody.length
    const before = commentBody
      .slice(0, caret)
      .replace(/@([^\s@]*)$/, `@${member.user.email} `)
    const next = before + commentBody.slice(caret)
    setCommentBody(next)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      ta?.focus()
      ta?.setSelectionRange(before.length, before.length)
    })
  }

  async function postComment(e) {
    e.preventDefault()
    const body = commentBody.trim()
    if (!body || posting) return
    setPosting(true)
    try {
      await createComment(taskId, body)
      setCommentBody('')
      setMentionQuery(null)
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not post comment.'))
    } finally {
      setPosting(false)
    }
  }

  async function removeComment(c) {
    try {
      await deleteComment(c.id)
      qc.invalidateQueries({ queryKey: ['comments', taskId] })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete comment.'))
    }
  }

  const status = full ? STATUS_META[full.status] : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.aside
            className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-border/60 bg-card shadow-2xl"
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {status && (
                  <span className={cn('inline-flex items-center gap-1.5', status.color)}>
                    <span className={cn('size-2 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {isLoading && !full ? (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : isError && !full ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                <AlertCircle className="size-6 text-destructive" />
                Couldn&apos;t load this task.
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 hover:bg-secondary/60"
                >
                  <RefreshCw className="size-4" /> Retry
                </button>
              </div>
            ) : full ? (
              <div className="flex-1 space-y-6 px-5 py-5">
                {/* title */}
                <input
                  key={`${full.id}:title`}
                  ref={titleRef}
                  defaultValue={full.title}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  readOnly={!canEdit}
                  className={cn(
                    'w-full rounded-lg bg-transparent text-xl font-semibold text-foreground outline-none',
                    canEdit && 'focus:bg-secondary/40 focus:px-2 focus:py-1',
                  )}
                />

                {/* meta grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Status">
                    <select
                      value={full.status}
                      onChange={(e) => changeStatus(e.target.value)}
                      disabled={!canEdit}
                      className={selectCls}
                    >
                      {COLUMN_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select
                      value={full.priority}
                      onChange={(e) =>
                        savePatch({ priority: e.target.value })
                      }
                      disabled={!canEdit}
                      className={selectCls}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_META[p].label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Assignee">
                    <select
                      value={full.assignee_id ?? ''}
                      onChange={(e) => changeAssignee(e.target.value)}
                      disabled={!canAssign}
                      className={selectCls}
                      title={!canAssign ? 'Only admins can assign' : undefined}
                    >
                      <option value="">Unassigned</option>
                      {members
                        .filter((m) => m.user)
                        .map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.user.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Due date">
                    <input
                      type="date"
                      value={full.due_date ?? ''}
                      onChange={(e) =>
                        savePatch({ due_date: e.target.value || null })
                      }
                      disabled={!canEdit}
                      className={cn(selectCls, '[color-scheme:dark]')}
                    />
                  </Field>
                </div>

                {/* description */}
                <Field label="Description">
                  <textarea
                    key={`${full.id}:desc`}
                    ref={descRef}
                    defaultValue={full.description ?? ''}
                    onBlur={saveDescription}
                    readOnly={!canEdit}
                    rows={3}
                    placeholder={canEdit ? 'Add a description…' : 'No description'}
                    className="w-full resize-y rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </Field>

                {/* labels */}
                <section>
                  <SectionTitle>Labels</SectionTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {(full.labels ?? []).map((l) => (
                      <LabelChip
                        key={l.id}
                        label={l}
                        onRemove={canEdit ? () => toggleLabel(l.id, true) : undefined}
                      />
                    ))}
                    {(full.labels ?? []).length === 0 && (
                      <span className="text-sm text-muted-foreground">No labels</span>
                    )}
                    {canEdit && available.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setLabelPickerOpen((v) => !v)}
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-3" /> Add
                        </button>
                        {labelPickerOpen && (
                          <div className="absolute z-20 mt-1 w-44 rounded-lg border border-border/70 bg-popover p-1 shadow-xl">
                            {available.map((l) => (
                              <button
                                key={l.id}
                                onClick={() => {
                                  toggleLabel(l.id, false)
                                  setLabelPickerOpen(false)
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary/70"
                              >
                                <span
                                  className="size-2.5 rounded-full"
                                  style={{ backgroundColor: l.color || '#888' }}
                                />
                                {l.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* subtasks */}
                <section>
                  <SectionTitle>
                    <ListChecks className="size-4" /> Subtasks
                    {subtasks.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {doneCount}/{subtasks.length}
                      </span>
                    )}
                  </SectionTitle>
                  {subtasks.length > 0 && (
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <ul className="space-y-1">
                    {subtasks.map((st) => (
                      <li
                        key={st.id}
                        className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-secondary/40"
                      >
                        <input
                          type="checkbox"
                          checked={st.is_done}
                          onChange={() => canEdit && toggleSubtask(st)}
                          disabled={!canEdit}
                          className="size-4 accent-primary"
                        />
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            st.is_done && 'text-muted-foreground line-through',
                          )}
                        >
                          {st.title}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => removeSubtask(st)}
                            aria-label="Delete subtask"
                            className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                    {subtasks.length === 0 && (
                      <li className="text-sm text-muted-foreground">No subtasks yet.</li>
                    )}
                  </ul>
                  {canEdit && (
                    <form onSubmit={addSubtask} className="mt-2 flex gap-2">
                      <input
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Add a subtask…"
                        className="flex-1 rounded-lg border border-border/70 bg-background/40 px-3 py-1.5 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-lg bg-secondary px-3 text-sm hover:bg-secondary/70"
                      >
                        <Plus className="size-4" />
                      </button>
                    </form>
                  )}
                </section>

                {/* comments */}
                <section>
                  <SectionTitle>
                    <MessageSquare className="size-4" /> Comments
                  </SectionTitle>

                  {commentsLoading ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="mx-auto size-4 animate-spin" />
                    </div>
                  ) : commentsError ? (
                    <div className="py-2 text-sm text-muted-foreground">
                      Couldn&apos;t load comments.{' '}
                      <button
                        onClick={() => refetchComments()}
                        className="text-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      No comments yet. Start the conversation.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((c) => {
                        const canDelete = isAdmin || c.author_id === meId
                        return (
                          <li key={c.id} className="flex gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#3B82F6] text-xs font-semibold text-white">
                              {initials(displayName(c.author_id))}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {displayName(c.author_id)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {fmtTime(c.created_at)}
                                </span>
                                {canDelete && (
                                  <button
                                    onClick={() => removeComment(c)}
                                    aria-label="Delete comment"
                                    className="ml-auto text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                              <CommentBody body={c.body} mentioned={c.mentioned_users} />
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {/* composer */}
                  <form onSubmit={postComment} className="relative mt-3">
                    <textarea
                      ref={taRef}
                      value={commentBody}
                      onChange={onCommentChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(e)
                      }}
                      rows={2}
                      placeholder="Write a comment…  (@ to mention)"
                      className="w-full resize-y rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    {mentionCandidates.length > 0 && (
                      <div className="absolute bottom-full left-0 z-20 mb-1 w-60 overflow-hidden rounded-lg border border-border/70 bg-popover shadow-xl">
                        {mentionCandidates.map((m) => (
                          <button
                            key={m.user_id}
                            type="button"
                            onClick={() => insertMention(m)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary/70"
                          >
                            <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                              {initials(m.user.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate">{m.user.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {m.user.email}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={!commentBody.trim() || posting}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {posting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        Comment
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const selectCls =
  'w-full rounded-lg border border-border/70 bg-background/40 px-2 py-1.5 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-70'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
      {children}
    </h3>
  )
}
