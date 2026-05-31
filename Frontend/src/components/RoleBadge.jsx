import { Shield, ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'

const META = {
  ADMIN: {
    label: 'Admin',
    icon: ShieldCheck,
    cls: 'border-primary/40 bg-primary/15 text-primary',
  },
  MEMBER: {
    label: 'Member',
    icon: Shield,
    cls: 'border-border bg-secondary/60 text-muted-foreground',
  },
}

/**
 * Small role pill. Admin uses the purple accent; Member is neutral. Renders
 * nothing for an unknown/loading role so it never flashes a wrong value.
 */
export function RoleBadge({ role, withIcon = false, className }) {
  const meta = META[role]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        meta.cls,
        className,
      )}
    >
      {withIcon && <Icon className="size-3" />}
      {meta.label}
    </span>
  )
}
