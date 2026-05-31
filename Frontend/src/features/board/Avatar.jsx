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
 * Assignee avatar. The backend doesn't expose member names here (Phase 9), so we
 * only have a real name for the current user - others get a coloured glyph.
 */
export function AssigneeAvatar({ assigneeId, me, size = 'sm', className }) {
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
  const hue = hueFromId(assigneeId)
  return (
    <span
      title={isMe ? 'Assigned to you' : 'Assigned'}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/15',
        dim,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 65% 52%), hsl(${(hue + 40) % 360} 65% 45%))`,
      }}
    >
      {isMe ? initials(me.name || me.email) : <User className="size-3.5" />}
    </span>
  )
}
