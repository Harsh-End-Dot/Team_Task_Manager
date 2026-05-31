import { useState } from 'react'
import {
  FolderKanban,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { FadeUp, Stagger, StaggerItem } from '@/components/motion'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'

const STEPS = [
  { title: 'Create Workspace', desc: 'Get started' },
  { title: 'Invite Members', desc: 'Add your team' },
  { title: 'Create Project', desc: 'Organize work' },
  { title: 'Start Tracking', desc: 'Get things done' },
]

const FEATURES = [
  { icon: Users, title: 'Collaborate', desc: 'Invite your team and work together' },
  { icon: FolderKanban, title: 'Organize', desc: 'Keep projects and tasks in one place' },
  { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor and deliver results on time' },
]

/**
 * Premium onboarding screen shown when the signed-in user belongs to no
 * workspace. Three zones over the purple-glow background: a getting-started
 * stepper (left), the welcome + create flow (center), and a faux-isometric CSS
 * illustration (right). The primary CTA drives the existing POST /workspaces
 * flow via CreateWorkspaceDialog.
 */
export function WorkspaceEmptyState() {
  const { user, logout } = useAuth()
  const [creating, setCreating] = useState(false)
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : ''

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07060e]">
      {/* Purple-glow background + dark overlay for contrast */}
      <div aria-hidden className="absolute inset-0 z-0">
        <img
          src="/auth-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full scale-[1.45] object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#07060e]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07060e]/55 via-transparent to-[#07060e]/45" />
        <div className="absolute -bottom-[12%] left-1/2 h-[55%] w-[80%] -translate-x-1/2 rounded-[50%] bg-brand-violet/25 blur-[140px]" />
      </div>

      {/* Logout escape hatch */}
      <button
        type="button"
        onClick={logout}
        className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <LogOut className="size-4" />
        Log out
      </button>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20 xl:max-w-7xl">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[220px_minmax(0,1fr)_300px] xl:gap-16 xl:grid-cols-[250px_minmax(0,1fr)_380px]">
          {/* LEFT - getting-started stepper */}
          <div className="order-2 lg:order-1">
            <Stagger>
              <StaggerItem>
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Getting started
                </p>
              </StaggerItem>
              {STEPS.map((step, i) => {
                const active = i === 0
                const last = i === STEPS.length - 1
                return (
                  <StaggerItem key={step.title}>
                    <div className="relative flex gap-4 pb-7 last:pb-0">
                      {!last && (
                        <span
                          aria-hidden
                          className="absolute bottom-1 left-[17px] top-10 w-px bg-gradient-to-b from-border to-border/20"
                        />
                      )}
                      <span
                        className={
                          'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ' +
                          (active
                            ? 'bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground shadow-[0_0_22px_-4px_hsl(var(--primary))] ring-1 ring-white/20'
                            : 'border border-border bg-secondary/40 text-muted-foreground')
                        }
                      >
                        {i + 1}
                      </span>
                      <div className="pt-1">
                        <p
                          className={
                            'text-sm font-semibold ' +
                            (active ? 'text-foreground' : 'text-muted-foreground')
                          }
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground/70">{step.desc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                )
              })}
            </Stagger>
          </div>

          {/* CENTER - welcome + create flow */}
          <div className="order-1 lg:order-2">
            <Stagger className="mx-auto w-full max-w-xl text-center">
              <StaggerItem>
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground shadow-[0_12px_45px_-12px_hsl(var(--primary))] ring-1 ring-white/15">
                  <Sparkles className="size-8" />
                </span>
              </StaggerItem>

              <StaggerItem>
                <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome,{' '}
                  <span className="bg-gradient-to-r from-brand-indigo via-primary to-brand-bloom bg-clip-text text-transparent">
                    {firstName || 'there'}
                  </span>{' '}
                  👋
                </h1>
              </StaggerItem>

              <StaggerItem>
                <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
                  You&apos;re not part of any workspace yet. Create one to start
                  organizing projects and tasks with your team.
                </p>
              </StaggerItem>

              <StaggerItem>
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div
                      key={title}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-sm transition-colors hover:border-white/20"
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/90 to-brand-bloom/90 text-primary-foreground shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.85)]">
                        <Icon className="size-[18px]" />
                      </span>
                      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </StaggerItem>

              <StaggerItem>
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="group mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-brand-bloom font-semibold text-primary-foreground shadow-[0_12px_40px_-12px_hsl(var(--primary))] ring-1 ring-white/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="size-5 transition-transform group-hover:rotate-90" />
                  Create workspace
                </button>
              </StaggerItem>

              <StaggerItem>
                <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
                  <ShieldCheck className="size-3.5" />
                  Your data is secure and private
                </p>
              </StaggerItem>
            </Stagger>
          </div>

          {/* RIGHT - faux-isometric illustration (CSS/SVG only) */}
          <div className="order-3 hidden lg:block">
            <FadeUp delay={0.2}>
              <IsometricIllustration />
            </FadeUp>
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </main>
  )
}

/** Avatars for the "Team" panel - initials only, no real photos. */
const TEAM = [
  { initials: 'AK', from: 'from-violet-500', to: 'to-indigo-500' },
  { initials: 'JD', from: 'from-fuchsia-500', to: 'to-purple-500' },
  { initials: 'MR', from: 'from-sky-500', to: 'to-blue-500' },
]

/**
 * Faux-3D illustration using CSS perspective + transforms only (no 3D engine).
 * Three floating glass panels - Tasks, Progress (a ~78% ring), and Team -
 * tilted into an isometric group with a soft purple glow. Float animation is
 * disabled under prefers-reduced-motion.
 */
function IsometricIllustration() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[360px]" style={{ perspective: '1300px' }}>
      {/* Soft purple glow behind the stack */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-violet/30 blur-[90px]"
      />

      <div
        className="relative h-full w-full [transform-style:preserve-3d]"
        style={{ transform: 'rotateX(16deg) rotateY(-20deg) rotateZ(3deg)' }}
      >
        {/* Tasks panel */}
        <div className="absolute left-0 top-2 w-56 animate-float rounded-2xl border border-white/12 bg-[#0c0a16]/85 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl motion-reduce:animate-none">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Tasks</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              5 active
            </span>
          </div>
          <div className="space-y-2">
            {['Design system', 'API integration', 'Onboarding flow'].map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <span
                  className={
                    'size-3.5 shrink-0 rounded-[5px] ' +
                    (i === 0
                      ? 'bg-gradient-to-br from-primary to-brand-bloom'
                      : 'border border-white/20 bg-white/5')
                  }
                />
                <span
                  className={
                    'text-[11px] ' +
                    (i === 0 ? 'text-muted-foreground line-through' : 'text-foreground/80')
                  }
                >
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress panel - ~78% ring */}
        <div
          className="absolute right-0 top-36 w-44 animate-float rounded-2xl border border-white/12 bg-[#0c0a16]/85 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl motion-reduce:animate-none"
          style={{ animationDelay: '1.4s' }}
        >
          <span className="text-xs font-semibold text-foreground">Progress</span>
          <div className="mt-3 flex items-center justify-center">
            <div className="relative size-24">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset="55.3"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--brand-indigo))" />
                    <stop offset="100%" stopColor="hsl(var(--brand-bloom))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">78%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team panel */}
        <div
          className="absolute bottom-3 left-6 w-52 animate-float rounded-2xl border border-white/12 bg-[#0c0a16]/85 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl motion-reduce:animate-none"
          style={{ animationDelay: '0.7s' }}
        >
          <span className="text-xs font-semibold text-foreground">Team</span>
          <div className="mt-3 flex items-center">
            <div className="flex -space-x-2">
              {TEAM.map((m) => (
                <span
                  key={m.initials}
                  className={
                    'flex size-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white ring-2 ring-[#0c0a16] ' +
                    m.from +
                    ' ' +
                    m.to
                  }
                >
                  {m.initials}
                </span>
              ))}
              <span className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10px] font-medium text-muted-foreground ring-2 ring-[#0c0a16]">
                +4
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
