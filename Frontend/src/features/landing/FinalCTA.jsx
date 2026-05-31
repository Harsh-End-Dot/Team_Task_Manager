import { ArrowRight } from 'lucide-react'

import { CtaButton } from '@/components/CtaButton'
import { RevealOnScroll } from '@/components/motion'

export function FinalCTA() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
      <RevealOnScroll className="relative overflow-hidden rounded-3xl border border-border bg-card/60 px-6 py-16 text-center sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-brand-violet/20 blur-[120px]"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Bring your team’s work into focus
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
            Start free, invite your team, and ship your first board today. No credit card
            required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton to="/signup" size="lg">
              Get started free
              <ArrowRight className="size-4" />
            </CtaButton>
            <CtaButton to="/login" size="lg" variant="outline" glow={false}>
              Sign in
            </CtaButton>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  )
}
