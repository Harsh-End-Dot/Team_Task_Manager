import {
  Bell,
  KanbanSquare,
  Layers,
  Lock,
  Users,
  Zap,
} from 'lucide-react'

import { RevealOnScroll, Stagger, StaggerItem } from '@/components/motion'

const FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Kanban that keeps up',
    body: 'Drag, drop, and reorder tasks with optimistic updates that feel instant, with no waiting on the server.',
  },
  {
    icon: Zap,
    title: 'Real-time by default',
    body: 'Changes sync live across every teammate over WebSockets. The board is always the single source of truth.',
  },
  {
    icon: Users,
    title: 'Multi-tenant workspaces',
    body: 'Separate workspaces with their own projects, members, and roles. Switch context in a click.',
  },
  {
    icon: Lock,
    title: 'Role-based access',
    body: 'Admins and members get exactly the permissions they need, scoped per workspace, so nothing leaks.',
  },
  {
    icon: Layers,
    title: 'Projects, labels & subtasks',
    body: 'Organize work the way your team thinks, with nested subtasks, color labels, and per-project progress.',
  },
  {
    icon: Bell,
    title: 'Comments & mentions',
    body: 'Discuss work in context, @mention teammates, and keep an activity trail of everything that happened.',
  },
]

function FeatureCard({ icon: Icon, title, body }) {
  return (
    <StaggerItem className="group h-full">
      <div className="h-full rounded-xl border border-border bg-card/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-[0_18px_50px_-24px_hsl(var(--primary)/0.5)]">
        <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-secondary/60 text-primary transition-colors group-hover:border-primary/40">
          <Icon className="size-5" />
        </span>
        <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </StaggerItem>
  )
}

export function Features() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
      <RevealOnScroll className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium text-primary">Everything in one place</span>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Built for the way teams actually work
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          A focused set of features that cover planning, execution, and collaboration,
          without the bloat.
        </p>
      </RevealOnScroll>

      <Stagger className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </Stagger>
    </section>
  )
}
