import { Check } from 'lucide-react'

import { RevealOnScroll } from '@/components/motion'

const POINTS = [
  'Optimistic drag-and-drop across To do, In progress, and Done',
  'Live cursors and updates the moment a teammate moves a card',
  'Filter by assignee, label, priority, and due date',
]

export function ProductHighlight() {
  return (
    <section id="integrations" className="relative overflow-hidden border-y border-border/60 bg-card/30">
      {/* restrained ambient accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:py-28">
        <RevealOnScroll>
          <span className="text-sm font-medium text-primary">The board</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            A Kanban board your whole team trusts
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Move work forward without friction. Every drag is reflected instantly for
            everyone, so the board always tells the truth about where things stand.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-foreground/80">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        {/* Supporting visual - a restrained mini board (real markup) */}
        <RevealOnScroll className="lg:pl-6">
          <div className="rounded-xl border border-border bg-[#0b0a14] p-4 shadow-2xl">
            <div className="grid grid-cols-3 gap-3">
              {[
                { title: 'To do', n: 3, accent: 'bg-muted-foreground/40' },
                { title: 'In progress', n: 2, accent: 'bg-primary/70' },
                { title: 'Done', n: 4, accent: 'bg-emerald-400/70' },
              ].map((col, ci) => (
                <div key={col.title}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${col.accent}`} />
                    <span className="text-[11px] font-medium text-foreground/60">{col.title}</span>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: ci === 2 ? 3 : 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5"
                      >
                        <div className="h-1.5 w-12 rounded-full bg-white/10" />
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06]" />
                        <div className="mt-3 flex -space-x-1.5">
                          <span className="size-4 rounded-full border border-card bg-gradient-to-br from-primary/70 to-brand-bloom/70" />
                          <span className="size-4 rounded-full border border-card bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
