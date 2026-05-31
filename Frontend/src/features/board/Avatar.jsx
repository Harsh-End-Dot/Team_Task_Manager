import { User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { initials } from '@/features/shell/helpers'

// Deterministic hue from an id so each assignee gets a stable colour.
function hueFromId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  return h
}

/**
 * Assignee avatar. Resolves the assignee's name from `directory` (a map of
 * userId -> { name, email }, built from the workspace members) or from the
 * current user, falling back to a glyph only when the name is unknown.
 */
export function AssigneeAvatar({ assigneeId, me, directory, size = 'sm', className }) {
  const dim = size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs'

  if (!assigneeId) {
    return (
      <span
        title="Unassigned"
        className={cn(
          'flex items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/60',
          dim,
          className,
        )}
      >
        <User className="size-3.5" />
      </span>
    )
  }

  const isMe = me && assigneeId === me.id
  const resolved = isMe ? me : directory?.[assigneeId]
  const name = resolved?.name || resolved?.email || ''
  const hue = hueFromId(assigneeId)
  const title = isMe
    ? 'Assigned to you'
    : name
      ? `Assigned to ${name}`
      : 'Assigned'
  return (
    <span
      title={title}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/15',
        dim,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 65% 52%), hsl(${(hue + 40) % 360} 65% 45%))`,
      }}
    >
      {name ? initials(name) : <User className="size-3.5" />}
    </span>
  )
}
