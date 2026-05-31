import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Users, MoreVertical } from 'lucide-react'

import { useClickOutside } from '@/hooks/useClickOutside'

// Member card: large gradient avatar + corner role pill, real name/email, a
// one-line role description, and (admin-only, not your own card) a kebab menu to
// change the role or remove the member. Gradients map to the brand token family.
const GRADIENTS = {
  ADMIN: 'from-[#8B5CF6] to-[#A855F7]',
  MEMBER: 'from-[#6366F1] to-[#3B82F6]',
}

export function MemberCard({
  member,
  isYou,
  canManage = false,
  isLastAdmin = false,
  onRoleChange,
  onRemove,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  useClickOutside(menuRef, () => setMenuOpen(false))

  const name = member.user?.name || 'Workspace member'
  const email = member.user?.email || ''
  const role = member.role
  const isAdmin = role === 'ADMIN'

  function handleToggleRole() {
    setMenuOpen(false)
    onRoleChange?.(isAdmin ? 'MEMBER' : 'ADMIN')
  }

  function handleRemove() {
    setMenuOpen(false)
    onRemove?.()
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border bg-card/70 p-5 backdrop-blur"
    >
      {/* role-leaning border glow */}
      <div
        className={`pointer-events-none absolute inset-0 opacity-10 bg-gradient-to-br ${
          GRADIENTS[role] || GRADIENTS.MEMBER
        }`}
      />
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-white ${
            GRADIENTS[role] || GRADIENTS.MEMBER
          }`}
        >
          {(name?.[0] || '?').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{name}</p>
            {isYou && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                You
              </span>
            )}
          </div>
          {email && (
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          )}
        </div>
      </div>

      {/* role pill + admin actions */}
      <div className="relative mt-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isAdmin
              ? 'bg-[#8B5CF6]/15 text-[#A855F7]'
              : 'bg-[#6366F1]/15 text-[#6366F1]'
          }`}
        >
          {isAdmin ? <Crown className="h-3 w-3" /> : <Users className="h-3 w-3" />}
          {isAdmin ? 'Admin' : 'Member'}
        </span>

        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Manage ${name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-9 z-10 w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl"
              >
                <button
                  role="menuitem"
                  onClick={handleToggleRole}
                  disabled={isAdmin && isLastAdmin}
                  title={
                    isAdmin && isLastAdmin
                      ? 'Promote another member before demoting the last admin'
                      : undefined
                  }
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAdmin ? 'Make member' : 'Make admin'}
                </button>
                <button
                  role="menuitem"
                  onClick={handleRemove}
                  disabled={isAdmin && isLastAdmin}
                  title={
                    isAdmin && isLastAdmin
                      ? 'Cannot remove the last admin'
                      : undefined
                  }
                  className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove from workspace
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* role description */}
      <p className="relative mt-3 text-xs text-muted-foreground">
        {isAdmin
          ? 'Full access to workspace and all settings'
          : 'Can view and collaborate on projects'}
      </p>
    </motion.div>
  )
}
